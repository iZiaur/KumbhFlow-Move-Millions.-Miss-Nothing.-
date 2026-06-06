import { useEffect } from 'react';
import Navbar from './components/Navbar';
import MetricsBar from './components/MetricsBar';
import LiveMap from './components/LiveMap';
import AlertFeed from './components/AlertFeed';
import TransportTimeline from './components/TransportTimeline';
import RouteIntelligence from './components/RouteIntelligence';
import SmartParking from './components/SmartParking';
import SurgeForecast from './components/SurgeForecast';
import KioskMode from './components/KioskMode';
import { useSimulation } from './hooks/useSimulation';
import { useAppState, useAppDispatch } from './context/AppContext';

function CommandCenter() {
  return (
    <div className="dashboard">
      {/* Metrics Bar */}
      <div className="dashboard-top">
        <MetricsBar />
      </div>

      {/* Main Area: Map + Alert Sidebar */}
      <div className="dashboard-main">
        <div className="map-container">
          <LiveMap />
        </div>
        <div className="alert-sidebar">
          <AlertFeed />
        </div>
      </div>

      {/* Bottom Timeline Panel */}
      <div className="dashboard-bottom">
        <TransportTimeline />
      </div>
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#0A0E1A' }}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white/30 font-[Space_Grotesk] mb-2">{title}</h2>
        <p className="text-sm text-white/15 font-[IBM_Plex_Mono]">Module coming soon...</p>
      </div>
    </div>
  );
}

import { useLiveTick } from './hooks/useLiveTick';
import { useDemoController } from './hooks/useDemoController';

export default function App() {
  // Start the live data simulation and demo cascade controller
  useLiveTick();
  useDemoController();

  const dispatch = useAppDispatch();
  const { activeModule, isDemoActive, demoStep, demoCaption } = useAppState();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemoActive, dispatch]);

  const renderModule = () => {
    switch (activeModule) {
      case 'command-center':
        return <CommandCenter />;
      case 'route-intelligence':
        return <RouteIntelligence />;
      case 'smart-parking':
        return <SmartParking />;
      case 'surge-forecast':
        return <SurgeForecast />;
      case 'kiosk-mode':
        return <KioskMode />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <div className="app" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0E1A', position: 'relative' }}>
      {/* Top Navigation */}
      <Navbar />

      {/* Active Module */}
      {renderModule()}

      {/* Sticky Data Sources Footer */}
      <footer className="w-full bg-[#0D1321]/95 border-t border-white/5 px-6 flex items-center justify-between z-10 shrink-0 font-mono text-[10px] text-white/40 h-[40px] md:h-[32px] min-h-[40px] md:min-h-[32px] select-none">
        <div>
          <span>Data Sources: </span>
          <a
            href="https://up.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan hover:underline font-bold"
          >
            Prayagraj Mahakumbh 2025 Portal
          </a>
          <span> (Projections: ~660M cumulative pilgrims)</span>
        </div>
        <div className="hidden sm:block text-white/20">
          KumbhFlow Dynamic AI Routing &copy; 2026
        </div>
      </footer>

      {/* Floating Demo Caption Overlay */}
      {isDemoActive && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-[#131A2B]/95 border-2 border-saffron px-6 py-4 shadow-2xl flex items-center gap-4 max-w-[750px] w-[90%] rounded-lg font-heading">
          <div className="w-3.5 h-3.5 bg-saffron animate-ping rounded-full shrink-0" />
          <div className="flex-1">
            <span className="text-[10px] font-mono font-extrabold text-saffron uppercase tracking-widest block mb-0.5">
              AI Dynamic Cascade Demo — Step {demoStep}/6
            </span>
            <p className="text-sm font-semibold text-white leading-relaxed">
              {demoCaption}
            </p>
          </div>
        </div>
      )}

      {/* Decorative Ganga wave motif */}
      <div className="wave-motif" />
    </div>
  );
}
