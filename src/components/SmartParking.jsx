import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { ghatLocations } from '../data/ghatLocations';

// Helper function to calculate distance in km between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const dlat = lat2 - lat1;
  const dlng = lon2 - lon1;
  return Math.sqrt(dlat * dlat + dlng * dlng) * 111;
}

// Map Viewer focus subcomponent
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 14, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function SmartParking() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  // Tab state: 'allocations' | 'admin'
  const [activeTab, setActiveTab] = useState('allocations');

  // Pilgrim form state
  const [vehicleType, setVehicleType] = useState('car');
  const [destGhat, setDestGhat] = useState(ghatLocations[0].id); // Default: Triveni Sangam
  const [isAllocating, setIsAllocating] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState('');

  // Booking state
  const [vehicleNo, setVehicleNo] = useState('');
  const [arrivalTime, setArrivalTime] = useState('1h');
  const [duration, setDuration] = useState(4);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [notifyOnFull, setNotifyOnFull] = useState(true);

  // Admin state
  const [divertRules, setDivertRules] = useState([
    { id: 1, trigger: 'P9', threshold: 80, target: 'P3', active: true },
    { id: 2, trigger: 'P1', threshold: 85, target: 'P11', active: true }
  ]);
  const [triggerZone, setTriggerZone] = useState('P9');
  const [threshold, setThreshold] = useState(80);
  const [targetZone, setTargetZone] = useState('P3');

  // Map center/zoom override
  const [mapFocus, setMapFocus] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);

  // Recommendations calculation
  const handleFindParking = (e) => {
    e.preventDefault();
    setIsAllocating(true);
    setRecommendations(null);
    setBookingConfirmed(null);

    setTimeout(() => {
      const selectedGhatObj = ghatLocations.find((g) => g.id === destGhat) || ghatLocations[0];
      
      // Filter zones matching vehicle type (or mixed)
      const eligibleZones = state.parking.filter((zone) => {
        if (zone.type === 'mixed') return true;
        if (vehicleType === 'motorcycle') return zone.type === 'car' || zone.type === 'mixed';
        return zone.type === vehicleType;
      });

      // Score and rank zones by distance, availability, and occupancy
      const scored = eligibleZones.map((zone) => {
        const distance = calculateDistance(zone.lat, zone.lng, selectedGhatObj.lat, selectedGhatObj.lng);
        const walkTime = Math.round(distance * 12); // 12 min per km
        const hasShuttle = zone.type === 'bus' || zone.type === 'mixed' || zone.type === 'car';
        const shuttleFreq = hasShuttle ? (zone.type === 'bus' ? 5 : 8) : 12;

        // Core AI routing score formula (distance and fill percentage)
        const score = distance * 12 + (zone.fillPercent / 8);

        return {
          ...zone,
          distance: Math.round(distance * 10) / 10,
          walkTime,
          shuttleFreq,
          score,
          price: zone.type === 'bus' ? 100 : zone.type === 'car' ? 50 : zone.type === 'auto' ? 30 : 20,
        };
      });

      // Sort and take top 3
      const top3 = scored.sort((a, b) => a.score - b.score).slice(0, 3);
      setRecommendations(top3);
      if (top3.length > 0) {
        setSelectedZoneId(top3[0].id);
        // Focus map on top zone
        setMapFocus([top3[0].lat, top3[0].lng]);
        setMapZoom(14);
      }
      setIsAllocating(false);
    }, 2500);
  };

  // Pre-Booking execution
  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      alert('Please enter your vehicle registration number.');
      return;
    }

    const zoneObj = state.parking.find((z) => z.id === selectedZoneId);
    if (!zoneObj) return;

    // Simulate reservation in global slots
    const updatedParking = state.parking.map((z) => {
      if (z.id === selectedZoneId) {
        const occupied = Math.min(z.totalSlots, z.occupied + 1);
        const fillPercent = Math.round((occupied / z.totalSlots) * 100);
        return {
          ...z,
          occupied,
          available: z.totalSlots - occupied,
          fillPercent,
          status: fillPercent > 90 ? 'full' : fillPercent > 70 ? 'filling' : 'available',
        };
      }
      return z;
    });

    dispatch({ type: 'UPDATE_PARKING', payload: updatedParking });

    const arrivalLabel = {
      '15m': 'Within 15 mins',
      '1h': 'Within 1 hour',
      '2h': '1 - 2 hours',
      '4h': '2 - 4 hours'
    }[arrivalTime] || 'Within 1 hour';

    setBookingConfirmed({
      zoneId: selectedZoneId,
      zoneName: zoneObj.name,
      vehicleNo: vehicleNo.toUpperCase(),
      arrivalTime: arrivalLabel,
      duration: `${duration} hours`,
      spotId: `${zoneObj.id}-${Math.floor(Math.random() * 8) + 1}A-${Math.floor(Math.random() * 90) + 10}`,
      price: zoneObj.type === 'bus' ? 100 * duration : (zoneObj.type === 'car' ? 50 * duration : 30 * duration)
    });

    setMapFocus([zoneObj.lat, zoneObj.lng]);
    setMapZoom(15);
  };

  // Add Admin Divert Rule
  const handleAddDivertRule = (e) => {
    e.preventDefault();
    if (triggerZone === targetZone) {
      alert('Trigger and target parking zones must be different.');
      return;
    }
    const newRule = {
      id: Date.now(),
      trigger: triggerZone,
      threshold: parseInt(threshold) || 80,
      target: targetZone,
      active: true
    };
    setDivertRules([...divertRules, newRule]);
  };

  // Toggle Rule Activity
  const toggleRule = (id) => {
    setDivertRules(divertRules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  // Delete Rule
  const deleteRule = (id) => {
    setDivertRules(divertRules.filter(r => r.id !== id));
  };

  // Check if any divert rules are actively triggering
  const getTriggeredMessages = () => {
    const messages = [];
    divertRules.forEach((rule) => {
      if (!rule.active) return;
      const triggerZoneObj = state.parking.find(z => z.id === rule.trigger);
      const targetZoneObj = state.parking.find(z => z.id === rule.target);
      if (triggerZoneObj && targetZoneObj && triggerZoneObj.fillPercent >= rule.threshold) {
        messages.push({
          ruleId: rule.id,
          triggerName: triggerZoneObj.name,
          targetName: targetZoneObj.name,
          fillPercent: triggerZoneObj.fillPercent,
          triggerId: triggerZoneObj.id,
          targetId: targetZoneObj.id
        });
      }
    });
    return messages;
  };

  const activeTriggers = getTriggeredMessages();

  // Create Google Maps Directions link for booked zone QR code
  const getQRDataUrl = (zoneId) => {
    const zoneObj = state.parking.find(z => z.id === zoneId);
    if (!zoneObj) return '';
    const link = `https://www.google.com/maps/dir/?api=1&destination=${zoneObj.lat},${zoneObj.lng}&travelmode=driving`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=00E5FF&bgcolor=1A2335&data=${encodeURIComponent(link)}`;
  };

  return (
    <div className="flex-1 flex flex-col sm:flex-row h-[calc(100vh-56px)] overflow-hidden bg-navy">
      {/* LEFT COLUMN: Workspace Panel */}
      <div className="w-full sm:w-[45%] lg:w-[38%] h-full flex flex-col p-6 lg:p-8 overflow-y-auto border-r border-border gap-8 scrollbar bg-navy-light z-10">
        
        {/* Header and Switcher tabs */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-heading text-text-primary tracking-tight">
              Smart Parking
            </h1>
            <p className="text-sm text-text-secondary font-heading font-medium">
              Dynamic mela space allocation & bypass routing
            </p>
          </div>

          <div className="flex bg-charcoal border border-border p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('allocations')}
              className={`flex-1 py-2 text-center text-xs font-heading font-semibold rounded-md transition duration-200 cursor-pointer ${
                activeTab === 'allocations'
                  ? 'bg-saffron text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              AI Allocations
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-2 text-center text-xs font-heading font-semibold rounded-md transition duration-200 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-saffron text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Admin Ops
            </button>
          </div>
        </div>

        {/* Tab 1: AI Allocations */}
        {activeTab === 'allocations' && (
          <>
            {/* Input Form Card */}
            <form onSubmit={handleFindParking} className="card bg-charcoal border border-border rounded-xl p-8 flex flex-col gap-6 shrink-0">
              <h2 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border pb-3">
                Request Allocated Spot
              </h2>
              
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-3.5 focus:outline-none focus:border-saffron transition duration-200 font-heading text-sm"
                  >
                    <option value="car" className="bg-charcoal text-text-primary">Car / SUV / Jeep</option>
                    <option value="bus" className="bg-charcoal text-text-primary">Bus / Mela Shuttle</option>
                    <option value="auto" className="bg-charcoal text-text-primary">Auto Rickshaw</option>
                    <option value="motorcycle" className="bg-charcoal text-text-primary">Two-Wheeler</option>
                  </select>
                </div>

                <div>
                  <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                    Destination Ghat
                  </label>
                  <select
                    value={destGhat}
                    onChange={(e) => setDestGhat(e.target.value)}
                    className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-3.5 focus:outline-none focus:border-saffron transition duration-200 font-heading text-sm"
                  >
                    {ghatLocations.filter(g => g.type === 'ghat').map((g) => (
                      <option key={g.id} value={g.id} className="bg-charcoal text-text-primary">
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAllocating}
                className="w-full py-4 rounded-lg bg-saffron hover:bg-saffron-light text-white font-heading font-semibold text-sm transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-saffron/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAllocating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Calculating Optimal Parking...</span>
                  </>
                ) : (
                  <span>Find Optimal Parking</span>
                )}
              </button>
            </form>

            {/* AI thinking state */}
            <AnimatePresence>
              {isAllocating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="card bg-charcoal border border-border rounded-xl p-8 flex flex-col gap-4 items-center justify-center text-center shrink-0"
                >
                  <div className="w-full h-1.5 bg-charcoal-light rounded-full overflow-hidden relative">
                    <motion.div
                      className="bg-gradient-to-r from-saffron to-cyan h-full rounded-full absolute top-0 left-0"
                      animate={{ left: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      style={{ width: '50%' }}
                    />
                  </div>
                  <p className="font-mono text-cyan text-xs tracking-wider font-semibold">
                    KumbhFlow AI is calculating distances & traffic congestion...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Recommendation Cards & Comparison Table */}
            <AnimatePresence>
              {recommendations && !isAllocating && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-8 shrink-0"
                >
                  {/* Top 3 List */}
                  <div className="flex flex-col gap-4">
                    <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border pb-3">
                      AI Recommendations
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                      {recommendations.map((rec, index) => (
                        <div
                          key={rec.id}
                          onClick={() => {
                            setSelectedZoneId(rec.id);
                            setMapFocus([rec.lat, rec.lng]);
                            setMapZoom(14);
                          }}
                          className={`card rounded-xl p-6 border cursor-pointer transition duration-200 flex justify-between items-center ${
                            selectedZoneId === rec.id
                              ? 'border-cyan bg-charcoal-light shadow-md shadow-cyan/5'
                              : 'border-border bg-charcoal hover:border-text-secondary/30'
                          }`}
                        >
                          <div className="flex gap-4 items-center">
                            <div className={`w-8 h-8 rounded-full font-mono text-xs font-bold flex items-center justify-center border ${
                              index === 0
                                ? 'bg-saffron/15 text-saffron border-saffron/30'
                                : 'bg-charcoal-light text-text-secondary border-border'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-text-primary font-heading">
                                {rec.name}
                              </h4>
                              <p className="text-xs text-text-secondary font-heading mt-1">
                                {rec.distance} km from Ghat · {rec.walkTime} min walk
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex flex-col gap-1 font-mono">
                            <span className={`text-xs font-bold uppercase ${
                              rec.fillPercent > 80 ? 'text-red' : rec.fillPercent >= 50 ? 'text-amber' : 'text-green'
                            }`}>
                              {rec.available} open
                            </span>
                            <span className="text-[10px] text-text-dim">
                              {rec.fillPercent}% full
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking form */}
                  {!bookingConfirmed && (
                    <form onSubmit={handleConfirmBooking} className="card bg-charcoal border border-border rounded-xl p-8 flex flex-col gap-6 shrink-0">
                      <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border pb-3">
                        Pre-Book Slot at {state.parking.find(z => z.id === selectedZoneId)?.name}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                            Vehicle Registration No.
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. UP-70-AB-1234"
                            value={vehicleNo}
                            onChange={(e) => setVehicleNo(e.target.value)}
                            className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-3.5 focus:outline-none focus:border-saffron transition duration-200 font-mono text-sm uppercase"
                          />
                        </div>

                        <div>
                          <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                            Duration
                          </label>
                          <select
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value) || 4)}
                            className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-3.5 focus:outline-none focus:border-saffron transition duration-200 font-mono text-sm"
                          >
                            <option value="2" className="bg-charcoal text-text-primary">2 hrs</option>
                            <option value="4" className="bg-charcoal text-text-primary">4 hrs</option>
                            <option value="6" className="bg-charcoal text-text-primary">6 hrs</option>
                            <option value="12" className="bg-charcoal text-text-primary">12 hrs</option>
                            <option value="24" className="bg-charcoal text-text-primary">24 hrs</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                            Arrival Window
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { id: '15m', label: '15m' },
                              { id: '1h', label: '1 hour' },
                              { id: '2h', label: '2 hours' },
                              { id: '4h', label: '4 hours' }
                            ].map((w) => (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => setArrivalTime(w.id)}
                                className={`py-2 rounded-lg border text-center font-heading text-xs font-semibold transition cursor-pointer ${
                                  arrivalTime === w.id
                                    ? 'border-cyan text-cyan bg-cyan/5'
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
                        className="w-full py-4 rounded-lg bg-saffron hover:bg-saffron-light text-white font-heading font-semibold text-sm transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-saffron/10"
                      >
                        Confirm Slot Reservation
                      </button>
                    </form>
                  )}

                  {/* Booking Receipt Pass */}
                  {bookingConfirmed && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="card border-l-4 border-l-cyan bg-charcoal border border-border rounded-xl p-8 flex flex-col gap-6 shrink-0 relative overflow-hidden"
                    >
                      {/* Cyberpunk glowing pass lines */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan/5 rounded-bl-full pointer-events-none" />
                      
                      <div className="border-b border-border pb-4">
                        <span className="bg-cyan/15 text-cyan border border-cyan/20 text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                          RESERVATION CONFIRMED
                        </span>
                        <h4 className="text-lg font-heading font-bold text-text-primary mt-2">
                          Mela Parking Pass
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 font-heading text-xs leading-relaxed border-b border-border pb-4">
                        <div>
                          <span className="text-text-secondary uppercase tracking-wider block text-[9px]">Vehicle No</span>
                          <span className="text-text-primary font-bold font-mono text-sm">{bookingConfirmed.vehicleNo}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary uppercase tracking-wider block text-[9px]">Allocated Zone</span>
                          <span className="text-text-primary font-bold">{bookingConfirmed.zoneName}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary uppercase tracking-wider block text-[9px]">Assigned Slot</span>
                          <span className="text-cyan font-bold font-mono text-sm">{bookingConfirmed.spotId}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary uppercase tracking-wider block text-[9px]">Arrival Window</span>
                          <span className="text-text-primary font-semibold">{bookingConfirmed.arrivalTime}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary uppercase tracking-wider block text-[9px]">Booking Period</span>
                          <span className="text-text-primary font-semibold">{bookingConfirmed.duration}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary uppercase tracking-wider block text-[9px]">Estimated Fee</span>
                          <span className="text-text-primary font-bold font-mono text-sm">₹{bookingConfirmed.price}</span>
                        </div>
                      </div>

                      {/* Working Google Maps Redirection QR Code */}
                      <div className="flex flex-col items-center text-center space-y-4 py-2 border-b border-border w-full">
                        <div className="w-36 h-36 border-2 border-dashed border-cyan/40 bg-charcoal-light rounded-lg flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                          {getQRDataUrl(bookingConfirmed.zoneId) ? (
                            <img
                              src={getQRDataUrl(bookingConfirmed.zoneId)}
                              alt="Parking Spot GPS Link"
                              className="w-28 h-28 object-contain rounded"
                            />
                          ) : (
                            <div className="text-text-dim text-xs">No active URL</div>
                          )}
                          <span className="absolute bottom-0.5 font-mono text-[7px] text-cyan/70 tracking-widest uppercase">
                            GPS Gate Navigation
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary font-heading max-w-[240px] mx-auto leading-normal">
                          Scan to open step-by-step navigation directly to the gate entrance of <strong>{bookingConfirmed.zoneName}</strong> in Google Maps.
                        </p>
                      </div>

                      {/* Notify Toggle */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs font-heading text-text-secondary font-medium">
                          SMS notification if zone hits 80% capacity
                        </span>
                        
                        <div
                          onClick={() => setNotifyOnFull(!notifyOnFull)}
                          className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                            notifyOnFull ? 'bg-cyan' : 'bg-charcoal-light border border-border'
                          }`}
                        >
                          <motion.div
                            layout
                            className="w-4 h-4 rounded-full bg-white shadow-md"
                            animate={{ x: notifyOnFull ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setBookingConfirmed(null);
                          setVehicleNo('');
                        }}
                        className="w-full py-3 border border-border hover:bg-charcoal-light text-text-secondary hover:text-text-primary font-heading font-semibold text-xs rounded-lg transition cursor-pointer text-center"
                      >
                        Book Another Vehicle
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Tab 2: Admin Operations */}
        {activeTab === 'admin' && (
          <>
            {/* Divert Rules Form Card */}
            <form onSubmit={handleAddDivertRule} className="card bg-charcoal border border-border rounded-xl p-8 flex flex-col gap-6 shrink-0">
              <h2 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border pb-3">
                Configure Bypass Diversion Rule
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                      Trigger Zone
                    </label>
                    <select
                      value={triggerZone}
                      onChange={(e) => setTriggerZone(e.target.value)}
                      className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-3 py-3 focus:outline-none focus:border-saffron transition duration-200 font-heading text-sm"
                    >
                      {state.parking.map((z) => (
                        <option key={z.id} value={z.id} className="bg-charcoal text-text-primary">
                          {z.id} ({z.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                      Threshold Fill %
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={threshold}
                      onChange={(e) => setThreshold(Math.max(50, Math.min(100, parseInt(e.target.value) || 80)))}
                      className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-3 py-3 focus:outline-none focus:border-saffron transition duration-200 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                    Redirect Traffic To
                  </label>
                  <select
                    value={targetZone}
                    onChange={(e) => setTargetZone(e.target.value)}
                    className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-3 py-3 focus:outline-none focus:border-saffron transition duration-200 font-heading text-sm"
                  >
                    {state.parking.map((z) => (
                      <option key={z.id} value={z.id} className="bg-charcoal text-text-primary">
                        {z.id} ({z.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-saffron hover:bg-saffron-light text-white font-heading font-semibold text-xs transition duration-200 cursor-pointer shadow-lg shadow-saffron/10"
              >
                Activate Diversion Rule
              </button>
            </form>

            {/* Active Rules List */}
            <div className="flex flex-col gap-4 shrink-0">
              <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border pb-3">
                Active Diversion Systems
              </h3>

              <div className="flex flex-col gap-3">
                {divertRules.map((rule) => {
                  const trg = state.parking.find((z) => z.id === rule.trigger);
                  const tgt = state.parking.find((z) => z.id === rule.target);
                  const isTriggered = trg && trg.fillPercent >= rule.threshold;
                  return (
                     <div
                      key={rule.id}
                      className={`card rounded-xl p-6 border flex flex-col gap-3 transition duration-200 ${
                        isTriggered && rule.active
                          ? 'border-red bg-red/5'
                          : 'border-border bg-charcoal'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-mono text-xs font-bold ${
                          isTriggered && rule.active ? 'text-red animate-pulse' : 'text-text-primary'
                        }`}>
                          RULE #{rule.id.toString().slice(-4)}: {rule.trigger} ➔ {rule.target}
                        </span>
                        
                        <div className="flex gap-3 items-center">
                          {/* Toggle */}
                          <div
                            onClick={() => toggleRule(rule.id)}
                            className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                              rule.active ? 'bg-saffron' : 'bg-charcoal-light border border-border'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200" style={{ transform: rule.active ? 'translateX(16px)' : 'translateX(0px)' }} />
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => deleteRule(rule.id)}
                            className="text-text-dim hover:text-red transition text-xs font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary font-heading leading-normal">
                        If <strong>{trg?.name || rule.trigger}</strong> occupancy is ≥ {rule.threshold}%, divert traffic to <strong>{tgt?.name || rule.target}</strong>.
                      </p>
                      
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-text-dim">Current occupancy:</span>
                        <span className={`font-bold ${isTriggered ? 'text-red' : 'text-text-secondary'}`}>
                          {trg?.fillPercent || 0}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Display Board preview */}
            <div className="card bg-charcoal border border-border rounded-xl p-6 flex flex-col gap-4 shrink-0 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-widest">
                  Highway VMS sign board broadcast
                </h3>
                {activeTriggers.length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red animate-ping" />
                )}
              </div>

              <div className="bg-navy p-6 rounded-lg border border-border font-mono text-xs text-amber leading-relaxed flex flex-col gap-3 relative shadow-inner">
                {activeTriggers.length > 0 ? (
                  activeTriggers.map((trg) => (
                    <div key={trg.ruleId} className="space-y-1 py-1 border-b border-white/5 last:border-0">
                      <span className="text-red font-bold animate-pulse block">
                        [SIGN SECTOR {trg.triggerId}] DIVERSION ACTIVE
                      </span>
                      <p className="text-[11px] text-text-primary">
                        "{trg.triggerName} is at {trg.fillPercent}% capacity. All incoming vehicles reroute to {trg.targetName}."
                      </p>
                      <span className="text-[9px] text-text-dim block mt-1">
                        Display board update: auto-synced via KumbhFlow
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 space-y-1">
                    <span className="text-green font-bold block">
                      [VMS SYSTEM] NORMAL BROADCAST
                    </span>
                    <p className="text-[11px] text-text-secondary">
                      "Welcome to Prayagraj Mahakumbh. Scan QR code at gate for real-time parking spot allocation."
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Occupancy Feed of all 20 zones */}
            <div className="flex flex-col gap-4 shrink-0">
              <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border pb-3">
                Live Zone Capacities (P1–P20)
              </h3>
              
              <div className="flex flex-col gap-3">
                {state.parking.map((zone) => (
                  <div
                    key={zone.id}
                    onClick={() => {
                      setSelectedZoneId(zone.id);
                      setMapFocus([zone.lat, zone.lng]);
                      setMapZoom(14);
                    }}
                    className={`card bg-charcoal border border-border rounded-xl p-6 hover:border-text-secondary/30 transition duration-200 cursor-pointer flex flex-col gap-3 ${
                      selectedZoneId === zone.id ? 'border-cyan' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex gap-2 items-center">
                          <span className="font-mono text-xs font-bold text-cyan">{zone.id}</span>
                          <h4 className="text-sm font-heading font-bold text-text-primary">
                            {zone.name}
                          </h4>
                        </div>
                        <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider mt-1 block">
                          Type: {zone.type} · Slots: {zone.totalSlots}
                        </span>
                      </div>
                      
                      <div className="text-right font-mono text-xs">
                        <span className={`font-bold ${
                          zone.fillPercent > 80 ? 'text-red' : zone.fillPercent >= 50 ? 'text-amber' : 'text-green'
                        }`}>
                          {zone.available} open
                        </span>
                        <span className="text-text-dim text-[10px] block mt-0.5">
                          {zone.fillPercent}% full
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-charcoal-light rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          zone.fillPercent > 80 ? 'bg-red' : zone.fillPercent >= 50 ? 'bg-amber' : 'bg-green'
                        }`}
                        style={{ width: `${zone.fillPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: Map Visualizer */}
      <div className="w-full sm:w-[55%] lg:w-[62%] h-full relative z-0">
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

          {/* Render Reference Ghat Coordinate Markers */}
          {ghatLocations.filter(g => g.type === 'ghat').map((g) => (
            <CircleMarker
              key={g.id}
              center={[g.lat, g.lng]}
              radius={6}
              color="#FF6B00"
              fillColor="#0A0E1A"
              fillOpacity={0.9}
              weight={1.5}
            >
              <Tooltip>
                <div className="text-xs font-semibold font-heading text-text-primary">
                  🕉️ {g.name}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Render 20 Parking Zones */}
          {state.parking.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const color = zone.fillPercent > 80 ? '#FF1744' : (zone.fillPercent >= 50 ? '#FFB300' : '#00E676');
            return (
              <div key={zone.id}>
                {/* Zone Marker */}
                <CircleMarker
                  center={[zone.lat, zone.lng]}
                  radius={8 + (zone.totalSlots / 120)}
                  color={color}
                  fillColor={color}
                  fillOpacity={0.4}
                  weight={isSelected ? 3 : 1.5}
                >
                  <Tooltip>
                    <div className="font-heading text-xs text-text-primary p-1 space-y-1">
                      <div className="font-bold text-cyan flex justify-between items-center gap-4">
                        <span>🅿️ {zone.id}: {zone.name}</span>
                        <span className="text-[10px] text-text-secondary bg-charcoal-light px-1.5 py-0.5 rounded font-mono uppercase">
                          {zone.type}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] pt-1">
                        Slots: <span className="font-bold text-text-primary">{zone.available}</span> / {zone.totalSlots} open
                      </div>
                      <div className="w-20 h-1 bg-charcoal-light rounded-full overflow-hidden mt-1">
                        <div className="h-full rounded-full" style={{ width: `${zone.fillPercent}%`, backgroundColor: color }} />
                      </div>
                      <div className="text-[10px] text-text-secondary font-mono pt-0.5">
                        Occupancy: {zone.fillPercent}%
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>

                {/* Selected Zone Pulsing Highlight ring */}
                {isSelected && (
                  <CircleMarker
                    center={[zone.lat, zone.lng]}
                    radius={16 + (zone.totalSlots / 120)}
                    color="#00E5FF"
                    fillColor="transparent"
                    weight={2}
                    dashArray="5, 4"
                  />
                )}
              </div>
            );
          })}

          {/* Handle center pan/zoom focus */}
          {mapFocus && <MapViewUpdater center={mapFocus} zoom={mapZoom} />}
        </MapContainer>
      </div>
    </div>
  );
}
