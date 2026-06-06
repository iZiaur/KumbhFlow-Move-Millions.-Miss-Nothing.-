import { ghatLocations, parkingZones } from './ghatLocations';

// Random number in range with optional bias
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate initial crowd data per ghat
export function generateCrowdData() {
  return ghatLocations
    .filter((g) => g.type === 'ghat')
    .map((ghat) => ({
      ...ghat,
      currentCrowd: rand(Math.floor(ghat.capacity * 0.3), Math.floor(ghat.capacity * 0.85)),
      trend: Math.random() > 0.5 ? 'rising' : 'falling',
      density: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
    }));
}

// Generate parking occupancy
export function generateParkingData() {
  return parkingZones.map((zone) => {
    const occupied = rand(Math.floor(zone.totalSlots * 0.2), Math.floor(zone.totalSlots * 0.95));
    const fillPercent = Math.round((occupied / zone.totalSlots) * 100);
    return {
      ...zone,
      occupied,
      available: zone.totalSlots - occupied,
      fillPercent,
      status: fillPercent > 90 ? 'full' : fillPercent > 70 ? 'filling' : 'available',
    };
  });
}

// Generate initial metrics
export function generateMetrics() {
  return {
    totalPilgrims: rand(1200000, 3800000),
    activeVehicles: rand(12000, 45000),
    availableParking: rand(800, 5200),
    congestionIndex: randFloat(2.1, 9.4),
    activeAlerts: rand(3, 28),
  };
}

// Alert templates
const alertTemplates = [
  {
    type: 'road_closure',
    severity: 'critical',
    titles: [
      'Road Closure on NH-19 near Jhunsi Bridge',
      'Emergency closure: Parade Ground approach road',
      'Barricade breach at Sector 14 entry gate',
    ],
    locations: ['NH-19 Jhunsi', 'Parade Ground', 'Sector 14'],
    aiSuggestions: [
      'Divert traffic via Bypass Road. Deploy 3 additional traffic police.',
      'Redirect buses to P7 parking. Alert all incoming Route 1 buses.',
      'Seal entry, deploy crowd control team. Estimated clearance: 45 min.',
    ],
  },
  {
    type: 'crowd_surge',
    severity: 'critical',
    titles: [
      'Crowd surge detected at Triveni Sangam',
      'Dangerous density at Dashashwamedh Ghat',
      'Stampede risk: Arail Ghat approach narrowing',
    ],
    locations: ['Triveni Sangam', 'Dashashwamedh Ghat', 'Arail Ghat'],
    aiSuggestions: [
      'Open overflow barriers on east side. Deploy medical team standby.',
      'Limit new entries. Announce alternate ghat via PA system.',
      'Widen approach corridor. Redirect foot traffic via Route B.',
    ],
  },
  {
    type: 'vehicle_breakdown',
    severity: 'warning',
    titles: [
      'Bus breakdown on Route 2 near Civil Lines',
      'Auto-rickshaw accident at GT Road junction',
      'Train delay: Prayagraj Jn platform 3 congestion',
    ],
    locations: ['Civil Lines', 'GT Road Junction', 'Prayagraj Jn'],
    aiSuggestions: [
      'Dispatch tow vehicle. Reroute following buses via NH-30.',
      'Clear junction. Minor injuries reported, ambulance dispatched.',
      'Announce delay on PA. Direct passengers to platform 1 overflow.',
    ],
  },
  {
    type: 'weather',
    severity: 'warning',
    titles: [
      'Dense fog advisory — visibility below 50m',
      'Rain forecast in next 2 hours — slippery ghats',
      'Cold wave alert — temperature dropping to 4°C',
    ],
    locations: ['Mela Area', 'All Ghats', 'Prayagraj City'],
    aiSuggestions: [
      'Slow all vehicle movement. Enable fog lights on route markers.',
      'Deploy anti-slip mats at ghats. Pre-position medical teams.',
      'Open warming shelters at Sectors 5, 8, 12. Distribute blankets.',
    ],
  },
  {
    type: 'info',
    severity: 'info',
    titles: [
      'VIP convoy passing through Sector 9',
      'New temporary bridge opened at Arail crossing',
      'Parking Zone P5 reopened after maintenance',
    ],
    locations: ['Sector 9', 'Arail Crossing', 'P5 Zone'],
    aiSuggestions: [
      'Brief traffic pause. Normal flow resumes in 10 minutes.',
      'Redirect pedestrian traffic to use new bridge. Capacity: 5000/hr.',
      'Update parking displays. Notify queued vehicles at P4.',
    ],
  },
];

