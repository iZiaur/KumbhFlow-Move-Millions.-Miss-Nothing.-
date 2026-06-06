// Simulated route data for the AI Route Intelligence Engine
// These represent realistic routes in the Prayagraj/Mahakumbh area

export const destinations = [
  { id: 'triveni-sangam', name: 'Triveni Sangam', nameHi: 'त्रिवेणी संगम', lat: 25.4270, lng: 81.8855, type: 'ghat' },
  { id: 'dashashwamedh', name: 'Dashashwamedh Ghat', nameHi: 'दशाश्वमेध घाट', lat: 25.4340, lng: 81.8870, type: 'ghat' },
  { id: 'arail-ghat', name: 'Arail Ghat', nameHi: 'अरैल घाट', lat: 25.4190, lng: 81.8920, type: 'ghat' },
  { id: 'ram-ghat', name: 'Ram Ghat', nameHi: 'राम घाट', lat: 25.4380, lng: 81.8810, type: 'ghat' },
  { id: 'saraswati-ghat', name: 'Saraswati Ghat', nameHi: 'सरस्वती घाट', lat: 25.4310, lng: 81.8900, type: 'ghat' },
  { id: 'prayagraj-jn', name: 'Prayagraj Junction', nameHi: 'प्रयागराज जंक्शन', lat: 25.4358, lng: 81.8463, type: 'station' },
  { id: 'naini-station', name: 'Naini Station', nameHi: 'नैनी स्टेशन', lat: 25.4050, lng: 81.8650, type: 'station' },
  { id: 'civil-lines', name: 'Civil Lines', nameHi: 'सिविल लाइंस', lat: 25.4550, lng: 81.8450, type: 'area' },
  { id: 'jhunsi', name: 'Jhunsi', nameHi: 'झूंसी', lat: 25.4450, lng: 81.8600, type: 'area' },
  { id: 'parade-ground', name: 'Parade Ground Camp', nameHi: 'परेड ग्राउंड कैंप', lat: 25.4350, lng: 81.8500, type: 'camp' },
];

export const transportModes = [
  { id: 'walk', label: 'Walk', labelHi: 'पैदल', icon: '🚶' },
  { id: 'bus', label: 'Bus', labelHi: 'बस', icon: '🚌' },
  { id: 'train', label: 'Train', labelHi: 'ट्रेन', icon: '🚂' },
  { id: 'auto', label: 'Auto', labelHi: 'ऑटो', icon: '🛺' },
  { id: 'private', label: 'Private Vehicle', labelHi: 'निजी वाहन', icon: '🚗' },
];

// Route path templates between key locations
const routeTemplates = {
  'prayagraj-jn_triveni-sangam': {
    primary: [
      [25.4358, 81.8463], [25.4380, 81.8520], [25.4370, 81.8580],
      [25.4350, 81.8650], [25.4330, 81.8720], [25.4310, 81.8780],
      [25.4290, 81.8830], [25.4270, 81.8855],
    ],
    alt1: [
      [25.4358, 81.8463], [25.4400, 81.8500], [25.4420, 81.8570],
      [25.4400, 81.8650], [25.4370, 81.8730], [25.4340, 81.8800],
      [25.4300, 81.8840], [25.4270, 81.8855],
    ],
    alt2: [
      [25.4358, 81.8463], [25.4330, 81.8500], [25.4300, 81.8550],
      [25.4280, 81.8620], [25.4260, 81.8700], [25.4250, 81.8770],
      [25.4260, 81.8820], [25.4270, 81.8855],
    ],
  },
};

// Generate a realistic route path between any two points
function generateRoutePath(from, to, variation = 0) {
  const points = [];
  const steps = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from.lat + (to.lat - from.lat) * t + (Math.random() - 0.5) * 0.004 * variation;
    const lng = from.lng + (to.lng - from.lng) * t + (Math.random() - 0.5) * 0.004 * variation;
    points.push([lat, lng]);
  }
  points[0] = [from.lat, from.lng];
  points[points.length - 1] = [to.lat, to.lng];
  return points;
}

// Calculate distance from path
function calcDistance(path) {
  let dist = 0;
  for (let i = 1; i < path.length; i++) {
    const dlat = path[i][0] - path[i - 1][0];
    const dlng = path[i][1] - path[i - 1][1];
    dist += Math.sqrt(dlat * dlat + dlng * dlng) * 111;
  }
  return Math.round(dist * 10) / 10;
}

