import { useEffect, useRef, useMemo } from 'react';
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
  const { alerts } = useAppState();
  const dispatch = useAppDispatch();
  const scrollContainerRef = useRef(null);
  const prevAlertCountRef = useRef(alerts.length);

  // Count unacknowledged alerts
  const unacknowledgedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged).length,
    [alerts],
  );

  // Auto-scroll to top when a new alert arrives
  useEffect(() => {
    if (alerts.length > prevAlertCountRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevAlertCountRef.current = alerts.length;
  }, [alerts.length]);

  // Dispatch handlers
  const handleDispatch = (id) => {
    dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: id });
  };

  const handleDivert = (id) => {
    dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: id });
  };

  return (
    <div className="h-full flex flex-col bg-[#0D1321] font-[Space_Grotesk] rounded-xl">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Pulsing red dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF1744] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF1744]" />
          </span>

          <h2 className="text-sm font-bold tracking-widest text-white/90 uppercase">
            Alert Feed
          </h2>
        </div>

        {/* Unacknowledged count badge */}
        {unacknowledgedCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-bold rounded-full bg-[#FF1744] text-white font-[IBM_Plex_Mono]">
            {unacknowledgedCount}
          </span>
        )}
      </div>

      {/* ── Scrollable alert list ────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
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
      </div>
    </div>
  );
}