// Generate a random alert
export function generateAlert() {
  const template = alertTemplates[rand(0, alertTemplates.length - 1)];
  const idx = rand(0, template.titles.length - 1);
  const now = new Date();

  return {
    id: `alert-${Date.now()}-${rand(1000, 9999)}`,
    type: template.type,
    severity: template.severity,
    title: template.titles[idx],
    location: template.locations[idx],
    timestamp: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    timestampRaw: now.getTime(),
    aiSuggestion: template.aiSuggestions[idx],
    acknowledged: false,
  };
}

// Generate initial alerts
export function generateInitialAlerts(count = 8) {
  const alerts = [];
  for (let i = 0; i < count; i++) {
    const alert = generateAlert();
    alert.timestampRaw = Date.now() - rand(60000, 600000);
    alert.timestamp = new Date(alert.timestampRaw).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    alerts.push(alert);
  }
  return alerts.sort((a, b) => b.timestampRaw - a.timestampRaw);
}

// Generate transport arrivals
export function generateArrivals() {
  const now = new Date();
  const arrivals = [];
  const types = ['train', 'bus', 'bus', 'bus', 'train', 'bus'];
  const names = [
    'Prayag Express (14203)',
    'Kumbh Shuttle A',
    'Kumbh Shuttle B',
    'Sangam Express Bus',
    'Triveni Superfast (12417)',
    'Mela Special Bus',
  ];
  const origins = [
    'Lucknow',
    'Civil Lines Depot',
    'Naini Station',
    'Varanasi',
    'Delhi',
    'Jhunsi Depot',
  ];
  const capacities = [1200, 60, 60, 45, 1800, 55];

  for (let i = 0; i < 6; i++) {
    const eta = new Date(now.getTime() + rand(5, 120) * 60000);
    arrivals.push({
      id: `arr-${i}`,
      type: types[i],
      name: names[i],
      origin: origins[i],
      eta: eta.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      etaRaw: eta.getTime(),
      capacity: capacities[i],
      occupancy: rand(40, 95),
      status: rand(0, 10) > 2 ? 'on-time' : 'delayed',
      platform: types[i] === 'train' ? `Platform ${rand(1, 5)}` : `Bay ${rand(1, 12)}`,
    });
  }

  return arrivals.sort((a, b) => a.etaRaw - b.etaRaw);
}

// Generate 6-hour surge prediction data
export function generateSurgePrediction() {
  const now = new Date();
  const data = [];

  for (let i = 0; i < 72; i++) {
    const time = new Date(now.getTime() + i * 5 * 60000);
    const hour = time.getHours();
    // Create realistic crowd pattern: peaks at early morning (4-7am) and evening (5-7pm)
    const baseCrowd =
      hour >= 4 && hour <= 7
        ? rand(250000, 450000)
        : hour >= 17 && hour <= 19
          ? rand(200000, 380000)
          : hour >= 10 && hour <= 15
            ? rand(150000, 280000)
            : rand(50000, 150000);

    const noise = rand(-20000, 20000);
    const value = Math.max(0, baseCrowd + noise);

    data.push({
      time: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      timeRaw: time.getTime(),
      crowd: value,
      upper: Math.round(value * 1.15),
      lower: Math.round(value * 0.85),
      isSnanEvent: (hour === 6 || hour === 18) && i % 12 === 0,
    });
  }

  return data;
}

// Nudge a value with random walk
export function nudgeValue(current, min, max, maxDelta) {
  const delta = randFloat(-maxDelta, maxDelta);
  return Math.max(min, Math.min(max, current + delta));
}

// Nudge integer value
export function nudgeInt(current, min, max, maxDelta) {
  const delta = rand(-maxDelta, maxDelta);
  return Math.max(min, Math.min(max, current + delta));
}
