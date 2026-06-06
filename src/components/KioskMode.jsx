import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../context/AppContext';
import { destinations, languages } from '../data/routeData';

// Simulated Kiosk Chatbot Q&A database
const KIOSK_QA = [
  {
    keywords: ['toilet', 'restroom', 'washroom', 'शौचालय', 'toilet block'],
    replyEn: 'Restrooms are located every 200 meters along the main pilgrim corridors. The nearest public toilet block is at Sector 4 holding area, directly opposite the bus drop point. All blocks have running water and are free to use.',
    replyHi: 'शौचालय मुख्य तीर्थयात्री गलियारों के साथ हर 200 मीटर पर स्थित हैं। निकटतम सार्वजनिक शौचालय ब्लॉक सेक्टर 4 होल्डिंग क्षेत्र में, बस स्टॉप के ठीक विपरीत है। सभी ब्लॉक में पानी की सुविधा है और ये मुफ़्त हैं।'
  },
  {
    keywords: ['parking', 'park', 'p1', 'p9', 'p18', 'पार्किंग', 'vehicle'],
    replyEn: 'The nearest parking for cars is Arail Zone P18 (2.4 km away) or Naini Bridge P12 (3.1 km away). If you are arriving from the East, please park at Jhunsi Depot P1 and board the free shuttle to the mela entrance.',
    replyHi: 'कारों के लिए निकटतम पार्किंग अरैल ज़ोन P18 (2.4 किमी दूर) या नैनी ब्रिज P12 (3.1 किमी दूर) है। यदि आप पूर्व से आ रहे हैं, तो कृपया झूंसी डिपो P1 पर वाहन पार्क करें और वहाँ से मुफ़्त शटल बस लें।'
  },
  {
    keywords: ['sangam', 'triveni', 'best time', 'rush', 'संगम', 'भीड़'],
    replyEn: 'The best time to visit Triveni Sangam today is between 2:00 PM and 4:00 PM. The morning rush has cleared by then, and wait times at the ghats are under 15 minutes. Avoid the early morning hours (4:00 AM – 8:00 AM) unless participating in a Shahi Snan.',
    replyHi: 'त्रिवेणी संगम जाने का सबसे अच्छा समय आज दोपहर 2:00 बजे से शाम 4:00 बजे के बीच है। तब तक सुबह की भीड़ समाप्त हो जाती है। सुबह 4:00 से 8:00 बजे के बीच जाने से बचें।'
  },
  {
    keywords: ['train', 'bus', 'shuttle', 'station', 'express', 'ट्रेन', 'बस', 'स्टेशन', 'शटल'],
    replyEn: 'Kumbh Mela Special trains leave Prayagraj Junction every 30 minutes towards Varanasi, Lucknow, and Patna. Free shuttle buses leave Civil Lines depot every 10 minutes. Board from Bay 3.',
    replyHi: 'प्रयागराज जंक्शन से वाराणसी, लखनऊ और पटना के लिए हर 30 मिनट में कुंभ मेला स्पेशल ट्रेनें चलती हैं। सिविल लाइंस डिपो से हर 10 मिनट में मुफ्त शटल बसें छूटती हैं। बे 3 से यात्रा करें।'
  },
  {
    keywords: ['medical', 'hospital', 'doctor', 'help', 'first aid', 'अस्पताल', 'डॉक्टर', 'मदद', 'दवाई'],
    replyEn: 'For medical emergencies, the nearest First-Aid camp is located at Sector 3 holding area (500m walk). A 100-bed temporary mela hospital is located at Sector 12 with standby cardiac ambulances. Dial 108 for immediate response.',
    replyHi: 'चिकित्सा आपातकाल के लिए, निकटतम प्राथमिक उपचार शिविर सेक्टर 3 होल्डिंग क्षेत्र (500 मीटर पैदल) में है। सेक्टर 12 में एक 100 बिस्तरों वाला अस्थायी मेला अस्पताल स्थित है। आपातकाल के लिए 108 डायल करें।'
  }
];

