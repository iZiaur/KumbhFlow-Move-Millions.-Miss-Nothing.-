// Re-export structured Prayagraj locations from our synthetic data layer
import { GHATS, PARKING, ROADS } from './kumbhData';

export const ghatLocations = GHATS;
export const parkingZones = PARKING;
export const majorRoads = ROADS;

// Bus/train routes for vehicle blip simulation
export const transportRoutes = [
  {
    id: 'bus-1',
    name: 'Route 1: Station → Sangam',
    type: 'bus',
    path: [
      [25.4580, 81.8300],
      [25.4500, 81.8450],
      [25.4420, 81.8600],
      [25.4350, 81.8750],
      [25.4270, 81.8855],
    ],
    frequency: '10 min',
  },
  {
    id: 'bus-2',
    name: 'Route 2: Civil Lines → Arail',
    type: 'bus',
    path: [
      [25.4550, 81.8450],
      [25.4450, 81.8550],
      [25.4350, 81.8700],
      [25.4250, 81.8850],
      [25.4190, 81.8920],
    ],
    frequency: '15 min',
  },
  {
    id: 'train-1',
    name: 'Prayagraj Jn → Naini',
    type: 'train',
    path: [
      [25.4358, 81.8463],
      [25.4250, 81.8550],
      [25.4180, 81.8650],
      [25.4150, 81.8700],
    ],
    frequency: '30 min',
  },
];
