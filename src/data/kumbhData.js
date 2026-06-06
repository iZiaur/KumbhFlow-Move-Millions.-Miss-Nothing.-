// Synthetic Data Layer for KumbhFlow
// Defines Prayagraj coordinates, parking lots (P1-P8), 15 road segments, and 24h footfall generator.

export const GHATS = [
  { id: 'triveni-sangam', name: 'Triveni Sangam', nameHi: 'त्रिवेणी संगम', lat: 25.4270, lng: 81.8855, capacity: 500000, icon: '🙏', type: 'ghat', description: 'Sacred confluence of Ganga, Yamuna & Saraswati' },
  { id: 'dashashwamedh', name: 'Dashashwamedh Ghat', nameHi: 'दशाश्वमेध घाट', lat: 25.4340, lng: 81.8870, capacity: 300000, icon: '🔥', type: 'ghat', description: 'Historic ghat with evening aarti ceremonies' },
  { id: 'arail-ghat', name: 'Arail Ghat', nameHi: 'अरैल घाट', lat: 25.4190, lng: 81.8920, capacity: 200000, icon: '🌊', type: 'ghat', description: 'Eastern bank ghat near Sangam' },
  { id: 'ram-ghat', name: 'Ram Ghat', nameHi: 'राम घाट', lat: 25.4380, lng: 81.8810, capacity: 250000, icon: '🙏', type: 'ghat', description: 'Northern ghat area for pilgrim bathing' },
  { id: 'saraswati-ghat', name: 'Saraswati Ghat', nameHi: 'सरस्वती घाट', lat: 25.4310, lng: 81.8900, capacity: 180000, icon: '📿', type: 'ghat', description: 'Sacred ghat along Yamuna bank' },
  { id: 'quila-ghat', name: 'Quila Ghat', nameHi: 'किला घाट', lat: 25.4290, lng: 81.8780, capacity: 150000, icon: '🏰', type: 'ghat', description: 'Near Allahabad Fort, historic bathing site' },
  { id: 'nagvasuki', name: 'Nag Vasuki Temple', nameHi: 'नाग वासुकी', lat: 25.4350, lng: 81.8750, capacity: 80000, icon: '🐍', type: 'temple', description: 'Ancient Nag Vasuki temple' },
  { id: 'hanuman-mandir', name: 'Hanuman Mandir', nameHi: 'हनुमान मंदिर', lat: 25.4295, lng: 81.8840, capacity: 100000, icon: '🙏', type: 'temple', description: 'Famous reclining Hanuman temple' },
  { id: 'prayagraj-jn', name: 'Prayagraj Junction', nameHi: 'प्रयागराज जंक्शन', lat: 25.4358, lng: 81.8463, type: 'station', capacity: 150000, icon: '🚂', description: 'Primary transit junction' },
  { id: 'parade-ground', name: 'Parade Ground Camp', nameHi: 'परेड ग्राउंड कैंप', lat: 25.4350, lng: 81.8500, type: 'camp', capacity: 250000, icon: '🏕️', description: 'Pilgrim camp staging ground' },
  { id: 'someshwar-ghat', name: 'Someshwar Ghat', nameHi: 'सोमेश्वर घाट', lat: 25.4120, lng: 81.9010, capacity: 120000, icon: '🕉️', type: 'ghat', description: 'Southern sector ghat' },
  { id: 'jhunsi-ghat', name: 'Jhunsi Ghat', nameHi: 'झूंसी घाट', lat: 25.4480, lng: 81.8830, capacity: 220000, icon: '🌊', type: 'ghat', description: 'Eastern mela entrance ghat' },
];

export const PARKING = [
  { id: 'P1', name: 'Jhunsi Lot A', lat: 25.4450, lng: 81.8600, totalSlots: 10000, occupied: 6500, type: 'car', description: 'Eastern approach, cars' },
  { id: 'P2', name: 'Jhunsi Lot B', lat: 25.4480, lng: 81.8650, totalSlots: 8000, occupied: 4000, type: 'car', description: 'Eastern approach overflow' },
  { id: 'P3', name: 'Naini Lot A', lat: 25.4150, lng: 81.8700, totalSlots: 12000, occupied: 7000, type: 'bus', description: 'Southern approach, buses' },
  { id: 'P4', name: 'Naini Lot B', lat: 25.4130, lng: 81.8780, totalSlots: 6000, occupied: 3200, type: 'car', description: 'Southern approach, cars' },
  { id: 'P5', name: 'Civil Lines A', lat: 25.4550, lng: 81.8450, totalSlots: 9000, occupied: 5000, type: 'car', description: 'Northern approach, cars' },
  { id: 'P6', name: 'Civil Lines B', lat: 25.4500, lng: 81.8480, totalSlots: 5000, occupied: 2500, type: 'auto', description: 'Northern approach, auto' },
  { id: 'P7', name: 'Kydganj Lot', lat: 25.4400, lng: 81.8350, totalSlots: 11000, occupied: 6000, type: 'bus', description: 'City bridge approach, buses' },
  { id: 'P8', name: 'GT Road Lot', lat: 25.4600, lng: 81.8250, totalSlots: 15000, occupied: 8500, type: 'mixed', description: 'Highway approach, mixed' },
];

