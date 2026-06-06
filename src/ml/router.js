/**
 * Dijkstra's shortest path algorithm:
 * 1. Represents the road network as a graph of nodes (ghats/parking) and edges (roads).
 * 2. Traverses the graph to find the minimum weight path using edge weight = base_time * (1 + congestion).
 * 3. Generates 3 distinct alternative routes using a penalty-based routing approach (Yen's method).
 */
export function dijkstra(nodes, edges, startNode, endNode, penaltyEdges = [], penaltyWeight = 50) {
  // Build adjacency list
  const graph = {};
  nodes.forEach(n => {
    graph[n.id] = [];
  });

  edges.forEach(edge => {
    let weight = edge.baseTime * (1 + (edge.congestion || 0));
    // Apply penalty if this edge is penalized (for generating alternative routes)
    if (penaltyEdges.includes(edge.id)) {
      weight += penaltyWeight;
    }

    graph[edge.from] = graph[edge.from] || [];
    graph[edge.from].push({ to: edge.to, weight, edgeId: edge.id, path: edge.path, name: edge.name });

    // Assuming undirected roads for connectivity
    graph[edge.to] = graph[edge.to] || [];
    graph[edge.to].push({ to: edge.from, weight, edgeId: edge.id, path: [...edge.path].reverse(), name: edge.name });
  });

  const distances = {};
  const previous = {};
  const edgeUsed = {};
  const queue = new Set();

  nodes.forEach(n => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
    queue.add(n.id);
  });
  distances[startNode] = 0;

  while (queue.size > 0) {
    // Find min distance node
    let minNode = null;
    let minDist = Infinity;
    queue.forEach(nodeId => {
      if (distances[nodeId] < minDist) {
        minDist = distances[nodeId];
        minNode = nodeId;
      }
    });

    if (minNode === null || minNode === endNode) {
      break;
    }

    queue.delete(minNode);

    const neighbors = graph[minNode] || [];
    neighbors.forEach(neighbor => {
      if (!queue.has(neighbor.to)) return;

      const alt = distances[minNode] + neighbor.weight;
      if (alt < distances[neighbor.to]) {
        distances[neighbor.to] = alt;
        previous[neighbor.to] = minNode;
        edgeUsed[neighbor.to] = neighbor;
      }
    });
  }

  if (distances[endNode] === Infinity) {
    return null; // No path found
  }

  // Reconstruct path
  const pathNodes = [];
  const pathEdges = [];
  let current = endNode;
  while (current !== null) {
    pathNodes.unshift(current);
    const prev = previous[current];
    if (prev !== null) {
      pathEdges.unshift(edgeUsed[current]);
    }
    current = prev;
  }

  // Combine polyline paths of segments
  let fullPath = [];
  pathEdges.forEach((edge, idx) => {
    if (idx === 0) {
      fullPath = fullPath.concat(edge.path);
    } else {
      fullPath = fullPath.concat(edge.path.slice(1));
    }
  });

  return {
    nodes: pathNodes,
    edges: pathEdges,
    totalTime: distances[endNode],
    path: fullPath
  };
}

// Generates 3 alternate routes (Green, Amber, Red) using Dijkstra and penalties
export function getAlternateRoutes(nodes, edges, startNode, endNode) {
  const primary = dijkstra(nodes, edges, startNode, endNode);
  if (!primary) return [];

  // Alternative 1: Penalize primary edges
  const primaryEdgeIds = primary.edges.map(e => e.edgeId);
  const alt1 = dijkstra(nodes, edges, startNode, endNode, primaryEdgeIds, 15);

  // Alternative 2: Penalize both primary and alt1 edges
  const penalizedAlt2 = [...primaryEdgeIds];
  if (alt1) {
    alt1.edges.forEach(e => {
      if (!penalizedAlt2.includes(e.edgeId)) {
        penalizedAlt2.push(e.edgeId);
      }
    });
  }
  const alt2 = dijkstra(nodes, edges, startNode, endNode, penalizedAlt2, 30);

  const routes = [];
  
  if (primary) {
    const dist = parseFloat((primary.path.length * 0.4).toFixed(1));
    const pils = 42000;
    const veh = pils / 4;
    routes.push({
      id: 'primary',
      name: 'Primary Route (Optimized)',
      eta: Math.round(primary.totalTime),
      distance: dist.toFixed(1), // estimate distance
      congestionScore: Math.min(10, Math.max(1, (primary.totalTime / 10) * 3)),
      path: primary.path,
      highlight: 'Recommended by AI',
      color: '#00E676', // Green
      co2: Math.round(veh * dist * 0.12 * 10) / 10,
      pilgrims: pils
    });
  }

  if (alt1 && alt1.path.length > 0) {
    const dist = parseFloat((alt1.path.length * 0.45).toFixed(1));
    const pils = 12000;
    const veh = pils / 4;
    routes.push({
      id: 'alt1',
      name: 'Alternative Route A (Bypass)',
      eta: Math.round(alt1.totalTime),
      distance: dist.toFixed(1),
      congestionScore: Math.min(10, Math.max(1, (alt1.totalTime / 10) * 4.5)),
      path: alt1.path,
      highlight: 'Slightly longer',
      color: '#FFB300', // Amber
      co2: Math.round(veh * dist * 0.12 * 10) / 10,
      pilgrims: pils
    });
  }

  if (alt2 && alt2.path.length > 0) {
    const dist = parseFloat((alt2.path.length * 0.5).toFixed(1));
    const pils = 8000;
    const veh = pils / 4;
    routes.push({
      id: 'alt2',
      name: 'Alternative Route B (Scenic)',
      eta: Math.round(alt2.totalTime),
      distance: dist.toFixed(1),
      congestionScore: Math.min(10, Math.max(1, (alt2.totalTime / 10) * 6)),
      path: alt2.path,
      highlight: 'Heavier traffic',
      color: '#FF1744', // Red
      co2: Math.round(veh * dist * 0.12 * 10) / 10,
      pilgrims: pils
    });
  }

  return routes;
}