export default function KioskMode() {
  const state = useAppState();

  // Kiosk UI Settings States
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [audioGuide, setAudioGuide] = useState(false);
  const [currentLang, setCurrentLang] = useState('hi'); // Default to Hindi for kiosks

  // Selection state
  const [selectedDestId, setSelectedDestId] = useState('');
  
  // Chatbot states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      textEn: 'Welcome to Prayagraj Mahakumbh Kiosk. Tap a destination on the left, scan the route QR code to your phone, or ask me any question in Hindi or English.',
      textHi: 'प्रयागराज महाकुंभ कियोस्क में आपका स्वागत है। बाईं ओर किसी गंतव्य पर टैप करें, अपने फोन पर रूट क्यूआर कोड स्कैन करें, या मुझसे हिंदी या अंग्रेजी में कोई भी प्रश्न पूछें।'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerSimulatedVoice();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      if (audioGuide) speakText(currentLang === 'hi' ? 'कृपया बोलें' : 'Please speak now', currentLang === 'hi' ? 'hi-IN' : 'en-IN');
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setChatInput(speechToText);
      if (audioGuide) speakText(currentLang === 'hi' ? `आवाज़ दर्ज की गई: ${speechToText}` : `Heard: ${speechToText}`, currentLang === 'hi' ? 'hi-IN' : 'en-IN');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      triggerSimulatedVoice();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const triggerSimulatedVoice = () => {
    const dictationsEn = ['Where is restroom?', 'Where is Arail parking?', 'Medical assistance near Sangam', 'Train special timings'];
    const dictationsHi = ['नज़दीकी शौचालय कहाँ है?', 'पार्किंग ज़ोन कहाँ है?', 'संगम के निकट अस्पताल कहाँ है?', 'वाराणसी जाने वाली ट्रेन की समयसारणी क्या है?'];
    
    const list = currentLang === 'hi' ? dictationsHi : dictationsEn;
    const randomQuery = list[Math.floor(Math.random() * list.length)];
    
    setChatInput(randomQuery);
    if (audioGuide) speakText(currentLang === 'hi' ? `आवाज़ दर्ज की गई: ${randomQuery}` : `Heard: ${randomQuery}`, currentLang === 'hi' ? 'hi-IN' : 'en-IN');
  };

  // Audio Guide Reader helper using SpeechSynthesis
  const speakText = (text, langCode = 'hi-IN') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    window.speechSynthesis.speak(utterance);
  };

  // Handle destination selection
  const handleSelectDestination = (dest) => {
    setSelectedDestId(dest.id);
    if (audioGuide) {
      const speechString = currentLang === 'hi' 
        ? `${dest.nameHi}। दूरी: ${getSimulatedDistance(dest.id)} किलोमीटर। भीड़ का स्तर: ${getSimulatedCrowdHi(dest.id)}।`
        : `${dest.name} Ghat. Distance: ${getSimulatedDistance(dest.id)} kilometers. Crowd status: ${getSimulatedCrowd(dest.id)}.`;
      speakText(speechString, currentLang === 'hi' ? 'hi-IN' : 'en-IN');
    }
  };

  // Pre-determined responses for chat inputs
  const processChatReply = (query) => {
    const cleanQuery = query.toLowerCase();
    let matchedReply = null;

    // Search Q&A database
    for (const qa of KIOSK_QA) {
      if (qa.keywords.some(kw => cleanQuery.includes(kw))) {
        matchedReply = qa;
        break;
      }
    }

    if (matchedReply) {
      return {
        textEn: matchedReply.replyEn,
        textHi: matchedReply.replyHi
      };
    }

    // Default reply
    return {
      textEn: `I did not fully understand your query. For parking details, write 'parking'. For medical assistance, write 'medical'. For restrooms, write 'toilet'.`,
      textHi: `मैं आपका प्रश्न पूरी तरह से नहीं समझ पाया। पार्किंग के विवरण के लिए 'पार्किंग' लिखें। चिकित्सा सहायता के लिए 'अस्पताल' लिखें। शौचालयों के लिए 'शौचालय' लिखें।`
    };
  };

  // Submit query
  const submitChatQuery = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      textEn: text,
      textHi: text
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = processChatReply(text);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        textEn: reply.textEn,
        textHi: reply.textHi
      };

      setChatMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      if (audioGuide) {
        speakText(
          currentLang === 'hi' ? botMsg.textHi : botMsg.textEn, 
          currentLang === 'hi' ? 'hi-IN' : 'en-IN'
        );
      }
    }, 1200);
  };

  // Simulated metrics helper for destinations
  const getSimulatedDistance = (id) => {
    const distances = {
      'triveni-sangam': '1.8',
      'dashashwamedh': '2.2',
      'arail-ghat': '3.4',
      'ram-ghat': '2.6',
      'saraswati-ghat': '2.9',
      'prayagraj-jn': '6.4',
      'parade-ground': '1.2'
    };
    return distances[id] || '2.0';
  };

  const getSimulatedCrowd = (id) => {
    const levels = {
      'triveni-sangam': 'High',
      'dashashwamedh': 'Medium',
      'arail-ghat': 'Low',
      'ram-ghat': 'Medium',
      'saraswati-ghat': 'Low',
      'prayagraj-jn': 'High',
      'parade-ground': 'Medium'
    };
    return levels[id] || 'Medium';
  };

  const getSimulatedCrowdHi = (id) => {
    const levels = {
      'triveni-sangam': 'अत्यधिक (High)',
      'dashashwamedh': 'मध्यम (Medium)',
      'arail-ghat': 'सामान्य (Low)',
      'ram-ghat': 'मध्यम (Medium)',
      'saraswati-ghat': 'सामान्य (Low)',
      'prayagraj-jn': 'अत्यधिक (High)',
      'parade-ground': 'मध्यम (Medium)'
    };
    return levels[id] || 'मध्यम';
  };

  const getCrowdColor = (id) => {
    const c = getSimulatedCrowd(id);
    if (c === 'High') return 'text-red bg-red/10 border-red/20';
    if (c === 'Medium') return 'text-amber bg-amber/10 border-amber/20';
    return 'text-green bg-green/10 border-green/20';
  };

  // Helper QR code generator
  const getKioskQRDataUrl = (destId) => {
    const destObj = destinations.find(d => d.id === destId);
    if (!destObj) return '';
    const link = `https://www.google.com/maps/dir/?api=1&destination=${destObj.lat},${destObj.lng}&travelmode=walking`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=131A2B&bgcolor=FFFFFF&data=${encodeURIComponent(link)}`;
  };

  // Quick helper buttons config
  const helperPrompts = [
    { en: 'Where is nearest restroom?', hi: 'नज़दीकी शौचालय कहाँ है?' },
    { en: 'Where is Jhunsi parking?', hi: 'पार्किंग सुविधा कहाँ है?' },
    { en: 'Best time to visit Sangam?', hi: 'संगम जाने का सबसे अच्छा समय?' },
    { en: 'Bus and Train timings?', hi: 'बस और ट्रेन का समय क्या है?' },
    { en: 'Where is nearest medical camp?', hi: 'चिकित्सा सहायता शिविर कहाँ है?' }
  ];

  // Colors based on high contrast selection
  const themeBg = highContrast ? 'bg-black text-yellow-400' : 'bg-navy text-text-primary';
  const themeCard = highContrast ? 'bg-black border-2 border-yellow-400 text-yellow-400' : 'bg-charcoal border border-border text-text-primary';
  const themeTextSec = highContrast ? 'text-white' : 'text-text-secondary';
  const themeAccent = highContrast ? 'bg-yellow-400 text-black' : 'bg-saffron text-white';
  const themeBorder = highContrast ? 'border-yellow-400' : 'border-border';

  return (
    <div className={`flex-1 flex flex-col sm:flex-row h-[calc(100vh-56px)] overflow-hidden ${themeBg} ${largeText ? 'text-lg' : 'text-sm'}`}>
      
      {/* LEFT COLUMN: Touch Destination Selection & Quick Directions */}
      <div className={`w-full sm:w-[55%] h-full flex flex-col p-6 lg:p-8 overflow-y-auto border-r ${themeBorder} gap-8 scrollbar z-10`}>
        
        {/* Kiosk Toolbar / Accessibility */}
        <div className={`flex flex-wrap justify-between items-center bg-charcoal-light/50 border ${themeBorder} p-3 rounded-lg gap-4 shrink-0`}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                const nextLang = currentLang === 'hi' ? 'en' : 'hi';
                setCurrentLang(nextLang);
                if (audioGuide) speakText(nextLang === 'hi' ? 'भाषा बदली गई' : 'Language changed', nextLang === 'hi' ? 'hi-IN' : 'en-IN');
              }}
              className="px-5 py-3 rounded-md border-2 border-cyan/40 bg-cyan/5 hover:bg-cyan/10 font-heading font-bold text-cyan text-sm cursor-pointer transition shadow-sm"
            >
              🌐 {currentLang === 'hi' ? 'ENGLISH' : 'हिन्दी'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setLargeText(!largeText)}
              className={`px-4 py-3 rounded-md border font-heading font-bold text-xs cursor-pointer transition ${
                largeText ? 'bg-saffron text-white border-saffron' : 'bg-charcoal border-border text-text-secondary'
              }`}
            >
              🔍 {currentLang === 'hi' ? 'बड़े अक्षर' : 'LARGE TEXT'}
            </button>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className={`px-4 py-3 rounded-md border font-heading font-bold text-xs cursor-pointer transition ${
                highContrast ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-charcoal border-border text-text-secondary'
              }`}
            >
              🌗 {currentLang === 'hi' ? 'उच्च कंट्रास्ट' : 'CONTRAST'}
            </button>
            <button
              type="button"
              onClick={() => {
                const nextAudio = !audioGuide;
                setAudioGuide(nextAudio);
                if (nextAudio) speakText(currentLang === 'hi' ? 'ऑडियो गाइड सक्रिय' : 'Audio guide activated', currentLang === 'hi' ? 'hi-IN' : 'en-IN');
              }}
              className={`px-4 py-3 rounded-md border font-heading font-bold text-xs cursor-pointer transition ${
                audioGuide ? 'bg-cyan text-navy border-cyan' : 'bg-charcoal border-border text-text-secondary'
              }`}
            >
              🔊 {currentLang === 'hi' ? 'ऑडियो गाइड' : 'AUDIO GUIDE'}
            </button>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2 shrink-0 text-center sm:text-left">
          <h1 className="text-3xl lg:text-4xl font-extrabold font-heading tracking-tight">
            {currentLang === 'hi' ? 'आप कहाँ जाना चाहते हैं?' : 'WHERE DO YOU WANT TO GO?'}
          </h1>
          <p className={`text-base font-semibold ${themeTextSec}`}>
            {currentLang === 'hi' ? 'गंतव्य का चयन करें और त्वरित रूट एवं दिशा निर्देश प्राप्त करें।' : 'Select a destination for quick routes and direction details.'}
          </p>
        </div>

        {/* Big Touch Targets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 shrink-0">
          {destinations.filter(d => ['triveni-sangam', 'dashashwamedh', 'arail-ghat', 'ram-ghat', 'saraswati-ghat', 'prayagraj-jn', 'parade-ground'].includes(d.id)).map((dest) => {
            const isSelected = selectedDestId === dest.id;
            return (
              <div
                key={dest.id}
                onClick={() => handleSelectDestination(dest)}
                className={`rounded-lg p-6 cursor-pointer transition duration-300 border-2 flex flex-col gap-4 shadow-md ${
                  isSelected
                    ? (highContrast ? 'border-yellow-400 bg-yellow-400/10' : 'border-saffron bg-saffron/5 shadow-saffron/5')
                    : (highContrast ? 'border-white bg-black hover:border-yellow-400' : 'border-border bg-charcoal hover:border-text-secondary/50')
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <span className="text-3xl">
                      {dest.type === 'ghat' ? '🕉️' : dest.type === 'station' ? '🚂' : '🏕️'}
                    </span>
                    <div>
                      <h3 className="font-extrabold font-heading text-lg lg:text-xl text-text-primary">
                        {currentLang === 'hi' ? dest.nameHi : dest.name}
                      </h3>
                      {currentLang === 'hi' && (
                        <span className="text-xs text-text-secondary font-mono block mt-0.5">{dest.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/20 text-sm font-semibold">
                  <div className="flex gap-1 items-center">
                    <span className={themeTextSec}>{currentLang === 'hi' ? 'दूरी:' : 'Dist:'}</span>
                    <span className="font-mono text-cyan font-bold">{getSimulatedDistance(dest.id)} km</span>
                  </div>

                  <div className={`px-3 py-1 rounded-md border text-xs font-mono font-bold ${getCrowdColor(dest.id)}`}>
                    {currentLang === 'hi' ? getSimulatedCrowdHi(dest.id) : `${getSimulatedCrowd(dest.id)} Crowd`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Route Guidance Card */}
        <AnimatePresence>
          {selectedDestId && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card rounded-lg border-l-4 ${
                highContrast ? 'border-l-yellow-400' : 'border-l-saffron'
              } ${themeCard} p-6 lg:p-8 flex flex-col md:flex-row gap-6 shrink-0 justify-between items-center relative overflow-hidden`}
            >
              {/* Left Column: Route text */}
              <div className="flex-1 space-y-4">
                <div className="border-b border-border/20 pb-3">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-widest font-bold ${
                    highContrast ? 'bg-yellow-400/20 text-yellow-400' : 'bg-saffron/15 text-saffron'
                  }`}>
                    {currentLang === 'hi' ? 'त्वरित मार्गदर्शक' : 'QUICK ROUTE GUIDANCE'}
                  </span>
                  <h4 className="text-xl font-heading font-extrabold text-text-primary mt-2">
                    {currentLang === 'hi' 
                      ? `${destinations.find(d => d.id === selectedDestId)?.nameHi} की यात्रा`
                      : `Journey to ${destinations.find(d => d.id === selectedDestId)?.name}`
                    }
                  </h4>
                </div>

                <div className="space-y-3 font-heading text-sm font-semibold">
                  <div className="flex gap-3 items-center">
                    <span className="text-xl">🚌</span>
                    <p className={themeTextSec}>
                      {currentLang === 'hi' 
                        ? 'निकटतम परिवहन: बे 3 मेला शटल (हर 10 मिनट में)' 
                        : 'Nearest Transport: Bay 3 Mela Shuttle (runs every 10 mins)'
                      }
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-xl">🚶</span>
                    <p className={themeTextSec}>
                      {currentLang === 'hi' 
                        ? 'पैदल मार्ग: सेक्टर 7 पैदल पुल गलियारा (दूरी: लगभग 1.5 किमी)' 
                        : 'Pedestrian Route: Sector 7 pedestrian bridge corridor (~1.5 km walk)'
                      }
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-xl">⏰</span>
                    <p className="text-cyan font-bold">
                      {currentLang === 'hi' 
                        ? 'भीड़ से बचें: दोपहर 2:00 से शाम 4:00 बजे के बीच यात्रा सबसे सुगम' 
                        : 'Best Time: Travel between 2:00 PM – 4:00 PM (Low wait times)'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Scannable QR directions */}
              <div className="flex flex-col items-center gap-3 shrink-0 p-4 border border-border/25 rounded-lg bg-charcoal-light/30 text-center">
                <div className="w-36 h-36 bg-white rounded-md flex items-center justify-center p-2">
                  <img
                    src={getKioskQRDataUrl(selectedDestId)}
                    alt="Navigation GPS QR"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <span className={`text-[9px] font-mono tracking-wider font-extrabold uppercase ${
                    highContrast ? 'text-yellow-400' : 'text-saffron'
                  }`}>
                    {currentLang === 'hi' ? 'फोन पर मार्ग देखें' : 'SCAN FOR MOBILE ROUTE'}
                  </span>
                  <p className="text-[10px] text-text-secondary max-w-[150px] mx-auto leading-normal">
                    {currentLang === 'hi' 
                      ? 'गूगल मैप्स नेвиगेशन सीधे शुरू करने के लिए स्कैन करें।' 
                      : 'Scan to load instant walking path in Google Maps.'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: Multilingual Kiosk AI Assistant */}
      <div className="w-full sm:w-[45%] h-full flex flex-col p-6 lg:p-8 bg-[#0D1321]/90 border-l border-border relative z-10">
        
        {/* Chatbot Header */}
        <div className="flex gap-3 items-center border-b border-border pb-4 mb-4 shrink-0">
          <div className={`w-3.5 h-3.5 rounded-full bg-cyan animate-pulse`} />
          <div>
            <h2 className="font-extrabold font-heading text-lg lg:text-xl text-text-primary">
              {currentLang === 'hi' ? 'कुंभ मार्गदर्शक AI' : 'Kumbh Guide AI'}
            </h2>
            <span className="text-xs font-mono text-cyan block mt-0.5 uppercase tracking-wider font-bold">
              {currentLang === 'hi' ? 'मदद के लिए प्रश्न पूछें (स्वर / पाठ)' : 'Voice & Text Assistant'}
            </span>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar mb-6">
          {chatMessages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] w-fit rounded-lg px-6 py-3.5 ${
                  isBot 
                    ? (highContrast ? 'bg-black border border-yellow-400 text-yellow-400' : 'bg-charcoal border border-border text-text-primary')
                    : (highContrast ? 'bg-yellow-400 text-black font-extrabold' : 'bg-saffron text-white font-medium')
                } flex flex-col gap-2`}>
                  <p className={`font-heading leading-relaxed break-words ${largeText ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'}`}>
                    {currentLang === 'hi' ? msg.textHi : msg.textEn}
                  </p>
                  
                  {isBot && (
                    <div className="flex justify-between items-center border-t border-border/10 pt-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => speakText(
                          currentLang === 'hi' ? msg.textHi : msg.textEn,
                          currentLang === 'hi' ? 'hi-IN' : 'en-IN'
                        )}
                        className={`text-[10px] font-bold tracking-wider font-heading cursor-pointer hover:underline flex items-center gap-1 ${
                          highContrast ? 'text-yellow-400' : 'text-cyan'
                        }`}
                      >
                        📢 {currentLang === 'hi' ? 'सुनाएँ' : 'Read Aloud'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className={`rounded-lg px-6 py-3.5 ${themeCard} flex items-center gap-1.5`}>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Helper touch queries */}
        <div className="space-y-3 mb-5 shrink-0">
          <span className="text-[10px] font-heading font-bold text-text-secondary uppercase tracking-wider block">
            {currentLang === 'hi' ? 'सुझाए गए त्वरित प्रश्न' : 'SUGGESTED TOUCH QUESTIONS'}
          </span>
          <div className="flex flex-wrap gap-2">
            {helperPrompts.map((prompt) => (
              <button
                key={prompt.en}
                type="button"
                onClick={() => submitChatQuery(currentLang === 'hi' ? prompt.hi : prompt.en)}
                className={`px-4 py-3 rounded-md text-xs font-heading font-bold cursor-pointer transition ${
                  highContrast 
                    ? 'border-2 border-yellow-400 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black' 
                    : 'bg-charcoal border border-border text-text-primary hover:bg-charcoal-light'
                }`}
              >
                💬 {currentLang === 'hi' ? prompt.hi : prompt.en}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Text/Voice Input field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitChatQuery(chatInput);
          }}
          className={`flex gap-3 bg-charcoal border ${themeBorder} p-2.5 rounded-lg items-center shrink-0 shadow-inner`}
        >
          {/* Audio input button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`w-12 h-12 rounded-md flex items-center justify-center cursor-pointer transition shrink-0 ${
              isListening
                ? 'bg-red/25 border-2 border-red text-white animate-pulse'
                : 'bg-cyan/10 hover:bg-cyan/20 border border-cyan/20 text-cyan'
            }`}
            title={isListening ? 'Listening...' : 'Voice Search'}
          >
            {isListening ? '🔴' : '🎤'}
          </button>

          <input
            type="text"
            placeholder={currentLang === 'hi' ? 'यहाँ अपना प्रश्न लिखें...' : 'Ask a question here...'}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-transparent border-none text-text-primary focus:outline-none px-3 font-heading text-sm font-semibold placeholder:text-text-dim"
          />

          <button
            type="submit"
            className="w-12 h-12 rounded-md bg-saffron hover:bg-saffron-light text-white font-bold flex items-center justify-center cursor-pointer transition shadow-md shrink-0"
          >
            ➔
          </button>
        </form>
      </div>
    </div>
  );
}