// 15 road segments connecting ghats <-> parking
export const ROADS = [
  { id: 'road-1', name: 'Jhunsi Highway (P1 ↔ Jhunsi Ghat)', from: 'P1', to: 'jhunsi-ghat', baseTime: 8, congestion: 1.0, path: [[25.4450, 81.8600], [25.4465, 81.8715], [25.4480, 81.8830]] },
  { id: 'road-2', name: 'East Mela Link (P2 ↔ Jhunsi Ghat)', from: 'P2', to: 'jhunsi-ghat', baseTime: 9, congestion: 1.0, path: [[25.4480, 81.8650], [25.4480, 81.8740], [25.4480, 81.8830]] },
  { id: 'road-3', name: 'Pontoon Bridge East (Jhunsi Ghat ↔ Sangam)', from: 'jhunsi-ghat', to: 'triveni-sangam', baseTime: 12, congestion: 1.0, path: [[25.4480, 81.8830], [25.4380, 81.8850], [25.4270, 81.8855]] },
  { id: 'road-4', name: 'Arail Link Road (P3 ↔ Arail Ghat)', from: 'P3', to: 'arail-ghat', baseTime: 10, congestion: 1.0, path: [[25.4150, 81.8700], [25.4170, 81.8810], [25.4190, 81.8920]] },
  { id: 'road-5', name: 'South Concourse (P4 ↔ Arail Ghat)', from: 'P4', to: 'arail-ghat', baseTime: 7, congestion: 1.0, path: [[25.4130, 81.8780], [25.4160, 81.8850], [25.4190, 81.8920]] },
  { id: 'road-6', name: 'Someshwar Path (Arail Ghat ↔ Someshwar Ghat)', from: 'arail-ghat', to: 'someshwar-ghat', baseTime: 5, congestion: 1.0, path: [[25.4190, 81.8920], [25.4150, 81.8965], [25.4120, 81.9010]] },
  { id: 'road-7', name: 'Station Road (P5 ↔ Nehru Ghat)', from: 'P5', to: 'nehru-ghat', baseTime: 14, congestion: 1.0, path: [[25.4550, 81.8450], [25.4435, 81.8565], [25.4320, 81.8680]] },
  { id: 'road-8', name: 'Civil Lines Concourse (P6 ↔ Nehru Ghat)', from: 'P6', to: 'nehru-ghat', baseTime: 11, congestion: 1.0, path: [[25.4500, 81.8480], [25.4410, 81.8580], [25.4320, 81.8680]] },
  { id: 'road-9', name: 'Fort Corridor (Nehru Ghat ↔ Quila Ghat)', from: 'nehru-ghat', to: 'quila-ghat', baseTime: 6, congestion: 1.0, path: [[25.4320, 81.8680], [25.4305, 81.8730], [25.4290, 81.8780]] },
  { id: 'road-10', name: 'Kydganj Bypass (P7 ↔ Kali Ghat)', from: 'P7', to: 'kali-ghat', baseTime: 13, congestion: 1.0, path: [[25.4400, 81.8350], [25.4405, 81.8535], [25.4410, 81.8720]] },
  { id: 'road-11', name: 'Ganga Bank Path (Kali Ghat ↔ Nagvasuki)', from: 'kali-ghat', to: 'nagvasuki', baseTime: 5, congestion: 1.0, path: [[25.4410, 81.8720], [25.4380, 81.8735], [25.4350, 81.8750]] },
  { id: 'road-12', name: 'Northern Ghat Route (Nagvasuki ↔ Ram Ghat)', from: 'nagvasuki', to: 'ram-ghat', baseTime: 6, congestion: 1.0, path: [[25.4350, 81.8750], [25.4365, 81.8780], [25.4380, 81.8810]] },
  { id: 'road-13', name: 'GT Road Express (P8 ↔ Dashashwamedh)', from: 'P8', to: 'dashashwamedh', baseTime: 18, congestion: 1.0, path: [[25.4600, 81.8250], [25.4470, 81.8560], [25.4340, 81.8870]] },
  { id: 'road-14', name: 'Aarti Lane (Dashashwamedh ↔ Hanuman Mandir)', from: 'dashashwamedh', to: 'hanuman-mandir', baseTime: 4, congestion: 1.0, path: [[25.4340, 81.8870], [25.4315, 81.8855], [25.4295, 81.8840]] },
  { id: 'road-15', name: 'Confluence Marg (Hanuman Mandir ↔ Saraswati Ghat)', from: 'hanuman-mandir', to: 'saraswati-ghat', baseTime: 5, congestion: 1.0, path: [[25.4295, 81.8840], [25.4300, 81.8870], [25.4310, 81.8900]] }
];

// Generates simulated 24h footfall curve for a ghat
// Sinusoidal base with early morning peak (bathing snan hours) + noise
export function get24hFootfall(ghatCapacity, timeHour, hasFestivalSpike = false) {
  const points = [];
  for (let h = 0; h < 24; h += 2) {
    const hourRad = (h / 24) * Math.PI * 2;
    // Morning peak at 5am to 9am
    const morningPeak = Math.exp(-Math.pow((h - 7) / 2.5, 2)) * 0.45;
    // Evening peak at 6pm
    const eveningPeak = Math.exp(-Math.pow((h - 18) / 3, 2)) * 0.25;
    // Base flow
    const baseFlow = 0.15 + Math.sin(hourRad - Math.PI / 2) * 0.05;

    let ratio = baseFlow + morningPeak + eveningPeak;

    // Add festival surge if active
    if (hasFestivalSpike) {
      const festivalPeak = Math.exp(-Math.pow((h - 8) / 1.5, 2)) * 0.6;
      ratio += festivalPeak;
    }

    // Add noise
    ratio += (Math.random() - 0.5) * 0.05;
    ratio = Math.max(0.05, Math.min(0.98, ratio));

    points.push({
      time: `${h.toString().padStart(2, '0')}:00`,
      crowd: Math.round(ghatCapacity * ratio),
    });
  }
  return points;
}
