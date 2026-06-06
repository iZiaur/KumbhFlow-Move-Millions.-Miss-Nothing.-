// Simulated analytics data for Module 4 — Crowd Surge Forecast Engine

// Historical actual pilgrim crowd trends for comparative charts (2013 vs 2019)
export const historicalKumbhData = {
  // Peak day comparison curves (normalized hourly data in thousands)
  '2013': [
    { hour: '00:00', crowd: 4000 },
    { hour: '02:00', crowd: 6200 },
    { hour: '04:00', crowd: 8500 },
    { hour: '06:00', crowd: 11000 },
    { hour: '08:00', crowd: 9500 },
    { hour: '10:00', crowd: 7500 },
    { hour: '12:00', crowd: 6000 },
    { hour: '14:00', crowd: 5200 },
    { hour: '16:00', crowd: 4500 },
    { hour: '18:00', crowd: 5800 },
    { hour: '20:00', crowd: 5000 },
    { hour: '22:00', crowd: 3800 },
  ],
  '2019': [
    { hour: '00:00', crowd: 5500 },
    { hour: '02:00', crowd: 8000 },
    { hour: '04:00', crowd: 12000 },
    { hour: '06:00', crowd: 16500 },
    { hour: '08:00', crowd: 14000 },
    { hour: '10:00', crowd: 11000 },
    { hour: '12:00', crowd: 8800 },
    { hour: '14:00', crowd: 7500 },
    { hour: '16:00', crowd: 6800 },
    { hour: '18:00', crowd: 9200 },
    { hour: '20:00', crowd: 7800 },
    { hour: '22:00', crowd: 6000 },
  ],
};

// Resource coordinates and metadata for map overlays
export const resourceTemplates = {
  buses: [
    { id: 'b1', name: 'Jhunsi Depot (East)', lat: 25.4410, lng: 81.9020, label: 'Bus Depot A', baseCapacity: 40, active: 40 },
    { id: 'b2', name: 'Arail Crossing (South)', lat: 25.4120, lng: 81.8890, label: 'Bus Depot B', baseCapacity: 25, active: 25 },
    { id: 'b3', name: 'Naini Station Depot (West)', lat: 25.3950, lng: 81.8620, label: 'Bus Depot C', baseCapacity: 30, active: 30 },
    { id: 'b4', name: 'Civil Lines Depot (North)', lat: 25.4520, lng: 81.8390, label: 'Bus Depot D', baseCapacity: 50, active: 50 },
  ],
  medical: [
    { id: 'm1', name: 'Sangam West First-Aid Base', lat: 25.4280, lng: 81.8820, label: 'Medical Camp 1', baseCapacity: 8, active: 8 },
    { id: 'm2', name: 'Sector 3 Medical Center', lat: 25.4330, lng: 81.8700, label: 'Medical Camp 2', baseCapacity: 5, active: 5 },
    { id: 'm3', name: 'Sector 8 Emergency Outpost', lat: 25.4240, lng: 81.8610, label: 'Medical Camp 3', baseCapacity: 4, active: 4 },
    { id: 'm4', name: 'Sector 12 Hospital Complex', lat: 25.4180, lng: 81.8950, label: 'Medical Camp 4', baseCapacity: 12, active: 12 },
  ],
  barriers: [
    { id: 'k1', name: 'Shastri Bridge Pilgrim Buffer', lat: 25.4490, lng: 81.8850, label: 'Barricade Sector 1', baseCapacity: 15, active: 15 },
    { id: 'k2', name: 'Sector 7 Pedestrian Flow Control', lat: 25.4320, lng: 81.8750, label: 'Barricade Sector 2', baseCapacity: 20, active: 20 },
    { id: 'k3', name: 'Sector 14 West Entry Barrier', lat: 25.4200, lng: 81.8550, label: 'Barricade Sector 3', baseCapacity: 10, active: 10 },
    { id: 'k4', name: 'Naini Bridge Approach Checkpoint', lat: 25.4090, lng: 81.8700, label: 'Barricade Sector 4', baseCapacity: 18, active: 18 },
  ],
};