// Simulate an AI route response
export function simulateRouteResponse(origin, destination, mode, pilgrimCount, accessibility) {
  const originObj = destinations.find(d => d.id === origin) || destinations[5];
  const destObj = destinations.find(d => d.id === destination) || destinations[0];

  const primaryPath = generateRoutePath(originObj, destObj, 0);
  const alt1Path = generateRoutePath(originObj, destObj, 1);
  const alt2Path = generateRoutePath(originObj, destObj, 2);

  const primaryDist = calcDistance(primaryPath);
  const congestionScore = Math.round((3 + Math.random() * 6) * 10) / 10;

  const modeSpeed = { walk: 4, bus: 18, train: 35, auto: 15, private: 12 };
  const speed = modeSpeed[mode] || 12;
  const etaMinutes = Math.round((primaryDist / speed) * 60);

  const routeSteps = generateRouteSteps(originObj, destObj, mode, primaryPath);

  return {
    primary_route: {
      steps: routeSteps,
      eta: `${etaMinutes} min`,
      etaMinutes,
      distance: `${primaryDist} km`,
      congestion_score: congestionScore,
      path: primaryPath,
      mode,
    },
    alternative_routes: [
      {
        name: 'Via NH-30 (Less Crowded)',
        nameHi: 'NH-30 से (कम भीड़)',
        eta: `${etaMinutes + Math.floor(Math.random() * 15) + 5} min`,
        distance: `${(primaryDist + Math.random() * 2).toFixed(1)} km`,
        congestion_score: Math.round((congestionScore - 1 - Math.random() * 2) * 10) / 10,
        path: alt1Path,
        highlight: 'Less crowded',
      },
      {
        name: 'Via Bypass Road (Fastest)',
        nameHi: 'बायपास रोड से (सबसे तेज़)',
        eta: `${etaMinutes - Math.floor(Math.random() * 8)} min`,
        distance: `${(primaryDist + Math.random() * 3).toFixed(1)} km`,
        congestion_score: Math.round((congestionScore + Math.random() * 1.5) * 10) / 10,
        path: alt2Path,
        highlight: 'Fastest route',
      },
    ],
    warnings: generateWarnings(destObj, congestionScore),
    pro_tips: generateProTips(destObj, mode, congestionScore),
    accessibility_notes: accessibility ? generateAccessibilityNotes(mode) : null,
    better_time: generateBetterTime(),
  };
}

export function generateRouteSteps(origin, dest, mode, path) {
  const steps = [];
  const modeIcon = { walk: '🚶', bus: '🚌', train: '🚂', auto: '🛺', private: '🚗' };
  const icon = modeIcon[mode] || '📍';

  steps.push({
    instruction: `Start from ${origin.name}`,
    instructionHi: `${origin.nameHi} से शुरू करें`,
    icon: '📍',
    distance: '—',
    detail: origin.type === 'station' ? 'Exit from main gate, head east' : 'Begin journey',
  });

  if (mode === 'bus') {
    steps.push({
      instruction: 'Board Kumbh Shuttle from Bay 3',
      instructionHi: 'बे 3 से कुंभ शटल में बैठें',
      icon: '🚌',
      distance: '0.2 km walk',
      detail: 'Shuttle runs every 10 min · Route: Mela Special',
    });
    steps.push({
      instruction: 'Travel via Mela Road towards Sangam area',
      instructionHi: 'मेला रोड से संगम क्षेत्र की ओर जाएं',
      icon: '🚌',
      distance: `${(calcDistance(path) * 0.6).toFixed(1)} km`,
      detail: 'Estimated 12–18 min · Congestion expected near Sector 9',
    });
    steps.push({
      instruction: 'Alight at Sangam Bus Stop',
      instructionHi: 'संगम बस स्टॉप पर उतरें',
      icon: '🛑',
      distance: '—',
      detail: 'Look for the orange KumbhFlow signage',
    });
  } else if (mode === 'train') {
    steps.push({
      instruction: 'Board Kumbh Mela Special train',
      instructionHi: 'कुंभ मेला स्पेशल ट्रेन में बैठें',
      icon: '🚂',
      distance: 'Platform 2',
      detail: 'Next departure in 15 min · Unreserved',
    });
    steps.push({
      instruction: 'Travel to Naini / nearest halt',
      instructionHi: 'नैनी / निकटतम स्टॉप तक जाएं',
      icon: '🚂',
      distance: `${(calcDistance(path) * 0.5).toFixed(1)} km`,
      detail: 'Approximately 20 min journey',
    });
  } else if (mode === 'walk') {
    steps.push({
      instruction: 'Walk along the marked pilgrim corridor',
      instructionHi: 'चिह्नित तीर्थयात्री गलियारे से चलें',
      icon: '🚶',
      distance: `${(calcDistance(path) * 0.4).toFixed(1)} km`,
      detail: 'Follow the saffron directional flags',
    });
    steps.push({
      instruction: 'Cross at the pedestrian bridge near Sector 7',
      instructionHi: 'सेक्टर 7 के पास पैदल पुल से पार करें',
      icon: '🌉',
      distance: '0.3 km',
      detail: 'Bridge has ramps for wheelchair access',
    });
  } else {
    steps.push({
      instruction: `Take ${mode === 'auto' ? 'auto-rickshaw' : 'vehicle'} via GT Road`,
      instructionHi: `GT रोड से ${mode === 'auto' ? 'ऑटो' : 'वाहन'} लें`,
      icon,
      distance: `${(calcDistance(path) * 0.7).toFixed(1)} km`,
      detail: mode === 'auto' ? 'Negotiate fare beforehand · ~₹80-120' : 'Follow diversion signs',
    });
  }

  steps.push({
    instruction: `Walk to ${dest.name}`,
    instructionHi: `${dest.nameHi} तक पैदल जाएं`,
    icon: '🚶',
    distance: `${(0.3 + Math.random() * 0.5).toFixed(1)} km`,
    detail: 'Follow the crowd management barriers to the ghat entrance',
  });

  steps.push({
    instruction: `Arrive at ${dest.name}`,
    instructionHi: `${dest.nameHi} पहुँचें`,
    icon: '✅',
    distance: '—',
    detail: 'You have reached your destination · Jay Ganga Maiya!',
  });

  return steps;
}

