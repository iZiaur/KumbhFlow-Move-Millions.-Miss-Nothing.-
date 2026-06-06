const severityStyles = {
  critical:
    'bg-red-500/20 text-red-400 border border-red-500/30',
  warning:
    'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  info:
    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
};

function SeverityBadge({ severity = 'info' }) {
  const base = severityStyles[severity] || severityStyles.info;
  const pulse = severity === 'critical' ? 'animate-pulse' : '';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${base} ${pulse}`}
    >
      {severity}
    </span>
  );
}

export default SeverityBadge;
