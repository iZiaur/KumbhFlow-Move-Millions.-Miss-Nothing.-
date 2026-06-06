/**
 * Greedy + Hungarian-style parking allocation algorithm:
 * 1. Monitors lot capacities and flags lots that cross a 90% occupancy threshold.
 * 2. Uses a greedy cost-minimization function (resembling a linear assignment solver)
 *    to find the nearest under-utilized lot (<75%) based on coordinate distance.
 * 3. Weights the re-assignment cost by walking distance from that lot to the pilgrim's target ghat.
 */
export function rebalanceParking(parkingLots, targetGhatCoords, triggerLotId) {
  const triggerLot = parkingLots.find(p => p.id === triggerLotId);
  if (!triggerLot || (triggerLot.occupied / triggerLot.totalSlots) < 0.9) {
    return null; // No rebalancing needed if trigger lot is under 90%
  }

  // Find under-utilized lots (< 75% occupied)
  const candidateLots = parkingLots.filter(p => p.id !== triggerLotId && (p.occupied / p.totalSlots) < 0.75);
  if (candidateLots.length === 0) {
    return null; // No candidates available to absorb overflow
  }

  // Score candidate lots by Euclidean distance to the trigger lot and distance to target ghat
  let bestLot = null;
  let minCost = Infinity;

  candidateLots.forEach(lot => {
    const distToTrigger = Math.sqrt(Math.pow(lot.lat - triggerLot.lat, 2) + Math.pow(lot.lng - triggerLot.lng, 2)) * 111;
    const distToGhat = Math.sqrt(Math.pow(lot.lat - targetGhatCoords[0], 2) + Math.pow(lot.lng - targetGhatCoords[1], 2)) * 111;
    
    // Joint cost function: prioritize closest parking lot to original choice, but keep walking distance minimal
    const cost = distToTrigger * 0.4 + distToGhat * 0.6;

    if (cost < minCost) {
      minCost = cost;
      bestLot = lot;
    }
  });

  if (!bestLot) return null;

  const divertedVehicles = Math.round(triggerLot.occupied * 0.15); // Redirect 15% of trigger lot capacity
  const extraWalkMin = Math.round((minCost * 12)); // 12 min walk per km

  return {
    source: triggerLot.id,
    target: bestLot.id,
    sourceName: triggerLot.name,
    targetName: bestLot.name,
    vehicles: divertedVehicles,
    extraWalk: extraWalkMin,
    message: `${triggerLot.id} → ${bestLot.id} reroute, ${divertedVehicles.toLocaleString()} vehicles, +${extraWalkMin} min walk.`,
  };
}
