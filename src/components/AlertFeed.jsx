import { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useAppDispatch } from '../context/AppContext';
import SeverityBadge from './SeverityBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Left-border colour keyed by severity. */
const SEVERITY_BORDER = {
  critical: '#FF1744',
  warning: '#FFB300',
  info: '#00E5FF',
};

/** Motion variants for individual alert cards. */
const cardVariants = {
  initial: { opacity: 0, x: 80, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 350, damping: 28 },
  },
  exit: {
    opacity: 0,
    x: 60,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

// ---------------------------------------------------------------------------
// Alert card
// ---------------------------------------------------------------------------

function AlertCard({ alert, onDispatch, onDivert }) {
  const borderColor = SEVERITY_BORDER[alert.severity] || '#00E5FF';
  const isCritical = alert.severity === 'critical';

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        relative bg-[#131A2B] rounded-lg overflow-hidden
        ${isCritical && !alert.acknowledged ? 'shadow-[0_0_18px_rgba(255,23,68,0.25)] animate-pulse-subtle' : ''}
        ${alert.acknowledged ? 'opacity-50' : ''}
      `}
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Card body */}
      <div className="px-4 py-4 space-y-3">
        {/* Top row: badge + title */}
        <div className="flex items-start gap-2">
          <SeverityBadge severity={alert.severity} />
          <h4 className="font-[Space_Grotesk] text-sm font-bold text-white leading-snug flex-1">
            {alert.title}
          </h4>
        </div>

        {/* Location + timestamp */}
        <p className="font-[IBM_Plex_Mono] text-[11px] text-white/50 flex items-center gap-2">
          <span>📍 {alert.location}</span>
          <span className="text-white/30">•</span>
          <span>{alert.timestamp}</span>
        </p>

        {/* AI suggestion */}
        {alert.aiSuggestion && (
          <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs text-white/70 font-[IBM_Plex_Mono] leading-relaxed">
            <span className="text-[#00E5FF] mr-1">🤖 AI:</span>
            {alert.aiSuggestion}
          </div>
        )}

        {/* Actions */}
        {!alert.acknowledged && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onDispatch(alert.id)}
              className="
                px-3 py-1.5 text-xs font-semibold font-[Space_Grotesk] rounded
                bg-[#FF6B00] text-white
                hover:bg-[#FF6B00]/80 active:scale-95
                transition-all duration-150
                cursor-pointer
              "
            >
              Dispatch
            </button>
            <button
              onClick={() => onDivert(alert.id)}
              className="
                px-3 py-1.5 text-xs font-semibold font-[Space_Grotesk] rounded
                border border-[#00E5FF] text-[#00E5FF]
                hover:bg-[#00E5FF]/10 active:scale-95
                transition-all duration-150
                cursor-pointer
              "
            >
              Divert
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AlertFeed() {
  const { alerts, events } = useAppState();
  const dispatch = useAppDispatch();
  const scrollContainerRef = useRef(null);
  const prevAlertCountRef = useRef(alerts.length);
  const [activeSubTab, setActiveSubTab] = useState('alerts'); // 'alerts' | 'events'

  // Count unacknowledged alerts
  const unacknowledgedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged).length,
    [alerts],
  );

  // Auto-scroll to top when a new alert arrives
  useEffect(() => {
    if (alerts.length > prevAlertCountRef.current && scrollContainerRef.current && activeSubTab === 'alerts') {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevAlertCountRef.current = alerts.length;
  }, [alerts.length, activeSubTab]);

  // Dispatch handlers
  const handleDispatch = (id) => {
    dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: id });
  };

  const handleDivert = (id) => {
    dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: id });
  };

  return (
    <div className="h-full flex flex-col bg-[#0D1321] font-[Space_Grotesk] rounded-xl">
      {/* ── Header Switcher Tab ────────────────────────────── */}
      <div className="flex border-b border-white/10 shrink-0 p-1 bg-[#090D16] rounded-t-xl">
        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'alerts'
              ? 'bg-saffron text-white shadow-md'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <span>Live Alerts</span>
          {unacknowledgedCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red text-white font-[IBM_Plex_Mono]">
              {unacknowledgedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('events')}
          className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'events'
              ? 'bg-saffron text-white shadow-md'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          <span>Event Log</span>
          {events?.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-cyan text-navy font-[IBM_Plex_Mono]">
              {events.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Scrollable list content ────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {activeSubTab === 'alerts' ? (
          <>
            <AnimatePresence initial={false}>
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDispatch={handleDispatch}
                  onDivert={handleDivert}
                />
              ))}
            </AnimatePresence>

            {/* Empty state */}
            {alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-white/30 text-sm">
                <span className="text-3xl mb-2">✅</span>
                No active alerts
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {events && events.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#131A2B] border border-white/5 rounded-md px-3.5 py-3 font-mono text-[11px] flex gap-2.5 items-start leading-relaxed hover:border-white/10 transition-colors"
              >
                <span className="text-[#00E5FF] font-bold shrink-0">⏱️ {evt.time}</span>
                <span className="text-white/80">{evt.message}</span>
              </div>
            ))}

            {(!events || events.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-white/30 text-xs font-mono text-center">
                <span>[LOG IS EMPTY]</span>
                <span className="text-[10px] text-white/10 mt-1">
                  Step events will record here during demo runs.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
