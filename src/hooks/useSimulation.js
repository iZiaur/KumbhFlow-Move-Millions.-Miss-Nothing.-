import { useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import {
  generateAlert,
  generateArrivals,
  generateSurgePrediction,
  nudgeValue,
  nudgeInt,
} from '../data/mockData';

export function useSimulation() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const intervalRef = useRef(null);
  const alertIntervalRef = useRef(null);

  useEffect(() => {
    // Main simulation tick — every 3 seconds
    intervalRef.current = setInterval(() => {
      // Update crowd counts with random walk
      const newCrowds = state.crowds.map((ghat) => {
        const newCrowd = nudgeInt(
          ghat.currentCrowd,
          Math.floor(ghat.capacity * 0.1),
          Math.floor(ghat.capacity * 0.95),
          Math.floor(ghat.capacity * 0.03)
        );
        const ratio = newCrowd / ghat.capacity;
        return {
          ...ghat,
          currentCrowd: newCrowd,
          trend: newCrowd > ghat.currentCrowd ? 'rising' : 'falling',
          density: ratio > 0.7 ? 'high' : ratio > 0.4 ? 'medium' : 'low',
        };
      });
      dispatch({ type: 'UPDATE_CROWDS', payload: newCrowds });

      // Update parking
      const newParking = state.parking.map((zone) => {
        const newOccupied = nudgeInt(
          zone.occupied,
          Math.floor(zone.totalSlots * 0.1),
          zone.totalSlots,
          Math.floor(zone.totalSlots * 0.02)
        );
        const fillPercent = Math.round((newOccupied / zone.totalSlots) * 100);
        return {
          ...zone,
          occupied: newOccupied,
          available: zone.totalSlots - newOccupied,
          fillPercent,
          status: fillPercent > 90 ? 'full' : fillPercent > 70 ? 'filling' : 'available',
        };
      });
      dispatch({ type: 'UPDATE_PARKING', payload: newParking });

      // Update metrics
      const totalPilgrims = newCrowds.reduce((sum, g) => sum + g.currentCrowd, 0);
      const totalParking = newParking.reduce((sum, z) => sum + z.available, 0);
      dispatch({
        type: 'UPDATE_METRICS',
        payload: {
          totalPilgrims: nudgeInt(state.metrics.totalPilgrims, 1200000, 3800000, 15000),
          activeVehicles: nudgeInt(state.metrics.activeVehicles, 12000, 45000, 500),
          availableParking: totalParking,
          congestionIndex: Math.round(nudgeValue(state.metrics.congestionIndex, 2.1, 9.4, 0.3) * 10) / 10,
          activeAlerts: state.alerts.filter((a) => !a.acknowledged).length,
        },
      });
    }, 3000);

    // Alert generation — every 8-15 seconds
    alertIntervalRef.current = setInterval(
      () => {
        const newAlert = generateAlert();
        dispatch({ type: 'ADD_ALERT', payload: newAlert });
      },
      8000 + Math.random() * 7000
    );

    // Refresh arrivals every 60 seconds
    const arrivalsInterval = setInterval(() => {
      dispatch({ type: 'UPDATE_ARRIVALS', payload: generateArrivals() });
    }, 60000);

    // Refresh surge prediction every 30 seconds
    const surgeInterval = setInterval(() => {
      dispatch({ type: 'UPDATE_SURGE', payload: generateSurgePrediction() });
    }, 30000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(alertIntervalRef.current);
      clearInterval(arrivalsInterval);
      clearInterval(surgeInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
