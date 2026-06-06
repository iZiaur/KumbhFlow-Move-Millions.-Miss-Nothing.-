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
import { useAppState } from './context/AppContext';

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

export default function App() {
  // Start the live data simulation
  useSimulation();
  const { activeModule } = useAppState();

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
    <div className="app" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0E1A' }}>
      {/* Top Navigation */}
      <Navbar />

      {/* Active Module */}
      {renderModule()}

      {/* Decorative Ganga wave motif */}
      <div className="wave-motif" />
    </div>
  );
}
