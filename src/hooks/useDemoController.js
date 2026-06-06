import { useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';

const STEP2_DURATION = 8000;

export function useDemoController() {
  const { isDemoActive, crowds, parking, roads, simSpeedMultiplier } = useAppState();
  const dispatch = useAppDispatch();

  // Create refs to prevent stale closure state issues in the async loop
  const crowdsRef = useRef(crowds);
  const parkingRef = useRef(parking);
  const roadsRef = useRef(roads);
  const simSpeedRef = useRef(simSpeedMultiplier);

  useEffect(() => {
    crowdsRef.current = crowds;
    parkingRef.current = parking;
    roadsRef.current = roads;
    simSpeedRef.current = simSpeedMultiplier;
  });

  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isDemoActive) {
      cancelledRef.current = true;
      return;
    }

    cancelledRef.current = false;

    const sleep = (ms) => new Promise((resolve) => {
      const activeSpeed = simSpeedRef.current || 1.0;
      setTimeout(resolve, ms / activeSpeed);
    });

    const steps = [
      {
        id: 1,
        label: 'Dashboard normal flow',
        tab: 'command-center',
        duration: 8000,
        time: '07:30',
        caption: 'Step 1/6: Normal Operations at Prayagraj Mahakumbh (07:30). Mela area flow is steady with 1.8M cumulative pilgrims.',
        action: () => {
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              totalPilgrims: 1850000,
              activeVehicles: 15400,
              availableParking: 28400,
              congestionIndex: 4.2,
              activeAlerts: 1
            }
          });
          dispatch({ type: 'ADD_EVENT_LOG', payload: 'Step 1/6: Normal Operations. Mela flow stable at 07:30.' });
        }
      },
      {
        id: 2,
        label: 'Alert spikes on Dashboard',
        tab: 'command-center',
        duration: STEP2_DURATION,
        time: '07:42',
        caption: 'Step 2/6: Alert! Sangam Ghat congestion spikes to 94% at 07:42 due to early influx for the morning Shahi Snan ritual.',
        action: () => {
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              totalPilgrims: 2450000,
              activeVehicles: 28900,
              availableParking: 19800,
              congestionIndex: 9.4,
              activeAlerts: 2
            }
          });
          const updatedCrowds = crowdsRef.current.map(c => {
            if (c.id === 'triveni-sangam') {
              return { ...c, currentCrowd: Math.round(c.capacity * 0.94), density: 'high', trend: 'rising' };
            }
            return c;
          });
          dispatch({ type: 'UPDATE_CROWDS', payload: updatedCrowds });
          dispatch({
            type: 'ADD_ALERT',
            payload: {
              id: 'demo-alert-1',
              type: 'crowd_surge',
              severity: 'critical',
              title: 'CRITICAL: Confluence corridor overload at Triveni Sangam',
              location: 'Triveni Sangam',
              timestamp: '07:42 AM',
              aiSuggestion: 'Auto-divert incoming flow to Ram Ghat. Reallocate Southern Naini Parking Lot P4 immediately.',
              acknowledged: false
            }
          });
          dispatch({ type: 'ADD_EVENT_LOG', payload: 'Step 2/6: Alert! Triveni Sangam congestion spiked to 94%.' });
        }
      },
      {
        id: 3,
        label: 'Surge Forecast EWMA prediction',
        tab: 'surge-forecast',
        duration: 12000,
        time: '07:44',
        caption: 'Step 3/6: AI Forecaster detects surge 18 minutes early (predicted 425K vs 300K capacity). Pre-positioning alerts triggered.',
        action: () => {
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              totalPilgrims: 2650000,
              activeVehicles: 31200,
              availableParking: 16400,
              congestionIndex: 9.2,
              activeAlerts: 2
            }
          });
          const updatedCrowds = crowdsRef.current.map(c => {
            if (c.id === 'triveni-sangam') {
              return { ...c, currentCrowd: Math.round(c.capacity * 0.94), density: 'high', trend: 'rising' };
            }
            return c;
          });
          dispatch({ type: 'UPDATE_CROWDS', payload: updatedCrowds });
          dispatch({ type: 'ADD_EVENT_LOG', payload: 'Step 3/6: AI Forecast predicts crowd surge 18 mins ahead (425K vs 300K capacity).' });
        }
      },
      {
        id: 4,
        label: 'Dijkstra reroute to Route C',
        tab: 'route-intelligence',
        duration: 12000,
        time: '07:47',
        caption: 'Step 4/6: Dijkstra routing engine automatically reroutes 42,000 incoming pilgrims from NH-30 (Route A) to East Bypass (Route C).',
        action: () => {
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              totalPilgrims: 2710000,
              activeVehicles: 30200,
              availableParking: 14500,
              congestionIndex: 8.5,
              activeAlerts: 2
            }
          });
          const updatedRoads = roadsRef.current.map(road => {
            if (road.id === 'road-13' || road.id === 'road-3') {
              return { ...road, congestion: 4.5 };
            }
            return road;
          });
          dispatch({ type: 'UPDATE_ROADS', payload: updatedRoads });
          dispatch({ type: 'ADD_EVENT_LOG', payload: 'Step 4/6: Dijkstra router reweighted. Diverting 42,000 pilgrims to Route C.' });
        }
      },
      {
        id: 5,
        label: 'P4 → P6 auto-rebalance',
        tab: 'smart-parking',
        duration: 10000,
        time: '07:50',
        caption: 'Step 5/6: Parking P4 crosses 90% threshold. Greedy allocator activates, redirecting 1,240 incoming vehicles to Naini Lot P6 (+4 min walk).',
        action: () => {
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              totalPilgrims: 2780000,
              activeVehicles: 29500,
              availableParking: 12100,
              congestionIndex: 7.6,
              activeAlerts: 1
            }
          });
          const updatedParking = parkingRef.current.map(p => {
            if (p.id === 'P4') {
              return { ...p, occupied: Math.round(p.totalSlots * 0.92), fillPercent: 92, status: 'full' };
            }
            return p;
          });
          dispatch({ type: 'UPDATE_PARKING', payload: updatedParking });
          dispatch({
            type: 'TRIGGER_REBALANCE',
            payload: {
              source: 'P4',
              target: 'P6',
              vehicles: 1240,
              extraWalk: 4
            }
          });
          dispatch({
            type: 'ADD_ALERT',
            payload: {
              id: `parking-rebalance-${Date.now()}`,
              type: 'info',
              severity: 'warning',
              title: 'PARKING REDIRECT: Naini P4 at 92%',
              location: 'Parking Lot P4',
              timestamp: '07:50 AM',
              aiSuggestion: 'Diverting incoming vehicles to P6 (+4 min walk). P6 occupancy currently 50%.',
              acknowledged: false
            }
          });
          dispatch({ type: 'ADD_EVENT_LOG', payload: 'Step 5/6: Parking P4 at 92%. Rebalancing: 1,240 vehicles redirected to P6.' });
        }
      },
      {
        id: 6,
        label: 'Kiosk bilingual recommendation',
        tab: 'kiosk-mode',
        duration: 10000,
        time: '07:52',
        caption: 'Step 6/6: Live Hindi & English guidance routes pushed to touch-kiosks. Pilgrims scan GPS directions to P6 and Route C.',
        action: () => {
          dispatch({
            type: 'UPDATE_METRICS',
            payload: {
              totalPilgrims: 2820000,
              activeVehicles: 26800,
              availableParking: 13200,
              congestionIndex: 6.9,
              activeAlerts: 0
            }
          });
          dispatch({ type: 'ADD_EVENT_LOG', payload: 'Step 6/6: Push commuter guidance to touch-kiosks in English and Hindi.' });
        }
      }
    ];

    const run = async () => {
      for (const step of steps) {
        if (cancelledRef.current) break;

        console.log(`[${new Date().toISOString()}] Starting Step ${step.id}/6 — ${step.label} (Tab: ${step.tab}, Duration: ${step.duration}ms)`);

        // Update step state
        dispatch({
          type: 'SET_DEMO_STATE',
          payload: {
            isDemoActive: true,
            demoStep: step.id,
            demoCaption: step.caption
          }
        });

        // Set time & tab
        dispatch({ type: 'SET_SIMULATION_TIME', payload: step.time });
        dispatch({ type: 'SET_MODULE', payload: step.tab });

        // Trigger updates & logging
        step.action();

        // Wait for step duration
        await sleep(step.duration);
      }

      // Check if not cancelled, then log completion & reset
      if (!cancelledRef.current) {
        console.log(`[${new Date().toISOString()}] Scenario Complete. Triggering final recovery/reset.`);
        dispatch({ type: 'ADD_EVENT_LOG', payload: 'Demo completed. Resetting simulation.' });
        dispatch({ type: 'RESET_DEMO' });
      }
    };

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [isDemoActive, dispatch]);
}
