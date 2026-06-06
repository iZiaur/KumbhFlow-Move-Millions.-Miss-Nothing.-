// Mahakumbh 2025 Sacred Bathing (Snan) Calendar
// These dates are based on the actual Mahakumbh 2025 schedule

export const snanCalendar = [
  {
    id: 'paush-purnima',
    name: 'Paush Purnima (Shahi Snan)',
    nameHi: 'पौष पूर्णिमा (शाही स्नान)',
    date: '2025-01-13',
    startTime: '04:00',
    peakTime: '06:30',
    endTime: '12:00',
    ghat: 'Triveni Sangam',
    expectedCrowd: 10000000,
    significance: 'Opening royal bath — marks the beginning of Mahakumbh',
    surgeLevel: 9,
    type: 'shahi',
  },
  {
    id: 'makar-sankranti',
    name: 'Makar Sankranti (Shahi Snan)',
    nameHi: 'मकर संक्रांति (शाही स्नान)',
    date: '2025-01-14',
    startTime: '03:30',
    peakTime: '06:00',
    endTime: '14:00',
    ghat: 'Triveni Sangam',
    expectedCrowd: 35000000,
    significance: 'First major Shahi Snan — sun enters Capricorn',
    surgeLevel: 10,
    type: 'shahi',
  },
  {
    id: 'mauni-amavasya',
    name: 'Mauni Amavasya (Shahi Snan)',
    nameHi: 'मौनी अमावस्या (शाही स्नान)',
    date: '2025-01-29',
    startTime: '03:00',
    peakTime: '05:30',
    endTime: '15:00',
    ghat: 'Triveni Sangam',
    expectedCrowd: 100000000,
    significance: 'Most auspicious bath — expected largest single-day gathering in history',
    surgeLevel: 10,
    type: 'shahi',
  },
  {
    id: 'basant-panchami',
    name: 'Basant Panchami (Shahi Snan)',
    nameHi: 'बसंत पंचमी (शाही स्नान)',
    date: '2025-02-03',
    startTime: '04:00',
    peakTime: '07:00',
    endTime: '13:00',
    ghat: 'Dashashwamedh Ghat',
    expectedCrowd: 20000000,
    significance: 'Spring festival bath — Saraswati puja',
    surgeLevel: 8,
    type: 'shahi',
  },
  {
    id: 'maghi-purnima',
    name: 'Maghi Purnima',
    nameHi: 'माघी पूर्णिमा',
    date: '2025-02-12',
    startTime: '04:30',
    peakTime: '07:00',
    endTime: '12:00',
    ghat: 'Ram Ghat',
    expectedCrowd: 15000000,
    significance: 'Full moon bath in Magha month',
    surgeLevel: 7,
    type: 'purnima',
  },
  {
    id: 'maha-shivaratri',
    name: 'Maha Shivaratri (Shahi Snan)',
    nameHi: 'महा शिवरात्रि (शाही स्नान)',
    date: '2025-02-26',
    startTime: '03:00',
    peakTime: '05:00',
    endTime: '14:00',
    ghat: 'Triveni Sangam',
    expectedCrowd: 30000000,
    significance: 'Final Shahi Snan — the great night of Shiva',
    surgeLevel: 9,
    type: 'shahi',
  },
];

// Get today's events (for simulation, we cycle through them)
export function getTodayEvents() {
  const now = new Date();
  const hour = now.getHours();
  
  // Simulate upcoming events for the timeline
  const upcoming = [
    {
      name: 'Morning Snan — Triveni Sangam',
      nameHi: 'प्रातः स्नान — त्रिवेणी संगम',
      time: '06:00',
      ghat: 'Triveni Sangam',
      expectedCrowd: 450000,
      status: hour < 6 ? 'upcoming' : hour < 10 ? 'active' : 'completed',
      surgeLevel: 6,
    },
    {
      name: 'Midday Bath — Dashashwamedh',
      nameHi: 'मध्याह्न स्नान — दशाश्वमेध',
      time: '11:00',
      ghat: 'Dashashwamedh Ghat',
      expectedCrowd: 280000,
      status: hour < 11 ? 'upcoming' : hour < 14 ? 'active' : 'completed',
      surgeLevel: 5,
    },
    {
      name: 'Evening Aarti — Sangam',
      nameHi: 'सायं आरती — संगम',
      time: '18:00',
      ghat: 'Triveni Sangam',
      expectedCrowd: 350000,
      status: hour < 18 ? 'upcoming' : hour < 20 ? 'active' : 'completed',
      surgeLevel: 7,
    },
    {
      name: 'Night Vigil Bath — Quila Ghat',
      nameHi: 'रात्रि जागरण स्नान — किला घाट',
      time: '22:00',
      ghat: 'Quila Ghat',
      expectedCrowd: 120000,
      status: hour < 22 ? 'upcoming' : 'active',
      surgeLevel: 4,
    },
  ];

  return upcoming;
}

// Format crowd number for display
export function formatCrowd(num) {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
