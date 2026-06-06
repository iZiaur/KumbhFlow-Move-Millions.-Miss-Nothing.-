import { useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { GHATS, PARKING, ROADS } from '../data/kumbhData';
import { rebalanceParking } from '../ml/parking';

// Helper to add minutes to a HH:MM time string
function addMinutesToTime(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = (h * 60 + m + mins) % (24 * 60);
  const nextH = Math.floor(totalMins / 60);
  const nextM = totalMins % 60;
  return `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
}

export function useLiveTick() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const intervalRef = useRef(null);

  // Keep a ref to the latest state so the interval doesn't re-create
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    // 2-second live tick
    intervalRef.current = setInterval(() => {
      const currentState = stateRef.current;
      
      // If demo mode is active, let the demo controller handle the ticks
      if (currentState.isDemoActive) {
        return;
      }

      // 1. Advance virtual simulation time by 1 minute
      const nextTime = addMinutesToTime(currentState.simulationTime, 1);
      dispatch({ type: 'SET_SIMULATION_TIME', payload: nextTime });

      // 2. Update crowd values using sinusoidal footfall baseline + small random adjustments
      const currentHour = parseInt(nextTime.split(':')[0]);
      const newCrowds = currentState.crowds.map((ghat) => {
        const ghatCap = ghat.capacity;
        
        // Calculate daily sinusoidal pattern (peak between 5:00-9:00 AM)
        const rad = (currentHour / 24) * Math.PI * 2;
        const morningFactor = Math.exp(-Math.pow((currentHour - 7) / 2.5, 2)) * 0.45;
        const eveningFactor = Math.exp(-Math.pow((currentHour - 18) / 3, 2)) * 0.25;
        const baseFactor = 0.15 + Math.sin(rad - Math.PI / 2) * 0.05;
        
        const targetRatio = Math.max(0.1, Math.min(0.95, baseFactor + morningFactor + eveningFactor));
        // Add random walk jitter (+/-2% capacity)
        const jitter = (Math.random() - 0.5) * 0.04 * ghatCap;
        const newCrowd = Math.max(
          Math.floor(ghatCap * 0.05),
          Math.min(ghatCap, Math.floor(ghatCap * targetRatio + jitter))
        );

        const ratio = newCrowd / ghatCap;
        return {
          ...ghat,
          currentCrowd: newCrowd,
          trend: newCrowd > ghat.currentCrowd ? 'rising' : 'falling',
          density: ratio > 0.75 ? 'high' : ratio > 0.4 ? 'medium' : 'low',
        };
      });
      dispatch({ type: 'UPDATE_CROWDS', payload: newCrowds });

      // 3. Update parking slot counts (+/- 1% occupancy shift)
      const newParking = currentState.parking.map((zone) => {
        const cap = zone.totalSlots;
        const jitter = Math.round((Math.random() - 0.5) * 0.02 * cap);
        const newOccupied = Math.max(
          Math.floor(cap * 0.1),
          Math.min(cap, zone.occupied + jitter)
        );
        const fillPercent = Math.round((newOccupied / cap) * 100);

        return {
          ...zone,
          occupied: newOccupied,
          available: cap - newOccupied,
          fillPercent,
          status: fillPercent > 90 ? 'full' : fillPercent > 70 ? 'filling' : 'available',
        };
      });

      // Greedy/Hungarian Parking Rebalancing solver (if P4 or any lot crosses 90%)
      const overflowLot = newParking.find(p => p.fillPercent >= 90);
      if (overflowLot && currentState.autoRebalanceActive) {
        const targetGhat = GHATS[0]; // Triveni Sangam
        const rebalanceResult = rebalanceParking(newParking, [targetGhat.lat, targetGhat.lng], overflowLot.id);
        if (rebalanceResult) {
          // Trigger a rebalancing action by moving 15% vehicles to target lot
          const sourceIdx = newParking.findIndex(p => p.id === rebalanceResult.source);
          const targetIdx = newParking.findIndex(p => p.id === rebalanceResult.target);
          if (sourceIdx !== -1 && targetIdx !== -1) {
            newParking[sourceIdx].occupied -= rebalanceResult.vehicles;
            newParking[sourceIdx].available += rebalanceResult.vehicles;
            newParking[sourceIdx].fillPercent = Math.round((newParking[sourceIdx].occupied / newParking[sourceIdx].totalSlots) * 100);
            
            newParking[targetIdx].occupied += rebalanceResult.vehicles;
            newParking[targetIdx].available -= rebalanceResult.vehicles;
            newParking[targetIdx].fillPercent = Math.round((newParking[targetIdx].occupied / newParking[targetIdx].totalSlots) * 100);
            
            dispatch({
              type: 'TRIGGER_REBALANCE',
              payload: {
                source: rebalanceResult.source,
                target: rebalanceResult.target,
                vehicles: rebalanceResult.vehicles,
                extraWalk: 4
              }
            });
            dispatch({
              type: 'ADD_EVENT_LOG',
              payload: `AI Rebalance: Redirected ${rebalanceResult.vehicles.toLocaleString()} vehicles from ${rebalanceResult.source} to ${rebalanceResult.target} (+4m walk).`
            });
          }
        }
      }
      dispatch({ type: 'UPDATE_PARKING', payload: newParking });

      // 4. Update Metrics Bar counts
      const totalPilgrimsVal = newCrowds.reduce((sum, g) => sum + g.currentCrowd, 0);
      const totalParkingVal = newParking.reduce((sum, z) => sum + z.available, 0);
      const avgGhatCongestion = newCrowds.reduce((sum, g) => sum + (g.currentCrowd / g.capacity), 0) / newCrowds.length;
      const computedCongestionIndex = Math.min(10.0, Math.max(1.0, Math.round(avgGhatCongestion * 10 * 10) / 10));

      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          totalPilgrims: totalPilgrimsVal,
          activeVehicles: Math.round(totalPilgrimsVal * 0.012), // proportional proxy
          availableParking: totalParkingVal,
          congestionIndex: computedCongestionIndex,
          activeAlerts: currentState.alerts.filter((a) => !a.acknowledged).length,
        },
      });
    }, 2000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
