import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useAppState } from '../context/AppContext';
import { snanCalendar, formatCrowd } from '../data/snanCalendar';
import { ghatLocations } from '../data/ghatLocations';
import {
  historicalKumbhData,
  resourceTemplates,
  simulateSurgeResponse,
  generateForecastChartData
} from '../data/surgeData';
import { forecastFootfall } from '../ml/forecast';

// Map camera movement helper
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 14, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Utility to format large pilgrim numbers (e.g. 2.2M)
function formatPilgrimNum(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function SurgeForecast() {
  const state = useAppState();

  // Inputs state
  const [selectedGhatId, setSelectedGhatId] = useState('triveni-sangam');
  const [selectedEventId, setSelectedEventId] = useState('makar-sankranti');
  const [pilgrimCount, setPilgrimCount] = useState(2500000);
  const [weather, setWeather] = useState('clear');
  const [congestionIndex, setCongestionIndex] = useState(5.5);
  const [activeTab, setActiveTab] = useState('forecast'); // 'forecast' | 'historical'
  
  // AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activeThinkingMsgIndex, setActiveThinkingMsgIndex] = useState(0);

  // Map focus override state
  const [mapFocus, setMapFocus] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);

  // Checklist items toggled state (stores item IDs)
  const [checkedItems, setCheckedItems] = useState(new Set());

  // Thinking messages list
  const thinkingMessages = [
    'Retrieving historical bathing crowd curves...',
    'Analyzing weather satellites & corridor friction...',
    'Running crowd model simulations (50,000 iterations)...',
    'Correlating with live ghat capacities & timelines...',
    'Generating optimal vehicle & security deployment coordinates...'
  ];

  // Live forecast updater that reacts to simulation time & input changes
  useEffect(() => {
    if (isAnalyzing) return;
    
    const ghatObj = ghatLocations.find(g => g.id === selectedGhatId) || ghatLocations[0];
    const [nowH, nowM] = state.simulationTime.split(':').map(Number);
    const totalMinsNow = nowH * 60 + nowM;
    
    // 1. Generate historical points up to now
    const historical = [];
    for (let min = 0; min <= totalMinsNow; min += 20) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      const currentHour = h + m / 60;
      const rad = (currentHour / 24) * Math.PI * 2;
      const morningFactor = Math.exp(-Math.pow((currentHour - 7) / 2.5, 2)) * 0.45;
      const eveningFactor = Math.exp(-Math.pow((currentHour - 18) / 3, 2)) * 0.25;
      const baseFactor = 0.15 + Math.sin(rad - Math.PI / 2) * 0.05;
      
      let targetRatio = Math.max(0.08, Math.min(0.95, baseFactor + morningFactor + eveningFactor));
      
      const scale = pilgrimCount / 2500000;
      targetRatio *= scale;
      
      if (weather === 'rain') targetRatio *= 0.85;
      else if (weather === 'fog') targetRatio *= 0.9;
      
      let crowdVal = Math.round(ghatObj.capacity * targetRatio);
      
      // Step 3 of demo triggers high surge on Sangam
      if (state.isDemoActive && selectedGhatId === 'triveni-sangam') {
        if (state.simulationTime >= '07:42') {
          const progress = min / 462;
          const multiplier = 1 + progress * 0.82;
          crowdVal = Math.round(crowdVal * Math.min(1.82, multiplier));
        }
      }
      
      crowdVal = Math.min(ghatObj.capacity, crowdVal);
      historical.push({
        time: timeStr,
        crowd: Math.round(crowdVal / 1000), // in thousands
      });
    }
    
    if (historical.length === 0) {
      historical.push({ time: '00:00', crowd: Math.round(ghatObj.capacity * 0.1 / 1000) });
    }
    
    // 2. Call the EWMA / Holt-Winters forecaster
    const forecastInput = historical.map(p => ({ time: p.time, crowd: p.crowd }));
    const forecastRaw = forecastFootfall(forecastInput, 0.3, 0.1, 6);
    
    // 3. Combine for Recharts
    const combined = historical.map(p => ({
      time: p.time,
      actual: p.crowd,
      predicted: null,
      upper: null,
      lower: null,
    }));
    
    // Connect actual and predicted lines
    const lastHist = historical[historical.length - 1];
    if (lastHist) {
      combined.push({
        time: lastHist.time,
        actual: lastHist.crowd,
        predicted: lastHist.crowd,
        upper: lastHist.crowd,
        lower: lastHist.crowd,
      });
    }
    
    forecastRaw.forEach(p => {
      combined.push({
        time: p.time,
        actual: null,
        predicted: p.predicted,
        upper: p.upper,
        lower: p.lower,
      });
    });
    
    setChartData(combined);
  }, [selectedGhatId, state.simulationTime, pilgrimCount, weather, congestionIndex, state.isDemoActive, isAnalyzing]);

  // Initialize data on mount
  useEffect(() => {
    // Generate initial forecast
    const initialResult = simulateSurgeResponse('makar-sankranti', 2500000, 'clear', 5.5);
    setForecastResult(initialResult);
  }, []);

  // Cycle thinking messages during loading
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setActiveThinkingMsgIndex((prev) => (prev + 1) % thinkingMessages.length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Form submission handler
  const handleGenerateForecast = (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    // Clear checklist choices on recalculation
    setCheckedItems(new Set());

    setTimeout(() => {
      const result = simulateSurgeResponse(selectedEventId, pilgrimCount, weather, congestionIndex);
      const chartPoints = generateForecastChartData(selectedEventId, pilgrimCount, weather, congestionIndex);
      setForecastResult(result);
      setChartData(chartPoints);
      setIsAnalyzing(false);
      setMapFocus(null); // Reset focus
    }, 2200);
  };

  // Toggle checklist checkbox
  const toggleChecklistItem = (itemId, targetId, lat, lng) => {
    const nextChecked = new Set(checkedItems);
    if (nextChecked.has(itemId)) {
      nextChecked.delete(itemId);
    } else {
      nextChecked.add(itemId);
      // Pan map to the resource being deployed!
      if (lat && lng) {
        setMapFocus([lat, lng]);
        setMapZoom(14.5);
      }
    }
    setCheckedItems(nextChecked);
  };

  // Resolve active resource capacity by joining static list with checklist increments
  const getModifiedResources = () => {
    const resources = JSON.parse(JSON.stringify(resourceTemplates));

    checkedItems.forEach((itemId) => {
      const item = forecastResult?.checklist.find((chk) => chk.id === itemId);
      if (!item || item.targetId === 'global') return;

      // Find inside resources structure and increment
      const targetCategory = item.type === 'bus' ? 'buses' : item.type === 'barrier' ? 'barriers' : 'medical';
      const resourceObj = resources[targetCategory].find((r) => r.id === item.targetId);
      if (resourceObj) {
        resourceObj.active += item.increment;
        resourceObj.deployed = true; // Flag to enable pulsing cyan ring
      }
    });

    return resources;
  };

  const activeResources = forecastResult ? getModifiedResources() : resourceTemplates;

  // Determine surge level styling
  const getSurgeColor = (val) => {
    if (val >= 8) return 'text-red border-red bg-red/10';
    if (val >= 5) return 'text-amber border-amber bg-amber/10';
    return 'text-green border-green bg-green/10';
  };

  const getSurgeBarColor = (val) => {
    if (val >= 8) return 'bg-red';
    if (val >= 5) return 'bg-amber';
    return 'bg-green';
  };

  // Format historical chart data
  const getHistoricalChartData = () => {
    // Generate normalized values matching the active pilgrim count for comparison
    const targetScale = pilgrimCount / 2000000;
    return [
      { hour: '00:00', 'Current Day (Est)': Math.round(150 * targetScale), '2013 Actual': 400, '2019 Actual': 550 },
      { hour: '02:00', 'Current Day (Est)': Math.round(300 * targetScale), '2013 Actual': 620, '2019 Actual': 800 },
      { hour: '04:00', 'Current Day (Est)': Math.round(800 * targetScale), '2013 Actual': 850, '2019 Actual': 1200 },
      { hour: '06:00', 'Current Day (Est)': Math.round(1400 * targetScale), '2013 Actual': 1100, '2019 Actual': 1650 },
      { hour: '08:00', 'Current Day (Est)': Math.round(1100 * targetScale), '2013 Actual': 950, '2019 Actual': 1400 },
      { hour: '10:00', 'Current Day (Est)': Math.round(800 * targetScale), '2013 Actual': 750, '2019 Actual': 1100 },
      { hour: '12:00', 'Current Day (Est)': Math.round(550 * targetScale), '2013 Actual': 600, '2019 Actual': 880 },
      { hour: '14:00', 'Current Day (Est)': Math.round(400 * targetScale), '2013 Actual': 520, '2019 Actual': 750 },
      { hour: '16:00', 'Current Day (Est)': Math.round(350 * targetScale), '2013 Actual': 450, '2019 Actual': 680 },
      { hour: '18:00', 'Current Day (Est)': Math.round(750 * targetScale), '2013 Actual': 580, '2019 Actual': 920 },
      { hour: '20:00', 'Current Day (Est)': Math.round(500 * targetScale), '2013 Actual': 500, '2019 Actual': 780 },
      { hour: '22:00', 'Current Day (Est)': Math.round(300 * targetScale), '2013 Actual': 380, '2019 Actual': 600 },
    ];
  };

  const selectedGhatObj = ghatLocations.find(g => g.id === selectedGhatId) || ghatLocations[0];
  const capacityK = selectedGhatObj.capacity / 1000;
  const hasSurgeAlert = chartData.some(p => p.predicted !== null && p.predicted > capacityK * 0.85);

  return (
    <div className="flex-1 flex flex-col sm:flex-row h-[calc(100vh-88px)] max-sm:h-[calc(100vh-96px)] overflow-hidden bg-navy">
      {/* LEFT COLUMN: Controls & Forecast Analytics */}
      <div className="w-full sm:w-[45%] lg:w-[42%] h-full flex flex-col p-6 lg:p-8 overflow-y-auto border-r border-border gap-12 scrollbar bg-navy-light z-10">
        
        {/* Header */}
        <div className="space-y-1 shrink-0">
          <h1 className="text-3xl font-bold font-heading text-text-primary tracking-tight">
            Surge Forecast
          </h1>
          <p className="text-sm text-text-secondary font-heading font-medium">
            AI predictive crowd analytics & resource pre-positioning
          </p>
        </div>

        {/* Inputs Panel Card */}
        <form onSubmit={handleGenerateForecast} className="card bg-charcoal border border-border rounded-xl p-8 lg:p-10 flex flex-col gap-8 shrink-0">
          <h2 className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-widest border-b border-border pb-3">
            Surge Model Parameters
          </h2>

          <div className="space-y-6">
            {/* Target Ghat Selection */}
            <div>
              <label className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                Target Ghat
              </label>
              <select
                value={selectedGhatId}
                onChange={(e) => setSelectedGhatId(e.target.value)}
                className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-4 focus:outline-none focus:border-saffron transition duration-200 font-heading text-base"
              >
                {ghatLocations.filter(g => g.type === 'ghat').map((g) => (
                  <option key={g.id} value={g.id} className="bg-charcoal text-text-primary">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Event Selection */}
            <div>
              <label className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                Bathing Ritual Calendar Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-4 focus:outline-none focus:border-saffron transition duration-200 font-heading text-base"
              >
                {snanCalendar.map((event) => (
                  <option key={event.id} value={event.id} className="bg-charcoal text-text-primary">
                    {event.name} ({event.date})
                  </option>
                ))}
                <option value="normal" className="bg-charcoal text-text-primary">Normal Mela Day (No Special Snan)</option>
              </select>
            </div>

            {/* Registered Pilgrims Slider */}
            <div>
              <div className="flex justify-between items-center mb-2 font-heading text-sm font-semibold uppercase">
                <span className="text-text-secondary tracking-wider">Registered Pilgrims</span>
                <span className="text-cyan font-mono text-base font-bold">{formatPilgrimNum(pilgrimCount)}</span>
              </div>
              <input
                type="range"
                min="500000"
                max="5000000"
                step="100000"
                value={pilgrimCount}
                onChange={(e) => setPilgrimCount(parseInt(e.target.value))}
                className="w-full accent-saffron bg-charcoal-light rounded-lg appearance-none h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-text-dim font-mono mt-1">
                <span>500K</span>
                <span>2.5M (Norm)</span>
                <span>5M (Max)</span>
              </div>
            </div>

            {/* Approach Roads Congestion Slider */}
            <div>
              <div className="flex justify-between items-center mb-2 font-heading text-sm font-semibold uppercase">
                <span className="text-text-secondary tracking-wider">Roads Congestion Index</span>
                <span className="text-cyan font-mono text-base font-bold">{congestionIndex} / 10</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={congestionIndex}
                onChange={(e) => setCongestionIndex(parseFloat(e.target.value))}
                className="w-full accent-saffron bg-charcoal-light rounded-lg appearance-none h-1.5 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-text-dim font-mono mt-1">
                <span className="text-green">1.0 (Low)</span>
                <span className="text-amber">5.5 (Mod)</span>
                <span className="text-red">10.0 (High)</span>
              </div>
            </div>

            {/* Weather Selection Pills */}
            <div>
              <label className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                Meteorological Condition
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'clear', label: '☀️ Clear' },
                  { id: 'rain', label: '🌧️ Heavy Rain' },
                  { id: 'fog', label: '🌫️ Dense Fog' }
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWeather(w.id)}
                    className={`py-4 rounded-lg border text-center font-heading text-sm font-semibold transition cursor-pointer ${
                      weather === w.id
                        ? 'border-saffron text-saffron bg-saffron/5 shadow-md'
                        : 'bg-charcoal-light border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full py-5 rounded-lg bg-saffron hover:bg-saffron-light text-white font-heading font-semibold text-base transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-saffron/15 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Evaluating Surge Models...</span>
              </>
            ) : (
              <span>Generate AI Forecast</span>
            )}
          </button>
        </form>

        {/* AI Loading Thinking State */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card bg-charcoal border border-border rounded-xl p-10 flex flex-col gap-4 items-center justify-center text-center shrink-0"
            >
              <div className="w-full h-1.5 bg-charcoal-light rounded-full overflow-hidden relative">
                <motion.div
                  className="bg-gradient-to-r from-saffron to-cyan h-full rounded-full absolute top-0 left-0"
                  animate={{ left: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  style={{ width: '50%' }}
                />
              </div>
              <p className="font-mono text-cyan text-sm tracking-widest font-semibold animate-pulse">
                {thinkingMessages[activeThinkingMsgIndex]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Forecast Results Panels */}
        <AnimatePresence>
          {forecastResult && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8 shrink-0"
            >
              {/* Primary AI Forecast Card */}
              <div className="card bg-charcoal border border-border rounded-xl p-8 lg:p-10 flex flex-col gap-8 shrink-0 relative overflow-hidden">
                {/* Visual header */}
                <div className="border-b border-border pb-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-cyan/15 text-cyan border border-cyan/20 text-xs font-mono px-2.5 py-1 rounded uppercase tracking-widest font-bold">
                        PROJECTION REPORT
                      </span>
                      {hasSurgeAlert && (
                        <span className="bg-red/20 text-red border border-red/40 px-2 py-1 rounded text-[10px] font-bold font-mono tracking-wider animate-pulse">
                          ⚠️ SURGE ALERT (Threshold: Capacity × 85%)
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-heading font-bold text-text-primary mt-3">
                      {forecastResult.eventName} - {selectedGhatObj.name}
                    </h3>
                  </div>

                  <div className={`w-18 h-18 rounded-full border-2 flex flex-col items-center justify-center font-mono ${getSurgeColor(hasSurgeAlert ? 9.2 : forecastResult.surgeLevel)}`}>
                    <span className="text-xl font-bold leading-none">{hasSurgeAlert ? 9.2 : forecastResult.surgeLevel}</span>
                    <span className="text-[8px] font-bold uppercase mt-0.5 text-text-secondary">SURGE</span>
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-6 border-b border-border pb-6">
                  <div>
                    <span className="text-text-secondary uppercase tracking-wider block text-xs font-heading font-bold">
                      Peak Influx Window
                    </span>
                    <span className="text-cyan font-bold font-mono text-sm mt-1.5 block">
                      {forecastResult.peakArrival}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary uppercase tracking-wider block text-xs font-heading font-bold">
                      Status Advisory
                    </span>
                    <span className={`text-sm font-bold uppercase mt-1.5 block ${
                      hasSurgeAlert || forecastResult.surgeLevel >= 8 ? 'text-red' : forecastResult.surgeLevel >= 5 ? 'text-amber' : 'text-green'
                    }`}>
                      {hasSurgeAlert || forecastResult.surgeLevel >= 8 ? '🔴 Critical Alert' : forecastResult.surgeLevel >= 5 ? '🟡 Moderate Risk' : '🟢 Normal Conditions'}
                    </span>
                  </div>
                </div>

                {/* Highest Risk Ghats Ranked */}
                <div className="space-y-4">
                  <span className="text-text-secondary uppercase tracking-wider block text-xs font-heading font-bold">
                    Target Density Rank (Highest to Lowest)
                  </span>

                  <div className="space-y-3">
                    {forecastResult.highestRiskGhats.slice(0, 3).map((ghatName, idx) => {
                      const ghatObj = ghatLocations.find(g => g.name === ghatName) || {};
                      const valuePct = Math.round(Math.max(20, 100 - (idx * 25) - (10 - (hasSurgeAlert ? 9.2 : forecastResult.surgeLevel)) * 4));
                      
                      return (
                        <div key={ghatName} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-heading font-semibold text-text-primary text-sm">
                              {idx + 1}. {ghatName}
                            </span>
                            <span className="font-mono text-text-secondary text-xs">
                              {valuePct}% Cap
                            </span>
                          </div>
                          <div className="w-full h-2 bg-charcoal-light rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getSurgeBarColor(hasSurgeAlert ? 9.2 : forecastResult.surgeLevel)}`}
                              style={{ width: `${valuePct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Forecast Charts and Comparison Panel */}
              <div className="card bg-charcoal border border-border rounded-xl p-8 lg:p-10 flex flex-col gap-8 shrink-0">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <h3 className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-widest">
                    Crowd Forecast Analytics
                  </h3>

                  <div className="flex gap-2 bg-charcoal-light border border-border p-1 rounded-md text-[10px]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('forecast')}
                      className={`px-3 py-1 rounded cursor-pointer transition ${
                        activeTab === 'forecast' ? 'bg-saffron text-white' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      6H Forecast
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('historical')}
                      className={`px-3 py-1 rounded cursor-pointer transition ${
                        activeTab === 'historical' ? 'bg-saffron text-white' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Historical vs Est
                    </button>
                  </div>
                </div>

                <div className="h-[280px] w-full font-mono text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'forecast' ? (
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#4A5568" tickLine={false} />
                        <YAxis stroke="#4A5568" tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{ background: '#131A2B', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px' }}
                          labelStyle={{ color: '#8892A4', fontFamily: 'Space Grotesk', fontWeight: 'bold' }}
                          itemStyle={{ color: '#00E5FF' }}
                          formatter={(value, name) => {
                            if (name === 'actual') return [`${value}K Pilgrims`, 'Actual Crowd'];
                            if (name === 'predicted') return [`${value}K Pilgrims`, 'Predicted Surge'];
                            return [value, name];
                          }}
                        />
                        {/* Confidence Band */}
                        <Area
                           type="monotone"
                           dataKey="upper"
                           stroke="transparent"
                           fill="url(#colorConfidence)"
                           className="confidence-band"
                        />
                        <Area
                          type="monotone"
                          dataKey="lower"
                          stroke="transparent"
                          fill="#131A2B" // mask lower part
                          fillOpacity={1.0}
                        />
                        {/* Actual Line */}
                        <Area
                          type="monotone"
                          dataKey="actual"
                          stroke="#00E5FF"
                          strokeWidth={2.5}
                          fill="transparent"
                        />
                        {/* Predicted Line */}
                        <Area
                          type="monotone"
                          dataKey="predicted"
                          stroke="#FF6B00"
                          strokeWidth={2.5}
                          strokeDasharray="4 4"
                          fill="url(#colorPredicted)"
                        />
                        {/* Vertical NOW marker */}
                        <ReferenceLine x={state.simulationTime} stroke="#FF1744" strokeDasharray="3 3" label={{ value: 'NOW', fill: '#FF1744', fontSize: 10, position: 'top', fontWeight: 'bold' }} />
                        {/* Snan event lines */}
                        <ReferenceLine x="06:00" stroke="rgba(0, 229, 255, 0.4)" strokeDasharray="3 3" label={{ value: 'Peak Snan', fill: '#00E5FF', fontSize: 10, position: 'top' }} />
                      </AreaChart>
                    ) : (
                      <LineChart data={getHistoricalChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="hour" stroke="#4A5568" tickLine={false} />
                        <YAxis stroke="#4A5568" tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{ background: '#131A2B', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px' }}
                          labelStyle={{ color: '#8892A4', fontFamily: 'Space Grotesk' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                        <Line type="monotone" dataKey="Current Day (Est)" stroke="#FF6B00" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="2019 Actual" stroke="#00E5FF" strokeDasharray="4 4" dot={false} />
                        <Line type="monotone" dataKey="2013 Actual" stroke="#8892A4" strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="bg-[#0A0E1A] p-5 rounded-lg border border-border flex flex-col gap-2.5 font-heading text-xs leading-relaxed text-text-secondary">
                  <div className="flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                    <span>Confidence Band (Cyan fill) indicates +/-15% variance model envelope.</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
                    <span>Mela transit corridors are highly sensitive to Shahi Snan arrival peaks.</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-red" />
                    <span>Surge Alert triggers when crowd projection exceeds 85% of Ghat capacity (threshold: Capacity × 85%).</span>
                  </div>
                </div>
              </div>

              {/* AI Resource Checklist Section */}
              <div className="flex flex-col gap-6 shrink-0">
                <h3 className="font-heading text-sm font-semibold text-text-secondary uppercase tracking-widest border-b border-border pb-3">
                  AI Pre-positioning Deployment Checklist
                </h3>

                <div className="flex flex-col gap-4">
                  {forecastResult.checklist.map((item) => {
                    const isChecked = checkedItems.has(item.id);
                    
                    // Match checklist target with coordinates to allow map zooming
                    let lat = null, lng = null;
                    if (item.targetId !== 'global') {
                      const list = item.type === 'bus' ? resourceTemplates.buses : item.type === 'barrier' ? resourceTemplates.barriers : resourceTemplates.medical;
                      const res = list.find(r => r.id === item.targetId);
                      if (res) {
                        lat = res.lat;
                        lng = res.lng;
                      }
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id, item.targetId, lat, lng)}
                        className={`card rounded-xl p-6 border cursor-pointer transition duration-200 flex items-start gap-4 ${
                          isChecked
                            ? 'border-cyan bg-cyan/5'
                            : 'border-border bg-charcoal hover:border-text-secondary/30'
                        }`}
                      >
                        {/* Checkbox circle */}
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isChecked
                            ? 'bg-cyan border-cyan text-navy font-bold text-xs'
                            : 'border-border bg-charcoal-light'
                        }`}>
                          {isChecked && '✓'}
                        </div>

                        <div className="space-y-1.5">
                          <p className={`text-sm font-heading font-medium leading-relaxed ${
                            isChecked ? 'text-text-primary' : 'text-text-secondary'
                          }`}>
                            {item.text}
                          </p>
                          {item.targetId !== 'global' && (
                            <span className="font-mono text-xs text-cyan block uppercase tracking-wider">
                              Target Unit: {item.targetId} · Increment: +{item.increment} {item.type}s
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: Map Visualizer */}
      <div className="w-full sm:w-[55%] lg:w-[58%] h-full relative z-0">
        <MapContainer
          center={[25.4310, 81.8850]}
          zoom={13}
          zoomControl={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Dark map tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Render Ghat Markers */}
          {ghatLocations.filter(g => g.type === 'ghat').map((g) => {
            // Apply scale proportional to surge prediction risk
            let riskWeight = 5;
            if (forecastResult) {
              const idx = forecastResult.highestRiskGhats.indexOf(g.name);
              if (idx === 0) riskWeight = 16;
              else if (idx === 1) riskWeight = 12;
              else if (idx === 2) riskWeight = 9;
            }

            return (
              <CircleMarker
                key={g.id}
                center={[g.lat, g.lng]}
                radius={riskWeight}
                color="#FF6B00"
                fillColor="#FF6B00"
                fillOpacity={0.3}
                weight={2}
              >
                <Tooltip>
                  <div className="text-xs font-semibold font-heading text-text-primary p-1">
                    🕉️ {g.name}
                    <span className="text-[10px] text-text-secondary block mt-1 font-mono">
                      Expected Surge Rank: #{forecastResult ? forecastResult.highestRiskGhats.indexOf(g.name) + 1 : '—'}
                    </span>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* Render Active Pre-Positioned Buses */}
          {activeResources.buses.map((bus) => (
            <div key={bus.id}>
              <CircleMarker
                center={[bus.lat, bus.lng]}
                radius={9}
                color="#FFB300"
                fillColor="#131A2B"
                fillOpacity={0.9}
                weight={2}
              >
                <Tooltip>
                  <div className="font-heading text-xs text-text-primary p-1 space-y-1">
                    <div className="font-bold text-amber">🚌 {bus.name}</div>
                    <div className="font-mono text-[10px]">
                      Staged Buses: <span className="font-bold text-text-primary">{bus.active}</span> (Base: {bus.baseCapacity})
                    </div>
                    {bus.deployed && (
                      <span className="bg-cyan/15 text-cyan border border-cyan/20 text-[8px] font-mono px-1 rounded block uppercase mt-1 text-center font-bold">
                        AI DEPLOYMENT INJECTED
                      </span>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>

              {/* Pulse circle for actively deployed checkpoints */}
              {bus.deployed && (
                <CircleMarker
                  center={[bus.lat, bus.lng]}
                  radius={16}
                  color="#00E5FF"
                  fillColor="transparent"
                  weight={1.5}
                  dashArray="4, 4"
                />
              )}
            </div>
          ))}

          {/* Render Active Pre-Positioned Medical Camps */}
          {activeResources.medical.map((med) => (
            <div key={med.id}>
              <CircleMarker
                center={[med.lat, med.lng]}
                radius={8}
                color="#FF1744"
                fillColor="#131A2B"
                fillOpacity={0.9}
                weight={2}
              >
                <Tooltip>
                  <div className="font-heading text-xs text-text-primary p-1 space-y-1">
                    <div className="font-bold text-red">🏥 {med.name}</div>
                    <div className="font-mono text-[10px]">
                      Clinics & Ambulances: <span className="font-bold text-text-primary">{med.active}</span>
                    </div>
                    {med.deployed && (
                      <span className="bg-cyan/15 text-cyan border border-cyan/20 text-[8px] font-mono px-1 rounded block uppercase mt-1 text-center font-bold">
                        AI DEPLOYMENT INJECTED
                      </span>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>

              {/* Pulse circle */}
              {med.deployed && (
                <CircleMarker
                  center={[med.lat, med.lng]}
                  radius={15}
                  color="#00E5FF"
                  fillColor="transparent"
                  weight={1.5}
                  dashArray="4, 4"
                />
              )}
            </div>
          ))}

          {/* Render Active Pre-Positioned Barriers */}
          {activeResources.barriers.map((bar) => (
            <div key={bar.id}>
              <CircleMarker
                center={[bar.lat, bar.lng]}
                radius={7}
                color="#00E5FF"
                fillColor="#131A2B"
                fillOpacity={0.9}
                weight={2}
              >
                <Tooltip>
                  <div className="font-heading text-xs text-text-primary p-1 space-y-1">
                    <div className="font-bold text-cyan">🛡️ {bar.name}</div>
                    <div className="font-mono text-[10px]">
                      Crowd Control Gates: <span className="font-bold text-text-primary">{bar.active}</span>
                    </div>
                    {bar.deployed && (
                      <span className="bg-cyan/15 text-cyan border border-cyan/20 text-[8px] font-mono px-1 rounded block uppercase mt-1 text-center font-bold">
                        AI DEPLOYMENT INJECTED
                      </span>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>

              {/* Pulse circle */}
              {bar.deployed && (
                <CircleMarker
                  center={[bar.lat, bar.lng]}
                  radius={14}
                  color="#00E5FF"
                  fillColor="transparent"
                  weight={1.5}
                  dashArray="4, 4"
                />
              )}
            </div>
          ))}

          {/* Pan camera focus */}
          {mapFocus && <MapViewUpdater center={mapFocus} zoom={mapZoom} />}
        </MapContainer>
      </div>
    </div>
  );
}