// Simulated AI Surge Prediction response logic
export function simulateSurgeResponse(eventId, pilgrimCount, weather, congestionIndex) {
  // Base config variables
  let baseSurgeLevel = 5;
  let peakArrival = '08:00 AM – 11:00 AM';
  let eventName = 'Normal Pilgrimage Day';
  let riskRanking = ['Triveni Sangam', 'Dashashwamedh Ghat', 'Ram Ghat', 'Arail Ghat', 'Saraswati Ghat'];

  // Adjust base levels by specific calendar events
  switch (eventId) {
    case 'makar-sankranti':
      baseSurgeLevel = 9;
      peakArrival = '04:30 AM – 08:30 AM';
      eventName = 'Makar Sankranti (Shahi Snan)';
      riskRanking = ['Triveni Sangam', 'Arail Ghat', 'Dashashwamedh Ghat', 'Ram Ghat', 'Saraswati Ghat'];
      break;
    case 'mauni-amavasya':
      baseSurgeLevel = 10;
      peakArrival = '03:00 AM – 08:00 AM';
      eventName = 'Mauni Amavasya (Shahi Snan)';
      riskRanking = ['Triveni Sangam', 'Ram Ghat', 'Dashashwamedh Ghat', 'Arail Ghat', 'Saraswati Ghat'];
      break;
    case 'paush-purnima':
      baseSurgeLevel = 7.5;
      peakArrival = '05:00 AM – 09:30 AM';
      eventName = 'Paush Purnima (Shahi Snan)';
      riskRanking = ['Triveni Sangam', 'Dashashwamedh Ghat', 'Saraswati Ghat', 'Ram Ghat', 'Arail Ghat'];
      break;
    case 'basant-panchami':
      baseSurgeLevel = 8;
      peakArrival = '05:30 AM – 09:00 AM';
      eventName = 'Basant Panchami (Shahi Snan)';
      riskRanking = ['Dashashwamedh Ghat', 'Triveni Sangam', 'Ram Ghat', 'Saraswati Ghat', 'Arail Ghat'];
      break;
    case 'maghi-purnima':
      baseSurgeLevel = 7;
      peakArrival = '06:00 AM – 10:00 AM';
      eventName = 'Maghi Purnima';
      riskRanking = ['Ram Ghat', 'Triveni Sangam', 'Dashashwamedh Ghat', 'Saraswati Ghat', 'Arail Ghat'];
      break;
    case 'maha-shivaratri':
      baseSurgeLevel = 8.5;
      peakArrival = '04:00 AM – 08:30 AM';
      eventName = 'Maha Shivaratri (Shahi Snan)';
      riskRanking = ['Triveni Sangam', 'Dashashwamedh Ghat', 'Arail Ghat', 'Ram Ghat', 'Saraswati Ghat'];
      break;
    default:
      baseSurgeLevel = 4.5;
      peakArrival = '08:00 AM – 11:30 AM';
      eventName = 'Normal Pilgrimage Day';
      break;
  }

  // Adjust for pilgrim count inputs (slider scale 500k to 5M)
  const pilgrimRatio = pilgrimCount / 2000000; // 2 million is baseline
  baseSurgeLevel += (pilgrimRatio - 1) * 2;

  // Adjust for weather (slippery ghats during rain, visual delays during fog)
  if (weather === 'rain') {
    baseSurgeLevel += 0.8;
    peakArrival = 'Delayed by 1–2 hours (slippery corridors)';
  } else if (weather === 'fog') {
    baseSurgeLevel += 0.5;
    peakArrival = 'Extended window (slower incoming transit speeds)';
  }

  // Adjust for road congestion
  baseSurgeLevel += (congestionIndex - 5) * 0.25;

  // Cap surge level between 1.0 and 10.0
  const finalSurgeLevel = Math.max(1.0, Math.min(10.0, Math.round(baseSurgeLevel * 10) / 10));

  // Determine dynamic resource preposition quantities based on surge index
  const busMultiplier = Math.ceil(finalSurgeLevel * 5);
  const medicalMultiplier = Math.ceil(finalSurgeLevel * 1.5);
  const barrierMultiplier = Math.ceil(finalSurgeLevel * 3.5);

  return {
    surgeLevel: finalSurgeLevel,
    peakArrival,
    eventName,
    highestRiskGhats: riskRanking,
    weatherAlert: weather !== 'clear',
    prepositionPlan: {
      buses: {
        total: 100 + busMultiplier * 4,
        allocations: [
          { depotId: 'b1', qty: 35 + busMultiplier, task: 'Shuttle pilgrims from Jhunsi to Sector 4' },
          { depotId: 'b2', qty: 20 + Math.floor(busMultiplier * 0.8), task: 'Support southern sector shuttle routes' },
          { depotId: 'b3', qty: 15 + Math.floor(busMultiplier * 0.7), task: 'Ferry arrivals from Naini junction' },
          { depotId: 'b4', qty: 30 + Math.floor(busMultiplier * 1.5), task: 'Ferry arrivals from Civil Lines & Jn' },
        ]
      },
      medical: {
        total: 20 + medicalMultiplier * 4,
        allocations: [
          { campId: 'm1', qty: 6 + medicalMultiplier, task: 'Deploy standby cardiac ambulances to Sangam entry' },
          { campId: 'm2', qty: 4 + Math.floor(medicalMultiplier * 0.7), task: 'Establish hydration stations' },
          { campId: 'm3', qty: 3 + Math.floor(medicalMultiplier * 0.6), task: 'Setup primary triage clinic' },
          { campId: 'm4', qty: 7 + Math.floor(medicalMultiplier * 1.2), task: 'Secure extra emergency ward beds' },
        ]
      },
      barriers: {
        total: 50 + barrierMultiplier * 4,
        allocations: [
          { barrierId: 'k1', qty: 12 + barrierMultiplier, task: 'Establish double-channel queuing queue buffers' },
          { barrierId: 'k2', qty: 16 + Math.floor(barrierMultiplier * 1.3), task: 'Manage pedestrian flow directional gates' },
          { barrierId: 'k3', qty: 8 + Math.floor(barrierMultiplier * 0.6), task: 'Construct holding pens at West gate' },
          { barrierId: 'k4', qty: 14 + Math.floor(barrierMultiplier * 1.1), task: 'Control approach access at Naini bypass' },
        ]
      }
    },
    checklist: [
      { id: 'chk-buses', text: `Pre-position ${40 + busMultiplier} additional buses at Jhunsi/Civil Lines staging areas`, targetId: 'b1', type: 'bus', increment: busMultiplier },
      { id: 'chk-barriers', text: `Erect double-channel barricades at Sector 7 pedestrian bridge corridor`, targetId: 'k2', type: 'barrier', increment: Math.floor(barrierMultiplier * 1.3) },
      { id: 'chk-medical', text: `Dispatch ${3 + medicalMultiplier} mobile medical clinics to Sangam West triage node`, targetId: 'm1', type: 'medical', increment: medicalMultiplier },
      { id: 'chk-volunteers', text: `Mobilize 200 crowd control volunteers to Shastri Bridge checkpoint`, targetId: 'k1', type: 'barrier', increment: Math.floor(barrierMultiplier * 0.8) },
      { id: 'chk-announcements', text: 'Activate multilingual loop announcements (Hindi/English/Bengali) on PA systems', targetId: 'global', type: 'info', increment: 0 },
      { id: 'chk-triage', text: 'Set up temporary triage and recovery beds at Arail Sector 12 hospital', targetId: 'm4', type: 'medical', increment: Math.floor(medicalMultiplier * 1.2) },
    ]
  };
}

