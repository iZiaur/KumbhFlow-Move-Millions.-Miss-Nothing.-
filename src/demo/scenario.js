// Timed scenario script for the KumbhFlow 60-second cascade demo.
// Narrates the cascade of: Sangam spike -> 18min surge forecast -> Dijkstra reroute -> Parking reallocate -> Kiosk guidance -> Congestion recovery.

export const DEMO_STEPS = [
  {
    step: 1,
    time: "07:30",
    tab: "command-center",
    caption: "Step 1/6: Normal Operations at Prayagraj Mahakumbh (07:30). Mela area flow is steady with 1.8M cumulative pilgrims.",
    stateUpdate: {
      metrics: {
        totalPilgrims: 1850000,
        activeVehicles: 15400,
        availableParking: 28400,
        congestionIndex: 4.2,
        activeAlerts: 1
      },
      sangamCongestion: 52 // % congestion
    }
  },
  {
    step: 2,
    time: "07:42",
    tab: "command-center",
    caption: "Step 2/6: Alert! Sangam Ghat congestion spikes to 94% at 07:42 due to early influx for the morning Shahi Snan ritual.",
    stateUpdate: {
      metrics: {
        totalPilgrims: 2450000,
        activeVehicles: 28900,
        availableParking: 19800,
        congestionIndex: 9.4,
        activeAlerts: 2
      },
      sangamCongestion: 94,
      alert: {
        id: "demo-alert-1",
        type: "crowd_surge",
        severity: "critical",
        title: "CRITICAL: Confluence corridor overload at Triveni Sangam",
        location: "Triveni Sangam",
        timestamp: "07:42 AM",
        aiSuggestion: "Auto-divert incoming flow to Ram Ghat. Reallocate Southern Naini Parking Lot P4 immediately.",
        acknowledged: false
      }
    }
  },
  {
    step: 3,
    time: "07:44",
    tab: "surge-forecast",
    caption: "Step 3/6: AI Forecaster detects surge 18 minutes early (predicted 425K vs 300K capacity). Pre-positioning alerts triggered.",
    stateUpdate: {
      metrics: {
        totalPilgrims: 2650000,
        activeVehicles: 31200,
        availableParking: 16400,
        congestionIndex: 9.2,
        activeAlerts: 2
      },
      surgeAlert: true
    }
  },
  {
    step: 4,
    time: "07:47",
    tab: "route-intelligence",
    caption: "Step 4/6: Dijkstra routing engine automatically reroutes 42,000 incoming pilgrims from NH-30 (Route A) to East Bypass (Route C).",
    stateUpdate: {
      metrics: {
        totalPilgrims: 2710000,
        activeVehicles: 30200,
        availableParking: 14500,
        congestionIndex: 8.5,
        activeAlerts: 2
      },
      routeOverride: "alt2" // Route C
    }
  },
  {
    step: 5,
    time: "07:50",
    tab: "smart-parking",
    caption: "Step 5/6: Parking P4 crosses 90% threshold. Greedy allocator activates, redirecting 1,240 incoming vehicles to Naini Lot P6 (+4 min walk).",
    stateUpdate: {
      metrics: {
        totalPilgrims: 2780000,
        activeVehicles: 29500,
        availableParking: 12100,
        congestionIndex: 7.6,
        activeAlerts: 1
      },
      parkingRebalance: {
        source: "P4",
        target: "P6",
        vehicles: 1240,
        extraWalk: 4
      }
    }
  },
  {
    step: 6,
    time: "07:52",
    tab: "kiosk-mode",
    caption: "Step 6/6: Live Hindi & English guidance routes pushed to touch-kiosks. Pilgrims scan GPS directions to P6 and Route C.",
    stateUpdate: {
      metrics: {
        totalPilgrims: 2820000,
        activeVehicles: 26800,
        availableParking: 13200,
        congestionIndex: 6.9,
        activeAlerts: 0
      }
    }
  },
  {
    step: 7,
    time: "07:54",
    tab: "command-center",
    caption: "Demo Complete: Traffic stabilized. Pilgrim routing and parking rebalancing successfully drop congestion from 94% to 61% in 12 min.",
    stateUpdate: {
      metrics: {
        totalPilgrims: 2850000,
        activeVehicles: 24500,
        availableParking: 15400,
        congestionIndex: 6.1,
        activeAlerts: 0
      },
      sangamCongestion: 61
    }
  }
];
