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
  const { activeModule, isDemoActive, simulationTime } = useAppState();
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
      <div className="nav-status" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <button
          onClick={() => {
            dispatch({ type: 'RESET_DEMO' });
            dispatch({ type: 'ADD_EVENT_LOG', payload: 'Mela simulation manually reset to 07:30.' });
          }}
          className="px-3 py-1.5 rounded text-xs font-bold font-mono transition duration-200 cursor-pointer bg-charcoal border border-border text-text-secondary hover:text-white"
        >
          ↻ Reset Scenario
        </button>

        <button
          onClick={() => {
            if (isDemoActive) {
              dispatch({ type: 'RESET_DEMO' });
            } else {
              dispatch({
                type: 'SET_DEMO_STATE',
                payload: {
                  isDemoActive: true,
                  demoStep: 1,
                  demoCaption: "Step 1/6: Normal Operations at Prayagraj Mahakumbh (07:30). Mela area flow is steady with 1.8M cumulative pilgrims.",
                },
              });
              dispatch({ type: 'SET_SIMULATION_TIME', payload: '07:30' });
              dispatch({ type: 'SET_MODULE', payload: 'command-center' });
            }
          }}
          className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition duration-200 cursor-pointer shadow ${
            isDemoActive 
              ? 'bg-red text-white hover:bg-red/80' 
              : 'bg-saffron text-white hover:bg-saffron/80'
          }`}
        >
          {isDemoActive ? '⏹ Stop Demo' : '▶ Run Demo Scenario'}
        </button>

        <div className="live-indicator">
          <span className="live-dot" />
          <span className="live-text">LIVE</span>
        </div>
        <div className="nav-time font-mono text-xs" style={{ color: '#00E5FF', fontWeight: 'bold' }}>
          ⏱️ {simulationTime}
        </div>
      </div>
    </nav>
  );
}