export function generateWarnings(dest, congestion) {
  const warnings = [];
  if (congestion > 7) {
    warnings.push({
      type: 'crowd_surge',
      message: `High crowd density detected near ${dest.name}. Expect slow movement.`,
      messageHi: `${dest.nameHi} के पास भारी भीड़। धीमी गति की उम्मीद करें।`,
      severity: 'high',
    });
  }
  if (Math.random() > 0.5) {
    warnings.push({
      type: 'road_closure',
      message: 'Partial road closure on Mela Road between Sector 5–8. Use alternate route.',
      messageHi: 'सेक्टर 5-8 के बीच मेला रोड पर आंशिक सड़क बंद। वैकल्पिक मार्ग अपनाएं।',
      severity: 'medium',
    });
  }
  if (Math.random() > 0.6) {
    warnings.push({
      type: 'weather',
      message: 'Light fog expected in early morning. Carry warm clothing.',
      messageHi: 'सुबह हल्के कोहरे की संभावना। गर्म कपड़े साथ रखें।',
      severity: 'low',
    });
  }
  return warnings;
}

export function generateProTips(dest, mode, congestion) {
  return [
    {
      tip: `Carry water and light snacks. The walk from the drop point to ${dest.name} can take 20–30 minutes during peak hours.`,
      tipHi: `पानी और हल्का नाश्ता साथ रखें। पीक घंटों में ${dest.nameHi} तक पैदल 20-30 मिनट लग सकते हैं।`,
    },
    {
      tip: mode === 'bus' ? 'Board from the left door and exit from the right. Keep your belongings close.' : 'Keep your phone charged for navigation. Free charging stations at Sector 4 and 12.',
      tipHi: mode === 'bus' ? 'बाईं ओर से चढ़ें और दाईं ओर से उतरें। अपना सामान पास रखें।' : 'नेविगेशन के लिए फोन चार्ज रखें। सेक्टर 4 और 12 में मुफ्त चार्जिंग।',
    },
    {
      tip: congestion > 6 ? 'Consider visiting after 4 PM when crowd density typically drops by 40%.' : 'Current crowd levels are manageable. Good time to visit!',
      tipHi: congestion > 6 ? 'शाम 4 बजे के बाद जाने पर विचार करें, भीड़ 40% कम हो जाती है।' : 'वर्तमान भीड़ सामान्य है। जाने का अच्छा समय!',
    },
  ];
}

export function generateAccessibilityNotes(mode) {
  return {
    wheelchairFriendly: mode !== 'auto',
    elderlyFriendly: mode === 'bus' || mode === 'private',
    notes: [
      'Wheelchair ramps available at pedestrian bridges near Sector 7 and 12',
      'Priority boarding on Kumbh Shuttle buses for elderly and disabled pilgrims',
      'Medical assistance booths every 500m along the pilgrim corridor',
      'Golf cart service available from Sector 9 to Sangam for VIP/disabled pilgrims (₹50)',
    ],
    notesHi: [
      'सेक्टर 7 और 12 के पैदल पुलों पर व्हीलचेयर रैंप उपलब्ध',
      'बुजुर्गों और विकलांग तीर्थयात्रियों के लिए कुंभ शटल बसों में प्राथमिकता',
      'तीर्थयात्री गलियारे में हर 500 मीटर पर चिकित्सा सहायता बूथ',
      'सेक्टर 9 से संगम तक VIP/विकलांग के लिए गोल्फ कार्ट सेवा (₹50)',
    ],
  };
}

export function generateBetterTime() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 9) {
    return { time: '2:00 PM – 4:00 PM', reason: 'Post-lunch hours typically see 35% less crowd', reasonHi: 'दोपहर के बाद भीड़ 35% कम होती है' };
  }
  if (hour >= 10 && hour <= 16) {
    return { time: '5:00 AM – 6:30 AM', reason: 'Early morning offers shortest wait times at ghats', reasonHi: 'सुबह जल्दी घाटों पर सबसे कम इंतज़ार' };
  }
  return { time: '10:00 AM – 12:00 PM', reason: 'Mid-morning rush has subsided by this time', reasonHi: 'इस समय तक सुबह की भीड़ कम हो जाती है' };
}

// Languages for voice guidance
export const languages = [
  { id: 'en', label: 'English', nativeName: 'English', speechLang: 'en-IN' },
  { id: 'hi', label: 'Hindi', nativeName: 'हिन्दी', speechLang: 'hi-IN' },
  { id: 'bn', label: 'Bengali', nativeName: 'বাংলা', speechLang: 'bn-IN' },
];
