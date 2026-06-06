import { useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { DEMO_STEPS } from '../demo/scenario';

export function useDemoController() {
  const { isDemoActive, demoStep, crowds, parking, roads, simSpeedMultiplier } = useAppState();
  const dispatch = useAppDispatch();
  const stepRef = useRef(demoStep);

  useEffect(() => {
    stepRef.current = demoStep;
  }, [demoStep]);

  // Log Step 1 when demo starts
  useEffect(() => {
    if (isDemoActive && demoStep === 1) {
      dispatch({ type: 'ADD_EVENT_LOG', payload: 'Step 1/6: Normal Operations. Mela flow stable at 07:30.' });
    }
  }, [isDemoActive, demoStep, dispatch]);

  useEffect(() => {
    if (!isDemoActive) return;

    const speed = simSpeedMultiplier || 1.0;
    const stepDuration = 10000 / speed; // Exactly 10s per step scaled by multiplier

    const interval = setInterval(() => {
      const currentStepIdx = stepRef.current;
      const nextStepIdx = currentStepIdx + 1;

      if (nextStepIdx >= DEMO_STEPS.length) {
        clearInterval(interval);
        dispatch({ type: 'ADD_EVENT_LOG', payload: 'Demo completed. Resetting simulation.' });
        dispatch({ type: 'RESET_DEMO' });
        return;
      }

      const stepConfig = DEMO_STEPS[nextStepIdx];
      
      // Update step index & caption
      dispatch({
        type: 'SET_DEMO_STATE',
        payload: {
          isDemoActive: true,
          demoStep: stepConfig.step,
          demoCaption: stepConfig.caption,
        },
      });

      // Log step event
      const logMessages = {
        2: 'Step 2/6: Alert! Triveni Sangam congestion spiked to 94%.',
        3: 'Step 3/6: AI Forecast predicts crowd surge 18 mins ahead (425K vs 300K capacity).',
        4: 'Step 4/6: Dijkstra router reweighted. Diverting 42,000 pilgrims to Route C.',
        5: 'Step 5/6: Parking P4 at 92%. Rebalancing: 1,240 vehicles redirected to P6.',
        6: 'Step 6/6: Push commuter guidance to touch-kiosks in English and Hindi.',
        7: 'Demo Complete: Traffic stabilized. Congestion dropped to 61%.'
      };
      if (logMessages[stepConfig.step]) {
        dispatch({ type: 'ADD_EVENT_LOG', payload: logMessages[stepConfig.step] });
      }

      // Update simulation time
      dispatch({ type: 'SET_SIMULATION_TIME', payload: stepConfig.time });

      // Update active module/tab
      dispatch({ type: 'SET_MODULE', payload: stepConfig.tab });

      // Run specific step actions
      const { stateUpdate } = stepConfig;

      // Update metrics
      if (stateUpdate.metrics) {
        dispatch({ type: 'UPDATE_METRICS', payload: stateUpdate.metrics });
      }

      // Step 2: Inject critical alert & spike Sangam congestion
      if (stepConfig.step === 2) {
        const updatedCrowds = crowds.map(c => {
          if (c.id === 'triveni-sangam') {
            return { ...c, currentCrowd: Math.round(c.capacity * 0.94), density: 'high', trend: 'rising' };
          }
          return c;
        });
        dispatch({ type: 'UPDATE_CROWDS', payload: updatedCrowds });
        dispatch({ type: 'ADD_ALERT', payload: stateUpdate.alert });
      }

      // Step 3: Surge Forecast Tab Spikes
      if (stepConfig.step === 3) {
        const updatedCrowds = crowds.map(c => {
          if (c.id === 'triveni-sangam') {
            return { ...c, currentCrowd: Math.round(c.capacity * 0.94), density: 'high', trend: 'rising' };
          }
          return c;
        });
        dispatch({ type: 'UPDATE_CROWDS', payload: updatedCrowds });
      }

      // Step 4: Route Intelligence tab Dijkstra rerouting
      if (stepConfig.step === 4) {
        const updatedRoads = roads.map(road => {
          if (road.id === 'road-13' || road.id === 'road-3') {
            return { ...road, congestion: 4.5 };
          }
          return road;
        });
        dispatch({ type: 'UPDATE_ROADS', payload: updatedRoads });
      }

      // Step 5: Parking tab allocation rebalance
      if (stepConfig.step === 5) {
        const updatedParking = parking.map(p => {
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
            aiSuggestion: `Diverting incoming vehicles to P6 (+4 min walk). P6 occupancy currently 50%.`,
            acknowledged: false
          }
        });
      }

      // Step 7: Stabilize and recover
      if (stepConfig.step === 7) {
        const restoredRoads = roads.map(road => ({ ...road, congestion: 1.0 }));
        dispatch({ type: 'UPDATE_ROADS', payload: restoredRoads });

        const updatedCrowds = crowds.map(c => {
          if (c.id === 'triveni-sangam') {
            return { ...c, currentCrowd: Math.round(c.capacity * 0.61), density: 'medium', trend: 'falling' };
          }
          return c;
        });
        dispatch({ type: 'UPDATE_CROWDS', payload: updatedCrowds });

        dispatch({ type: 'CLEAR_REBALANCE' });

        dispatch({
          type: 'ADD_ALERT',
          payload: {
            id: `demo-resolve-${Date.now()}`,
            type: 'info',
            severity: 'info',
            title: 'RESOLVED: Congestion cleared at Triveni Sangam',
            location: 'Triveni Sangam',
            timestamp: '07:54 AM',
            aiSuggestion: ' pilgrim routing and parking reallocations returned to steady states.',
            acknowledged: true
          }
        });
      }

    }, stepDuration);

    return () => clearInterval(interval);
  }, [isDemoActive, crowds, parking, roads, simSpeedMultiplier, dispatch]);
}
