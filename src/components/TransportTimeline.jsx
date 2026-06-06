import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppState } from '../context/AppContext';
import { getTodayEvents, formatCrowd } from '../data/snanCalendar';

/* ─── Section 1: Train/Bus Arrivals ─── */

function StatusPill({ status }) {
  const isOnTime = status === 'on-time';
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
        isOnTime
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {isOnTime ? 'On Time' : 'Delayed'}
    </span>
  );
}

function OccupancyBar({ percent }) {
  const barColor =
    percent > 85 ? '#FF1744' : percent > 60 ? '#FFB300' : '#00E676';
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${percent}%`, backgroundColor: barColor }}
      />
    </div>
  );
}

function ArrivalsSection({ arrivals }) {
  const display = arrivals.slice(0, 5);

  return (
    <div className="flex flex-col">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
        Upcoming Arrivals
      </h3>
      <div className="flex flex-col gap-1.5">
        {display.map((a) => (
          <div
            key={a.id}
            className="rounded border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm flex-shrink-0">
                  {a.type === 'train' ? '🚂' : '🚌'}
                </span>
                <span className="truncate text-[11px] font-medium text-gray-200">
                  {a.name}
                </span>
              </div>
              <StatusPill status={a.status} />
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10px] text-gray-500">
              <span>from {a.origin}</span>
              <span className="font-mono text-cyan-400">ETA {a.eta}</span>
            </div>
            <OccupancyBar percent={a.occupancy} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section 2: Surge Prediction Sparkline ─── */

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="rounded border border-white/10 bg-[#131A2B] px-3 py-2 shadow-lg">
      <p className="text-[10px] text-gray-400">{d.time}</p>
      <p className="font-mono text-sm font-bold text-cyan-400">
        {d.crowd?.toLocaleString()} people
      </p>
      <p className="text-[9px] text-gray-500">
        Range: {d.lower?.toLocaleString()} – {d.upper?.toLocaleString()}
      </p>
    </div>
  );
}

function SurgeSection({ surgePrediction }) {
  // Sample every 3rd point for cleaner display
  const chartData = useMemo(
    () => surgePrediction.filter((_, i) => i % 2 === 0),
    [surgePrediction]
  );

  return (
    <div className="flex flex-col">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
        Crowd Surge — Next 6 Hours
      </h3>
      <div className="h-[155px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="surgeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="time"
              tick={{ fill: '#6B7280', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1000000
                  ? `${(v / 1000000).toFixed(0)}M`
                  : v >= 1000
                  ? `${(v / 1000).toFixed(0)}K`
                  : v
              }
            />

            <RechartsTooltip content={<CustomTooltip />} />

            {/* Confidence band */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#bandFill)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />

            {/* Main crowd line */}
            <Area
              type="monotone"
              dataKey="crowd"
              stroke="#00E5FF"
              strokeWidth={1.5}
              fill="url(#surgeFill)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.isSnanEvent) {
                  return (
                    <circle
                      key={`snan-${cx}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#FF6B00"
                      stroke="#FF6B00"
                      strokeWidth={2}
                      strokeOpacity={0.4}
                    />
                  );
                }
                return null;
              }}
              activeDot={{
                r: 3,
                fill: '#00E5FF',
                stroke: '#0A0E1A',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Section 3: Snan Schedule ─── */

function SnanStatusBadge({ status }) {
  const styles = {
    upcoming: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    active: 'bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse',
    completed: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
        styles[status] || styles.upcoming
      }`}
    >
      {status}
    </span>
  );
}

function SnanSection() {
  const events = getTodayEvents();

  return (
    <div className="flex flex-col">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
        Snan Schedule
      </h3>
      <div className="flex flex-col gap-2">
        {events.map((evt, i) => (
          <div
            key={i}
            className="flex flex-col rounded border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] font-bold text-cyan-400">
                  {evt.time}
                </span>
                <span className="truncate text-[11px] font-medium text-gray-200">
                  {evt.name}
                </span>
              </div>
              <SnanStatusBadge status={evt.status} />
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10px] text-gray-500">
              <span>📍 {evt.ghat}</span>
              <span className="font-mono">
                ~{formatCrowd(evt.expectedCrowd)} expected
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Panel ─── */

function TransportTimeline() {
  const { arrivals, surgePrediction } = useAppState();

  return (
    <div className="w-full border-t border-white/5 bg-[#0D1321]">
      <div className="flex h-[220px] flex-row gap-4 overflow-hidden px-4 py-3">
        {/* Left: Arrivals ~35% */}
        <div className="w-[35%] flex-shrink-0 overflow-y-auto pr-2 scrollbar-thin">
          <ArrivalsSection arrivals={arrivals} />
        </div>

        {/* Center: Surge Chart ~40% */}
        <div className="flex-1 min-w-0 border-x border-white/5 px-4">
          <SurgeSection surgePrediction={surgePrediction} />
        </div>

        {/* Right: Snan Schedule ~25% */}
        <div className="w-[25%] flex-shrink-0 overflow-y-auto pl-2 scrollbar-thin">
          <SnanSection />
        </div>
      </div>
    </div>
  );
}

export default TransportTimeline;