// Generate forecast chart points based on user inputs
export function generateForecastChartData(eventId, pilgrimCount, weather, congestionIndex) {
  const chartData = [];
  const startHour = 0; // Starts from midnight
  const baseMulti = pilgrimCount / 2000000;
  
  // Base patterns based on event
  let peakHour = 6; // Morning Snan peak
  let peakMulti = 2.5;
  let eveningPeakHour = 18;
  let eveningPeakMulti = 1.8;

  if (eventId === 'mauni-amavasya') {
    peakHour = 5;
    peakMulti = 4.0;
  } else if (eventId === 'makar-sankranti' || eventId === 'maha-shivaratri') {
    peakHour = 5.5;
    peakMulti = 3.2;
  } else if (eventId === 'basant-panchami') {
    peakHour = 6.5;
    peakMulti = 2.8;
  }

  // Weather slows arrival down and broadens the peak
  if (weather === 'rain') {
    peakHour += 1.5;
    peakMulti *= 0.85;
  }

  for (let i = 0; i <= 12; i++) {
    const hourVal = startHour + i * 2;
    const timeStr = `${hourVal.toString().padStart(2, '0')}:00`;
    
    // Bell curve calculation for morning peak
    const distFromMorningPeak = Math.abs(hourVal - peakHour);
    const morningFactor = Math.exp(-Math.pow(distFromMorningPeak / 3, 2)) * peakMulti;
    
    // Bell curve for evening peak
    const distFromEveningPeak = Math.abs(hourVal - eveningPeakHour);
    const eveningFactor = Math.exp(-Math.pow(distFromEveningPeak / 3.5, 2)) * eveningPeakMulti;
    
    // Baseline crowd
    const baseCrowd = 120 + Math.sin((hourVal / 24) * Math.PI * 2) * 40;
    
    // Combine factors
    const predictionK = Math.round((baseCrowd + (morningFactor + eveningFactor) * 200) * baseMulti);
    const confidenceRange = 10 + Math.round(predictionK * 0.12 * (1 + congestionIndex / 10));
    
    chartData.push({
      hour: timeStr,
      predicted: predictionK,
      upper: predictionK + confidenceRange,
      lower: Math.max(20, predictionK - confidenceRange),
      isSnanEvent: Math.abs(hourVal - peakHour) < 1.0,
    });
  }

  return chartData;
}
