import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { simulateRouteResponse, destinations, transportModes, languages } from '../data/routeData';

// Map Bounds Auto-updater sub-component
function MapBoundsUpdater({ path }) {
  const map = useMap();
  useEffect(() => {
    if (path && path.length > 0) {
      map.fitBounds(path, { padding: [50, 50], maxZoom: 15 });
    }
  }, [path, map]);
  return null;
}

export default function RouteIntelligence() {
  // Form state
  const [origin, setOrigin] = useState(destinations[5].id); // Default: Prayagraj Junction
  const [destination, setDestination] = useState(destinations[0].id); // Default: Triveni Sangam
  const [transportMode, setTransportMode] = useState('bus');
  const [pilgrimCount, setPilgrimCount] = useState(1);
  const [accessibility, setAccessibility] = useState(false);
  const [language, setLanguage] = useState('en');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('primary'); // 'primary' | 'alt1' | 'alt2'
  const [showShareModal, setShowShareModal] = useState(false);
  const [tipsCollapsed, setTipsCollapsed] = useState(true);

  // AI thinking status messages cycling
  const messages = [
    'Checking real-time congestion data...',
    'Analyzing crowd density at ghats...',
    'Evaluating Snan schedule impact...',
    'Computing optimal path...'
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % messages.length);
      }, 600);
    } else {
      setMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Form Submit Handler
  const handlePlanRoute = (e) => {
    e.preventDefault();
    if (origin === destination) {
      alert(language === 'hi' ? 'प्रस्थान और गंतव्य समान नहीं हो सकते।' : 'Origin and destination cannot be the same.');
      return;
    }
    setIsLoading(true);
    setRouteResult(null);
    setSelectedRoute('primary');

    setTimeout(() => {
      const response = simulateRouteResponse(origin, destination, transportMode, pilgrimCount, accessibility);
      setRouteResult(response);
      setIsLoading(false);
    }, 2500);
  };

  // Text-To-Speech (Web Speech API) Guidance
  const handleReadAloud = () => {
    if (!window.speechSynthesis) {
      alert(language === 'hi' ? 'आपके ब्राउज़र में आवाज़ सुविधा उपलब्ध नहीं है।' : 'Text-to-speech is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();

    let activeRouteData = routeResult.primary_route;
    if (selectedRoute === 'alt1') activeRouteData = routeResult.alternative_routes[0];
    if (selectedRoute === 'alt2') activeRouteData = routeResult.alternative_routes[1];

    const steps = activeRouteData.steps || [];
    const textToSpeak = steps
      .map((step, idx) => {
        const text = (language === 'hi' && step.instructionHi) ? step.instructionHi : step.instruction;
        return `${idx + 1}. ${text}`;
      })
      .join('. ');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const selectedLangObj = languages.find((l) => l.id === language);
    if (selectedLangObj) {
      utterance.lang = selectedLangObj.speechLang;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Get coordinates and paths based on selected route
  const getActivePath = () => {
    if (!routeResult) return null;
    if (selectedRoute === 'alt1') return routeResult.alternative_routes[0].path;
    if (selectedRoute === 'alt2') return routeResult.alternative_routes[1].path;
    return routeResult.primary_route.path;
  };

  const activePath = getActivePath();
  const originDetails = destinations.find((d) => d.id === origin);
  const destDetails = destinations.find((d) => d.id === destination);

  return (
    <div className="flex-1 flex flex-col sm:flex-row h-[calc(100vh-56px)] overflow-hidden bg-navy">
      {/* LEFT COLUMN: Input Form & Results */}
      <div className="w-full sm:w-[45%] lg:w-[38%] h-full flex flex-col p-6 lg:p-8 overflow-y-auto border-r border-border gap-8 scrollbar bg-navy-light z-10">
        
        {/* Module Header */}
        <div className="space-y-1 shrink-0">
          <h1 className="text-3xl font-bold font-heading text-text-primary tracking-tight">
            Route Intelligence
          </h1>
          <p className="text-sm text-text-secondary font-heading font-medium">
            AI-powered multi-modal route planning
          </p>
        </div>

        {/* Input Form Card */}
        <form onSubmit={handlePlanRoute} className="card bg-charcoal border border-border rounded-xl p-8 flex flex-col gap-8 shrink-0">
          {/* Origin & Destination Selectors */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 block">
                Origin
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-3.5 focus:outline-none focus:border-saffron transition duration-200 font-heading text-sm"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id} className="bg-charcoal text-text-primary">
                    {language === 'hi' ? d.nameHi : d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 block">
                Destination
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-3.5 focus:outline-none focus:border-saffron transition duration-200 font-heading text-sm"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id} className="bg-charcoal text-text-primary">
                    {language === 'hi' ? d.nameHi : d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transport Mode selector (Pills) */}
          <div className="space-y-3">
            <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Transport Mode
            </label>
            <div className="grid grid-cols-5 gap-3">
              {transportModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTransportMode(mode.id)}
                  className={`flex flex-col items-center justify-center py-3.5 rounded-lg border transition duration-200 font-heading text-xs cursor-pointer ${
                    transportMode === mode.id
                      ? 'bg-saffron text-white border-saffron shadow-md shadow-saffron/10'
                      : 'bg-charcoal-light border-border text-text-secondary hover:text-text-primary hover:border-text-secondary/30'
                  }`}
                >
                  <span className="text-xl mb-1">{mode.icon}</span>
                  <span className="font-medium">{language === 'hi' ? mode.labelHi : mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pilgrim Count & Accessibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 block">
                Pilgrim Count
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={pilgrimCount}
                onChange={(e) => setPilgrimCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-charcoal-light border border-border text-text-primary rounded-lg px-4 py-3.5 focus:outline-none focus:border-saffron transition duration-200 font-mono text-sm"
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accessibility}
                  onChange={(e) => setAccessibility(e.target.checked)}
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 border rounded flex items-center justify-center transition-all duration-200 ${
                    accessibility ? 'bg-saffron border-saffron text-white' : 'border-border bg-charcoal-light'
                  }`}
                >
                  {accessibility && (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-heading text-text-secondary hover:text-text-primary transition duration-150">
                  Wheelchair / Elderly access
                </span>
                {accessibility && <span className="text-sm">♿</span>}
              </label>
            </div>
          </div>

          {/* Language selector */}
          <div>
            <label className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
              Language / भाषा / ভাষা
            </label>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className={`flex-1 py-2 rounded-lg border text-center transition duration-200 font-heading text-xs font-medium cursor-pointer ${
                    language === lang.id
                      ? 'border-cyan text-cyan bg-cyan/5'
                      : 'bg-charcoal-light border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-lg bg-saffron hover:bg-saffron-light text-white font-heading font-semibold text-sm transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-saffron/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Planning...</span>
              </>
            ) : (
              <span>Plan My Route</span>
            )}
          </button>
        </form>

        {/* AI THINKING STATE */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card bg-charcoal border border-border rounded-xl p-8 space-y-6 flex flex-col items-center justify-center text-center"
            >
              {/* Pulsing Saffron-to-Cyan Gradient Bar */}
              <div className="w-full h-1.5 bg-charcoal-light rounded-full overflow-hidden relative">
                <motion.div
                  className="bg-gradient-to-r from-saffron to-cyan h-full rounded-full absolute top-0 left-0"
                  animate={{
                    left: ['-100%', '100%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                  }}
                  style={{ width: '50%' }}
                />
              </div>

              <div className="space-y-2">
                <p className="font-mono text-cyan text-sm tracking-wide font-semibold">
                  KumbhFlow AI is analyzing your route...
                </p>
                
                <div className="h-5 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={msgIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.25 }}
                      className="text-xs text-text-secondary font-mono"
                    >
                      {messages[msgIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESULTS SECTION */}
        <AnimatePresence>
          {routeResult && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8 pb-10 shrink-0"
            >
              {/* PRIMARY RECOMMENDED ROUTE CARD */}
              <div className="card border-l-4 border-l-saffron bg-charcoal p-8 flex flex-col gap-8 shrink-0">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="font-mono text-xs font-semibold text-text-secondary uppercase tracking-widest">
                      RECOMMENDED ROUTE
                    </h2>
                    <p className="text-xl font-heading font-bold text-text-primary mt-1">
                      {selectedRoute === 'primary' 
                        ? (language === 'hi' ? 'मुख्य मार्ग' : 'Primary Path') 
                        : (selectedRoute === 'alt1' 
                            ? (language === 'hi' ? 'वैकल्पिक मार्ग १' : 'Alternative 1')
                            : (language === 'hi' ? 'वैकल्पिक मार्ग २' : 'Alternative 2')
                          )
                      }
                    </p>
                  </div>
                  {/* Mode badge */}
                  <div className="bg-saffron/15 text-saffron font-heading text-xs font-semibold px-3 py-1 rounded-full border border-saffron/20">
                    {transportModes.find((m) => m.id === (
                      selectedRoute === 'primary' 
                        ? routeResult.primary_route.mode 
                        : transportMode
                    ))?.icon}{' '}
                    {transportModes.find((m) => m.id === (
                      selectedRoute === 'primary' 
                        ? routeResult.primary_route.mode 
                        : transportMode
                    ))?.label}
                  </div>
                </div>

                {/* Metric Summary */}
                <div className="grid grid-cols-2 gap-6 items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-secondary font-heading uppercase tracking-wider block">
                      Estimated Time
                    </span>
                    <span className="font-mono text-3xl font-bold text-cyan tracking-tight">
                      {selectedRoute === 'primary' 
                        ? routeResult.primary_route.eta 
                        : (selectedRoute === 'alt1' 
                            ? routeResult.alternative_routes[0].eta 
                            : routeResult.alternative_routes[1].eta
                          )
                      }
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-text-secondary font-heading uppercase tracking-wider block">
                      Distance
                    </span>
                    <span className="font-mono text-2xl font-semibold text-text-primary tracking-tight">
                      {selectedRoute === 'primary' 
                        ? routeResult.primary_route.distance 
                        : (selectedRoute === 'alt1' 
                            ? routeResult.alternative_routes[0].distance 
                            : routeResult.alternative_routes[1].distance
                          )
                      }
                    </span>
                  </div>
                </div>

                {/* Congestion Score Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-heading font-medium">
                    <span className="text-text-secondary">Route Congestion Index</span>
                    <span className={`font-mono font-semibold ${
                      (selectedRoute === 'primary' 
                        ? routeResult.primary_route.congestion_score 
                        : (selectedRoute === 'alt1' 
                            ? routeResult.alternative_routes[0].congestion_score 
                            : routeResult.alternative_routes[1].congestion_score
                          )
                      ) < 4
                        ? 'text-green'
                        : (selectedRoute === 'primary' 
                            ? routeResult.primary_route.congestion_score 
                            : (selectedRoute === 'alt1' 
                                ? routeResult.alternative_routes[0].congestion_score 
                                : routeResult.alternative_routes[1].congestion_score
                              )
                          ) <= 7
                            ? 'text-amber'
                            : 'text-red'
                    }`}>
                      {selectedRoute === 'primary' 
                        ? routeResult.primary_route.congestion_score 
                        : (selectedRoute === 'alt1' 
                            ? routeResult.alternative_routes[0].congestion_score 
                            : routeResult.alternative_routes[1].congestion_score
                          )
                      } / 10
                    </span>
                  </div>

                  <div className="w-full h-2 bg-charcoal-light rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        (selectedRoute === 'primary' 
                          ? routeResult.primary_route.congestion_score 
                          : (selectedRoute === 'alt1' 
                              ? routeResult.alternative_routes[0].congestion_score 
                              : routeResult.alternative_routes[1].congestion_score
                            )
                        ) < 4
                          ? 'bg-green'
                          : (selectedRoute === 'primary' 
                              ? routeResult.primary_route.congestion_score 
                              : (selectedRoute === 'alt1' 
                                  ? routeResult.alternative_routes[0].congestion_score 
                                  : routeResult.alternative_routes[1].congestion_score
                                )
                            ) <= 7
                              ? 'bg-amber'
                              : 'bg-red'
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(
                          selectedRoute === 'primary' 
                            ? routeResult.primary_route.congestion_score 
                            : (selectedRoute === 'alt1' 
                                ? routeResult.alternative_routes[0].congestion_score 
                                : routeResult.alternative_routes[1].congestion_score
                              )
                        ) * 10}%`,
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Step-by-Step Directions */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Navigation Steps
                  </h3>
                  
                  <div className="relative border-l border-border pl-8 ml-4 space-y-10 py-3">
                    {((selectedRoute === 'primary' 
                      ? routeResult.primary_route.steps 
                      : (selectedRoute === 'alt1' 
                          ? routeResult.alternative_routes[0].steps 
                          : routeResult.alternative_routes[1].steps
                        )
                    ) || routeResult.primary_route.steps).map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="relative space-y-2"
                      >
                        {/* Step Marker Icon */}
                        <div className="absolute -left-[46px] top-0.5 w-7 h-7 rounded-full bg-charcoal border border-border flex items-center justify-center text-sm shadow-md z-10 select-none">
                          {step.icon || '📍'}
                        </div>

                        {/* Step Instruction */}
                        <p className="text-sm font-heading font-medium text-text-primary leading-snug">
                          {language === 'hi' && step.instructionHi ? step.instructionHi : step.instruction}
                        </p>

                        {/* Distance & Details */}
                        <div className="flex gap-3 text-xs font-heading text-text-secondary">
                          {step.distance && step.distance !== '—' && (
                            <span className="font-mono text-cyan-dim font-medium">{step.distance}</span>
                          )}
                          {step.detail && (
                            <span className="text-text-dim">{step.detail}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ALTERNATIVE ROUTES PANEL */}
              <div className="flex flex-col gap-4 shrink-0">
                <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Alternative Options
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Alt Route 1 Card */}
                  <div
                    onClick={() => setSelectedRoute(selectedRoute === 'alt1' ? 'primary' : 'alt1')}
                    className={`card rounded-xl p-4 cursor-pointer transition duration-200 border ${
                      selectedRoute === 'alt1'
                        ? 'border-cyan bg-charcoal-light shadow-md shadow-cyan/5'
                        : 'border-border bg-charcoal hover:border-text-secondary/30'
                    }`}
                  >
                    <div className="bg-cyan/15 text-cyan border border-cyan/20 text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block font-semibold">
                      {routeResult.alternative_routes[0].highlight}
                    </div>
                    <h4 className="text-xs font-bold text-text-primary font-heading truncate">
                      {language === 'hi' ? routeResult.alternative_routes[0].nameHi : routeResult.alternative_routes[0].name}
                    </h4>
                    <div className="flex justify-between items-center mt-3 text-xs font-mono">
                      <span className="text-cyan font-bold">{routeResult.alternative_routes[0].eta}</span>
                      <span className="text-text-secondary">{routeResult.alternative_routes[0].distance}</span>
                    </div>
                  </div>

                  {/* Alt Route 2 Card */}
                  <div
                    onClick={() => setSelectedRoute(selectedRoute === 'alt2' ? 'primary' : 'alt2')}
                    className={`card rounded-xl p-4 cursor-pointer transition duration-200 border ${
                      selectedRoute === 'alt2'
                        ? 'border-cyan bg-charcoal-light shadow-md shadow-cyan/5'
                        : 'border-border bg-charcoal hover:border-text-secondary/30'
                    }`}
                  >
                    <div className="bg-green/15 text-green border border-green/20 text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block font-semibold">
                      {routeResult.alternative_routes[1].highlight}
                    </div>
                    <h4 className="text-xs font-bold text-text-primary font-heading truncate">
                      {language === 'hi' ? routeResult.alternative_routes[1].nameHi : routeResult.alternative_routes[1].name}
                    </h4>
                    <div className="flex justify-between items-center mt-3 text-xs font-mono">
                      <span className="text-cyan font-bold">{routeResult.alternative_routes[1].eta}</span>
                      <span className="text-text-secondary">{routeResult.alternative_routes[1].distance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BETTER TIME SUGGESTION CHIP */}
              {routeResult.better_time && (
                <div className="flex items-center gap-3 p-4 bg-cyan/5 border border-cyan/10 rounded-xl shrink-0">
                  <div className="w-2 h-2 rounded-full bg-cyan animate-pulse flex-shrink-0" />
                  <div className="text-xs font-heading leading-normal">
                    <span className="text-cyan font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                      Better Departure Time
                    </span>
                    <span className="text-text-primary font-semibold">
                      {routeResult.better_time.time}
                    </span>
                    <span className="text-text-secondary">
                      {' · '}{language === 'hi' ? routeResult.better_time.reasonHi : routeResult.better_time.reason}
                    </span>
                  </div>
                </div>
              )}

              {/* WARNINGS PANEL */}
              {routeResult.warnings && routeResult.warnings.length > 0 && (
                <div className="flex flex-col gap-3 shrink-0">
                  <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Route Advisories
                  </h3>
                  <div className="space-y-2">
                    {routeResult.warnings.map((w, index) => (
                      <div
                        key={index}
                        className={`card border-l-4 p-4 rounded-r-xl bg-charcoal ${
                          w.severity === 'high'
                            ? 'border-l-red bg-red/5'
                            : w.severity === 'medium'
                            ? 'border-l-amber bg-amber/5'
                            : 'border-l-cyan bg-cyan/5'
                        }`}
                      >
                        <p className={`text-xs font-heading font-medium leading-relaxed ${
                          w.severity === 'high'
                            ? 'text-red'
                            : w.severity === 'medium'
                            ? 'text-amber'
                            : 'text-cyan'
                        }`}>
                          {language === 'hi' ? w.messageHi : w.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACCESSIBILITY INFORMATION */}
              {accessibility && routeResult.accessibility_notes && (
                <div className="card bg-charcoal border border-border rounded-xl p-5 flex flex-col gap-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Accessibility Services
                    </h3>
                    <div className="flex gap-2">
                      {routeResult.accessibility_notes.wheelchairFriendly && (
                        <span className="bg-green/10 text-green border border-green/20 text-[10px] font-semibold px-2 py-0.5 rounded font-heading">
                          Wheelchair Access
                        </span>
                      )}
                      {routeResult.accessibility_notes.elderlyFriendly && (
                        <span className="bg-cyan/10 text-cyan border border-cyan/20 text-[10px] font-semibold px-2 py-0.5 rounded font-heading">
                          Elderly Priority
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {(language === 'hi' 
                      ? routeResult.accessibility_notes.notesHi 
                      : routeResult.accessibility_notes.notes
                    ).map((note, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs font-heading text-text-secondary leading-normal">
                        <span className="text-saffron select-none">✦</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PRO TIPS COLLAPSIBLE ACCORDION */}
              {routeResult.pro_tips && routeResult.pro_tips.length > 0 && (
                <div className="card bg-charcoal border border-border rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setTipsCollapsed(!tipsCollapsed)}
                    className="w-full flex items-center justify-between p-4 font-heading text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer focus:outline-none"
                  >
                    <span>Pro Tips</span>
                    <span className={`text-sm transform transition-transform duration-200 ${tipsCollapsed ? '' : 'rotate-180'}`}>
                      ▼
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {!tipsCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="p-4 space-y-3">
                          {routeResult.pro_tips.map((tipObj, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs font-heading text-text-secondary leading-normal">
                              <span className="text-cyan select-none">💡</span>
                              <span>{language === 'hi' ? tipObj.tipHi : tipObj.tip}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* SHARE & VOICE AUDIO CONTROLS */}
              <div className="flex gap-4 pt-4 border-t border-border shrink-0">
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 py-3 border border-cyan text-cyan hover:bg-cyan/5 rounded-lg font-heading text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                  </svg>
                  <span>Share Route</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleReadAloud}
                  className="flex-1 py-3 border border-saffron text-saffron hover:bg-saffron/5 rounded-lg font-heading text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
                  </svg>
                  <span>Read Aloud</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: Route Map Container */}
      <div className="w-full sm:w-[55%] lg:w-[62%] h-full relative z-0">
        <MapContainer
          center={[25.4310, 81.8850]}
          zoom={13}
          zoomControl={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* CartoDB Dark Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Render Route Overlays if Computed */}
          {routeResult && activePath && (
            <>
              {/* Primary Selected Path (Thick Saffron) */}
              <Polyline
                positions={activePath}
                color="#FF6B00"
                weight={6}
                opacity={0.95}
                lineCap="round"
                lineJoin="round"
              />

              {/* Alt Paths as Thinner Dashed Lines */}
              {/* Alt 1 (Cyan) */}
              {selectedRoute !== 'alt1' && routeResult.alternative_routes[0]?.path && (
                <Polyline
                  positions={routeResult.alternative_routes[0].path}
                  color="#00E5FF"
                  weight={3.5}
                  opacity={0.6}
                  dashArray="8, 6"
                />
              )}

              {/* Alt 2 (Green) */}
              {selectedRoute !== 'alt2' && routeResult.alternative_routes[1]?.path && (
                <Polyline
                  positions={routeResult.alternative_routes[1].path}
                  color="#00E676"
                  weight={3.5}
                  opacity={0.6}
                  dashArray="8, 6"
                />
              )}

              {/* Origin Marker */}
              {originDetails && (
                <CircleMarker
                  center={[originDetails.lat, originDetails.lng]}
                  radius={9}
                  color="#00E676"
                  fillColor="#00E676"
                  fillOpacity={0.8}
                  weight={2}
                >
                  <Tooltip permanent direction="top" offset={[0, -10]}>
                    <div className="text-xs font-semibold font-heading text-text-primary">
                      🟢 {language === 'hi' ? originDetails.nameHi : originDetails.name}
                    </div>
                  </Tooltip>
                </CircleMarker>
              )}

              {/* Destination Marker */}
              {destDetails && (
                <CircleMarker
                  center={[destDetails.lat, destDetails.lng]}
                  radius={9}
                  color="#FF6B00"
                  fillColor="#FF6B00"
                  fillOpacity={0.8}
                  weight={2}
                >
                  <Tooltip permanent direction="top" offset={[0, -10]}>
                    <div className="text-xs font-semibold font-heading text-text-primary">
                      🏁 {language === 'hi' ? destDetails.nameHi : destDetails.name}
                    </div>
                  </Tooltip>
                </CircleMarker>
              )}

              {/* Intermediate Coordinate Dots */}
              {activePath.slice(1, -1).map((coord, i) => (
                <CircleMarker
                  key={i}
                  center={coord}
                  radius={3.5}
                  color="#FFFFFF"
                  fillColor="#131A2B"
                  fillOpacity={0.9}
                  weight={1.5}
                />
              ))}

              {/* Fit map viewport bounds dynamically to selected path */}
              <MapBoundsUpdater path={activePath} />
            </>
          )}
        </MapContainer>

        {/* DEFAULT OVERLAY IF NO ROUTE IS CALCULATED */}
        {!routeResult && !isLoading && (
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-[3px] flex items-center justify-center p-6 z-[400] pointer-events-none">
            <div className="bg-[#131A2B]/90 border border-border p-6 rounded-xl text-center max-w-sm pointer-events-auto shadow-2xl">
              <div className="w-12 h-12 bg-saffron/10 border border-saffron/25 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🗺️
              </div>
              <h3 className="font-heading font-bold text-text-primary mb-2 text-lg">
                Enter Route Details
              </h3>
              <p className="font-heading text-xs text-text-secondary leading-relaxed">
                Provide travel endpoints on the left. KumbhFlow AI will analyze real-time crowd congestion and generate optimal pathways.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SHARE MODAL WITH SIMULATED QR CODE */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-charcoal border border-border rounded-xl p-8 max-w-xs w-full text-center space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  Scan Route
                </h3>
                <p className="text-xs text-text-secondary font-heading">
                  Scan the QR code to navigate offline on your mobile device
                </p>
              </div>

              {/* SIMULATED QR CODE BOX */}
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-cyan/40 bg-charcoal-light rounded-lg flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                {/* Cybernetic details */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan" />
                
                {/* Abstract QR grid simulation */}
                <div className="grid grid-cols-6 gap-1 w-32 h-32 opacity-75">
                  {[...Array(36)].map((_, i) => {
                    const isFilled = (i % 2 === 0 && i % 3 !== 0) || i === 0 || i === 5 || i === 30 || i === 35;
                    return (
                      <div
                        key={i}
                        className={`rounded-sm transition duration-300 ${
                          isFilled ? 'bg-cyan' : 'bg-transparent'
                        }`}
                      />
                    );
                  })}
                </div>
                
                <span className="absolute bottom-1 font-mono text-[8px] text-cyan/70 tracking-widest uppercase">
                  KumbhFlow MelaMesh
                </span>
              </div>

              <p className="text-[10px] text-text-dim font-heading max-w-[200px] mx-auto">
                Operates offline via the Prayagraj Local Mela Meshnet. No internet connection required.
              </p>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 bg-saffron hover:bg-saffron-light text-white font-heading font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
