import { motion } from 'framer-motion';
import { useAppState } from '../context/AppContext';
import AnimatedCounter from './AnimatedCounter';

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

const metrics = [
  {
    key: 'totalPilgrims',
    label: 'Total Pilgrims',
    icon: '🙏',
    format: 'millions',
  },
  {
    key: 'activeVehicles',
    label: 'Active Vehicles',
    icon: '🚌',
    format: 'thousands',
  },
  {
    key: 'availableParking',
    label: 'Available Parking',
    icon: '🅿️',
    format: 'raw',
  },
  {
    key: 'congestionIndex',
    label: 'Congestion Index',
    icon: '📊',
    format: 'index',
  },
  {
    key: 'activeAlerts',
    label: 'Active Alerts',
    icon: '🚨',
    format: 'alerts',
  },
];

function getCongestionColor(val) {
  if (val < 4) return '#00E676';
  if (val <= 7) return '#FFB300';
  return '#FF1744';
}

function MetricCard({ icon, label, value, format }) {
  // Determine display values based on format
  let displayValue = value;
  let prefix = '';
  let suffix = '';
  let decimals = 0;
  let color = '#00E5FF';
  let trendPositive = Math.random() > 0.5; // simulated trend

  switch (format) {
    case 'millions':
      displayValue = parseFloat((value / 1000000).toFixed(1));
      suffix = 'M';
      decimals = 1;
      break;
    case 'thousands':
      displayValue = parseFloat((value / 1000).toFixed(1));
      suffix = 'K';
      decimals = 1;
      break;
    case 'raw':
      displayValue = value;
      break;
    case 'index':
      displayValue = parseFloat(value.toFixed(1));
      suffix = ' / 10';
      decimals = 1;
      color = getCongestionColor(value);
      trendPositive = value < 5;
      break;
    case 'alerts':
      displayValue = value;
      color = value > 10 ? '#FF1744' : '#00E5FF';
      trendPositive = value <= 10;
      break;
  }

  return (
    <motion.div
      className="flex flex-1 flex-col rounded-lg border border-white/5 bg-[#131A2B] px-4 py-3 cursor-default"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Label row */}
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <AnimatedCounter
          value={displayValue}
          suffix={suffix}
          decimals={decimals}
          duration={800}
        />
      </div>

      {/* Trend */}
      <div className="mt-1 flex items-center gap-1">
        <span
          className="text-xs font-mono font-semibold"
          style={{ color: trendPositive ? '#00E676' : '#FF1744' }}
        >
          {trendPositive ? '↑' : '↓'}
        </span>
        <span className="text-[10px] text-gray-500">
          {trendPositive ? 'trending up' : 'trending down'}
        </span>
      </div>
    </motion.div>
  );
}

function MetricsBar() {
  const { metrics: metricsData } = useAppState();

  return (
    <div className="flex w-full flex-row gap-3 overflow-x-auto px-4 py-3">
      {metrics.map((m) => (
        <MetricCard
          key={m.key}
          icon={m.icon}
          label={m.label}
          value={metricsData[m.key]}
          format={m.format}
        />
      ))}
    </div>
  );
}

export default MetricsBar;
