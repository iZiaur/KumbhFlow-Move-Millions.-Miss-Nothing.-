import { createContext, useContext, useReducer } from 'react';
import {
  generateCrowdData,
  generateParkingData,
  generateMetrics,
  generateInitialAlerts,
  generateArrivals,
  generateSurgePrediction,
} from '../data/mockData';

const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

const initialState = {
  crowds: generateCrowdData(),
  parking: generateParkingData(),
  metrics: generateMetrics(),
  alerts: generateInitialAlerts(8),
  arrivals: generateArrivals(),
  surgePrediction: generateSurgePrediction(),
  activeModule: 'command-center',
  selectedGhat: null,
  mapCenter: [25.4310, 81.8850],
  mapZoom: 13,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_CROWDS':
      return { ...state, crowds: action.payload };
    case 'UPDATE_PARKING':
      return { ...state, parking: action.payload };
    case 'UPDATE_METRICS':
      return { ...state, metrics: action.payload };
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts].slice(0, 50),
      };
    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.payload ? { ...a, acknowledged: true } : a
        ),
      };
    case 'UPDATE_ARRIVALS':
      return { ...state, arrivals: action.payload };
    case 'UPDATE_SURGE':
      return { ...state, surgePrediction: action.payload };
    case 'SET_MODULE':
      return { ...state, activeModule: action.payload };
    case 'SELECT_GHAT':
      return { ...state, selectedGhat: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) throw new Error('useAppDispatch must be used within AppProvider');
  return context;
}
