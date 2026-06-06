import { motion } from 'framer-motion';
import { useAppState, useAppDispatch } from '../context/AppContext';

const modules = [
  { id: 'command-center', label: 'Command Center', shortLabel: 'Dashboard' },
  { id: 'route-intelligence', label: 'Route Intelligence', shortLabel: 'Routes' },
  { id: 'smart-parking', label: 'Smart Parking', shortLabel: 'Parking' },
  { id: 'surge-forecast', label: 'Surge Forecast', shortLabel: 'Forecast' },
  { id: 'kiosk-mode', label: 'Kiosk Mode', shortLabel: 'Kiosk' },
];

export default function Navbar() {
  const { activeModule } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <nav className="navbar">
      {/* Logo / Wordmark */}
      <div className="navbar-brand">
        <div className="wordmark">
          <span className="wordmark-kumbh">Kumbh</span>
          <span className="wordmark-flow">Flow</span>
        </div>
        <span className="tagline">Move Millions. Miss Nothing.</span>
      </div>

      {/* Module Tabs */}
      <div className="nav-tabs">
        {modules.map((mod) => (
          <motion.button
            key={mod.id}
            className={`nav-tab ${activeModule === mod.id ? 'nav-tab-active' : ''}`}
            onClick={() => dispatch({ type: 'SET_MODULE', payload: mod.id })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="nav-tab-label">{mod.shortLabel}</span>
            {activeModule === mod.id && (
              <motion.div
                className="nav-tab-indicator"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Right: Status */}
      <div className="nav-status">
        <div className="live-indicator">
          <span className="live-dot" />
          <span className="live-text">LIVE</span>
        </div>
        <div className="nav-time">
          <TimeDisplay />
        </div>
      </div>
    </nav>
  );
}

function TimeDisplay() {
  const now = new Date();
  return (
    <span className="font-mono text-xs" style={{ color: '#8892A4' }}>
      {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      {' · '}
      {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
