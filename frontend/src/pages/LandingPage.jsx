import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { 
  Sparkles, Move, Code2, ArrowRight, Zap, Globe, 
  CheckCircle, Github, Twitter, Linkedin, Layout, CreditCard, X, Loader2, Layers 
} from 'lucide-react';

const LandingPage = () => {
  const { user, updatePlan } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const[billingCycle, setBillingCycle] = useState('monthly');
  const [pricingGeo, setPricingGeo] = useState({ currency: 'USD', symbol: '$', rate: 1 });
  
  const[easterEggActive, setEasterEggActive] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, plan: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const[paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fallbackTimezoneCheck = () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Asia/Calcutta' || tz === 'Asia/Kolkata') {
        setPricingGeo({ currency: 'INR', symbol: '₹', rate: 83 });
      } else if (tz.startsWith('Europe/')) {
        setPricingGeo({ currency: 'EUR', symbol: '€', rate: 0.92 });
      } else if (tz === 'Europe/London') {
        setPricingGeo({ currency: 'GBP', symbol: '£', rate: 0.78 });
      } else {
        setPricingGeo({ currency: 'USD', symbol: '$', rate: 1 });
      }
    };

    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const currencyMap = {
          'USD': { symbol: '$', rate: 1 }, 'INR': { symbol: '₹', rate: 83 },
          'EUR': { symbol: '€', rate: 0.92 }, 'GBP': { symbol: '£', rate: 0.78 },
          'AUD': { symbol: 'A$', rate: 1.52 }, 'CAD': { symbol: 'C$', rate: 1.35 },
        };
        if (data.currency && currencyMap[data.currency]) {
          setPricingGeo({ currency: data.currency, ...currencyMap[data.currency] });
        } else { fallbackTimezoneCheck(); }
      } catch (error) { fallbackTimezoneCheck(); }
    };
    detectLocation();
  },[]);

  // KONAMI CODE (↑ ↑ ↓ ↓ ← → ← → B A)
  const konamiCode =['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const[konamiIndex, setKonamiIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === konamiCode[konamiIndex]) {
        if (konamiIndex === konamiCode.length - 1) {
          setEasterEggActive(true);
          setKonamiIndex(0);
          document.body.classList.add('animate-shake');
          setTimeout(() => document.body.classList.remove('animate-shake'), 800);
        } else { setKonamiIndex(konamiIndex + 1); }
      } else { setKonamiIndex(0); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiIndex]);

  const calculatePrice = (basePriceUsd) => {
    if (basePriceUsd === 0) return 0;
    const price = basePriceUsd * pricingGeo.rate;
    return pricingGeo.currency === 'INR' ? Math.ceil(price / 10) * 10 - 1 : Math.round(price);
  };

  const handlePlanClick = (plan) => {
    if (!user) { navigate('/register'); return; }
    if (user.plan === plan.name) return;
    setCheckoutModal({ isOpen: true, plan });
  };

  const processPayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await api.post('/payments/checkout', { planName: checkoutModal.plan.name });
      updatePlan(response.data.updatedPlan, response.data.token);
      setPaymentSuccess(true);
      setTimeout(() => { setCheckoutModal({ isOpen: false, plan: null }); setPaymentSuccess(false); }, 2000);
    } catch (err) {
      alert("Payment failed. Please ensure backend server is running.");
    } finally { setIsProcessing(false); }
  };

  const plans =[
    { name: 'Hobby', desc: 'Perfect for individuals building a personal portfolio.', basePrice: 0, features: ['1 AI-Generated Website', 'Standard Visual Editor', 'Community Support'], highlight: false },
    { name: 'Pro', desc: 'Ideal for freelancers and creators building multiple sites.', basePrice: billingCycle === 'monthly' ? 15 : 12, features:['Unlimited Websites', 'AI JavaScript Generation', 'Premium Dark/Light Themes'], highlight: true },
    { name: 'Agency', desc: 'For teams and agencies managing client portfolios.', basePrice: billingCycle === 'monthly' ? 49 : 39, features:['White-label Code Export', 'Custom AI Prompts', 'Dedicated Success Manager'], highlight: false }
  ];

  if (easterEggActive) {
    plans.push({ name: 'God Mode', desc: 'Unlocked via Konami Code. Infinite power.', basePrice: 0, features:['Quantum Server Access', 'Mind-reading AI', 'Matrix Code Export'], highlight: true, secret: true });
  }

  const themeAccent = easterEggActive ? 'from-green-500 to-emerald-400' : 'from-brand-600 to-fuchsia-500';
  const textAccent = easterEggActive ? 'text-green-500' : 'text-brand-500';
  const mainBg = easterEggActive ? 'bg-black text-green-500' : 'bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white';
  const gridColor = easterEggActive ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.15)';

  return (
    <div className={`relative min-h-screen transition-colors duration-500 overflow-hidden font-sans ${mainBg} perspective-1000`}>
      
      {/* --- 3D MOVING BACKGROUND GRID & PARALLAX LAYERS --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute bottom-[-40%] left-[-50%] right-[-50%] h-[150%] animate-grid-flow"
          style={{
            backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
            transform: 'rotateX(75deg) scale(2)',
            transformOrigin: 'top center',
            opacity: 0.6
          }}
        ></div>
        <div className={`absolute inset-0 bg-gradient-to-b ${easterEggActive ? 'from-black via-black/80' : 'from-slate-50 dark:from-[#020617] via-slate-50/80 dark:via-[#020617]/80'} to-transparent`}></div>
      </div>

      <div className={`absolute top-[10%] left-[5%] w-64 h-64 rounded-full blur-[100px] animate-float z-0 pointer-events-none ${easterEggActive ? 'bg-green-600/40' : 'bg-brand-600/30'}`}></div>
      <div className={`absolute bottom-[20%] right-[5%] w-96 h-96 rounded-full blur-[120px] animate-float-delayed z-0 pointer-events-none ${easterEggActive ? 'bg-emerald-500/40' : 'bg-fuchsia-600/30'}`}></div>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32 text-center transform-3d">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border font-medium text-sm mb-10 shadow-[0_10px_30px_rgba(0,0,0,0.1)] animate-fade-in-up ${easterEggActive ? 'bg-black/60 border-green-500/30 text-green-400' : 'bg-white/60 dark:bg-slate-900/60 border-gray-200 dark:border-slate-700 text-brand-700 dark:text-brand-400'}`}>
          <Sparkles className="h-4 w-4" /> {easterEggActive ? 'SYSTEM OVERRIDE ACTIVE' : 'Powered by Gemini 3.1 Flash Lite Preview'}
        </div>
        
        <h1 className={`text-6xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tight animate-fade-in-up animate-delay-100 leading-[1.1] ${easterEggActive ? 'text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'text-gray-900 dark:text-white drop-shadow-2xl'}`}>
          <span className="block mb-2 transform transition-transform hover:translate-z-10 hover:scale-105 duration-500">Build your dream site.</span>
          <span className={`block text-transparent bg-clip-text bg-gradient-to-r pb-4 ${themeAccent}`}>
            At the speed of thought.
          </span>
        </h1>
        
        <p className={`mt-6 max-w-2xl mx-auto text-lg md:text-xl animate-fade-in-up animate-delay-200 ${easterEggActive ? 'text-green-600' : 'text-gray-600 dark:text-gray-300'}`}>
          Describe your vision. Our AI generates a stunning, responsive layout with native Javascript. Edit visually in a 3D workspace and export anywhere.
        </p>
        
        <div className="mt-12 flex justify-center items-center animate-fade-in-up animate-delay-300 relative z-20">
          <Link 
            to={user ? "/dashboard" : "/register"} 
            className={`group flex items-center justify-center gap-3 px-10 py-5 text-xl font-bold rounded-full text-white shadow-[0_20px_40px_-10px_rgba(168,85,247,0.5)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 ${easterEggActive ? 'bg-green-600 shadow-[0_20px_40px_-10px_rgba(34,197,94,0.5)] hover:bg-green-500' : 'bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-brand-600 dark:hover:bg-brand-500'}`}
          >
            {user ? 'Go to Dashboard' : 'Start Building Free'} 
            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="mt-24 relative mx-auto max-w-5xl animate-fade-in-up animate-delay-400 perspective-1000 group">
          <div className={`absolute -inset-2 bg-gradient-to-r ${themeAccent} rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none`}></div>
          
          <div className={`relative rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[400px] md:h-[600px] transform transition-all duration-700 ease-out group-hover:rotate-x-2 group-hover:-translate-y-4 group-hover:scale-[1.02] ${easterEggActive ? 'bg-black border-green-500/50 shadow-[0_30px_60px_rgba(34,197,94,0.2)]' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/20 dark:border-slate-700 shadow-[0_30px_60px_rgba(0,0,0,0.3)]'}`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:animate-glare pointer-events-none z-50"></div>
            
            <div className={`h-14 border-b flex items-center px-6 gap-3 ${easterEggActive ? 'bg-green-900/20 border-green-900/50' : 'border-gray-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50'}`}>
              <div className="w-3.5 h-3.5 rounded-full bg-red-400 shadow-sm"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-green-400 shadow-sm"></div>
            </div>
            
            <div className={`flex-1 relative overflow-hidden flex items-center justify-center ${easterEggActive ? 'bg-black/90 text-green-500' : 'bg-slate-50/90 dark:bg-[#020617]/90'}`}>
               <div className="text-center relative z-10 transform transition-transform duration-500 group-hover:translate-z-10 group-hover:scale-110">
                  <Layers className={`h-16 w-16 mx-auto mb-6 ${easterEggActive ? 'text-green-500 animate-pulse' : 'text-brand-500 animate-float'}`} />
                  <h3 className={`text-4xl font-bold mb-4 tracking-tight ${easterEggActive ? 'text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-gray-900 dark:text-white drop-shadow-lg'}`}>AI Spatial Editor</h3>
                  <div className={`h-2 w-64 rounded-full mx-auto mb-4 ${easterEggActive ? 'bg-green-900/50' : 'bg-gray-200 dark:bg-slate-800'}`}></div>
                  <div className={`h-2 w-48 rounded-full mx-auto ${easterEggActive ? 'bg-green-900/50' : 'bg-gray-200 dark:bg-slate-800'}`}></div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- 3D BENTO GRID FEATURES --- */}
      <section className={`relative z-10 py-32 backdrop-blur-3xl border-y ${easterEggActive ? 'bg-black/80 border-green-900/30' : 'bg-white/70 dark:bg-slate-900/70 border-gray-200/50 dark:border-slate-800/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 perspective-1000">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className={`text-5xl font-extrabold tracking-tight drop-shadow-sm ${easterEggActive ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>Engineered for Depth</h2>
            <p className={`mt-5 text-2xl ${easterEggActive ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>Layers of technology working in harmony.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-fr">
            {/* Large Bento */}
            <div className={`group md:col-span-2 p-10 sm:p-14 rounded-[2.5rem] shadow-xl border relative overflow-hidden transform transition-all duration-500 hover:-translate-y-4 hover:scale-[1.02] hover:shadow-[0_30px_60px_-15px_rgba(168,85,247,0.3)] ${easterEggActive ? 'bg-black border-green-800 hover:shadow-[0_30px_60px_-15px_rgba(34,197,94,0.3)]' : 'bg-gradient-to-br from-white/90 to-brand-50/50 dark:from-slate-800/90 dark:to-slate-900/90 border-white/20 dark:border-slate-700'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:animate-glare pointer-events-none z-50"></div>
              <Sparkles className={`h-14 w-14 mb-8 transform transition-transform group-hover:scale-110 group-hover:rotate-12 ${easterEggActive ? 'text-green-400' : 'text-brand-600 dark:text-brand-400'}`} />
              <h3 className={`text-4xl font-bold mb-5 ${easterEggActive ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>Spatial Generative Architecture</h3>
              <p className={`text-xl leading-relaxed max-w-xl ${easterEggActive ? 'text-green-600' : 'text-gray-600 dark:text-gray-300'}`}>
                Provide your aesthetic and structural needs, and our Gemini engine constructs a fully responsive, 3D-aware glassmorphic layout wrapped in pristine code.
              </p>
            </div>
            
            {/* Small Bento 1 */}
            <div className={`group p-10 rounded-[2.5rem] shadow-xl border flex flex-col justify-center relative overflow-hidden transform transition-all duration-500 hover:-translate-y-4 hover:scale-[1.02] hover:shadow-[0_30px_60px_-15px_rgba(245,158,11,0.3)] ${easterEggActive ? 'bg-black border-green-800' : 'bg-white/80 dark:bg-slate-900/80 border-white/20 dark:border-slate-800'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:animate-glare pointer-events-none z-50"></div>
              <Zap className={`h-12 w-12 mb-6 transform transition-transform group-hover:scale-110 group-hover:rotate-12 ${easterEggActive ? 'text-green-400' : 'text-amber-500'}`} />
              <h3 className={`text-2xl font-bold mb-4 ${easterEggActive ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>Live JavaScript</h3>
              <p className={`text-lg ${easterEggActive ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>Functional, vanilla JS logic injected directly into your canvas.</p>
            </div>

            {/* Small Bento 2 */}
            <div className={`group p-10 rounded-[2.5rem] shadow-xl border flex flex-col justify-center relative overflow-hidden transform transition-all duration-500 hover:-translate-y-4 hover:scale-[1.02] hover:shadow-[0_30px_60px_-15px_rgba(217,70,239,0.3)] ${easterEggActive ? 'bg-black border-green-800' : 'bg-white/80 dark:bg-slate-900/80 border-white/20 dark:border-slate-800'}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:animate-glare pointer-events-none z-50"></div>
              <Move className={`h-12 w-12 mb-6 transform transition-transform group-hover:scale-110 group-hover:rotate-12 ${easterEggActive ? 'text-green-400' : 'text-fuchsia-500'}`} />
              <h3 className={`text-2xl font-bold mb-4 ${easterEggActive ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>Volumetric Editor</h3>
              <p className={`text-lg ${easterEggActive ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>Drag, drop, and refine inside a professional-grade Z-axis workspace.</p>
            </div>

            {/* Medium Bento */}
            <div className={`group md:col-span-2 p-10 sm:p-14 rounded-[2.5rem] shadow-2xl border relative overflow-hidden transform transition-all duration-500 hover:-translate-y-4 hover:scale-[1.02] ${easterEggActive ? 'bg-black border-green-800 shadow-[0_40px_80px_rgba(34,197,94,0.3)]' : 'bg-slate-900 dark:bg-black border-slate-800 shadow-[0_40px_80px_rgba(0,0,0,0.5)]'}`}>
              <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] transition-colors duration-700 pointer-events-none ${easterEggActive ? 'bg-green-600/30 group-hover:bg-green-600/50' : 'bg-brand-500/30 group-hover:bg-brand-500/50'}`}></div>
              <Code2 className={`h-14 w-14 mb-8 relative z-10 transform transition-transform group-hover:scale-110 group-hover:rotate-12 ${easterEggActive ? 'text-green-400' : 'text-white'}`} />
              <h3 className={`text-4xl font-bold mb-5 relative z-10 ${easterEggActive ? 'text-green-400' : 'text-white drop-shadow-md'}`}>True Code Ownership</h3>
              <p className={`text-xl leading-relaxed max-w-xl relative z-10 ${easterEggActive ? 'text-green-600' : 'text-slate-300'}`}>
                Export your entire project as clean, optimized HTML, CSS, and JS. Host it anywhere. No vendor lock-in, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- DYNAMIC PRICING --- */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 perspective-1000">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className={`text-5xl font-extrabold tracking-tight drop-shadow-sm ${easterEggActive ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>Choose Your Arsenal</h2>
            <p className={`mt-5 text-2xl flex items-center justify-center gap-3 ${easterEggActive ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
              <Globe className="h-6 w-6 animate-pulse" /> Localized for {pricingGeo.currency}
            </p>
            
            <div className={`mt-10 inline-flex rounded-full p-1.5 border shadow-inner ${easterEggActive ? 'bg-black border-green-900' : 'bg-gray-100/80 dark:bg-slate-800/80 backdrop-blur-md border-gray-200 dark:border-slate-700'}`}>
              <button onClick={() => setBillingCycle('monthly')} className={`px-8 py-3 rounded-full text-base font-bold transition-all ${billingCycle === 'monthly' ? (easterEggActive ? 'bg-green-900 text-green-300' : 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-md') : (easterEggActive ? 'text-green-700' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white')}`}>Monthly</button>
              <button onClick={() => setBillingCycle('yearly')} className={`px-8 py-3 rounded-full text-base font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? (easterEggActive ? 'bg-green-900 text-green-300' : 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-md') : (easterEggActive ? 'text-green-700' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white')}`}>
                Annually <span className={`text-xs px-2.5 py-1 rounded-full ${easterEggActive ? 'bg-black border border-green-500 text-green-500' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'}`}>Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => {
              const isCurrentPlan = user && user.plan === plan.name;
              return (
              <div 
                key={idx} 
                className={`group relative rounded-[2.5rem] p-10 flex flex-col transition-all duration-500 hover:-translate-y-4 hover:scale-[1.02] ${
                  easterEggActive ? (plan.secret ? 'bg-black border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-black border border-green-900 hover:shadow-[0_20px_40px_rgba(34,197,94,0.2)]') :
                  (plan.highlight ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl border-2 border-brand-500 transform md:-translate-y-6 hover:shadow-[0_30px_60px_rgba(168,85,247,0.3)]' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl border border-white/20 dark:border-slate-800 hover:shadow-2xl')
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:animate-glare pointer-events-none z-50 rounded-[2.5rem]"></div>

                {plan.highlight && !plan.secret && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <span className={`text-white text-sm font-bold uppercase tracking-widest py-1.5 px-6 rounded-full shadow-lg ${easterEggActive ? 'bg-green-600' : 'bg-gradient-to-r from-brand-600 to-fuchsia-600'}`}>Most Popular</span>
                  </div>
                )}
                
                <div className="mb-10 relative z-10">
                  <h3 className={`text-3xl font-extrabold ${easterEggActive ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                  <p className={`text-base mt-3 min-h-[48px] ${easterEggActive ? 'text-green-700' : 'text-gray-500 dark:text-gray-400'}`}>{plan.desc}</p>
                </div>
                
                <div className="mb-10 relative z-10">
                  <span className={`text-6xl font-extrabold tracking-tight ${easterEggActive ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-gray-900 dark:text-white drop-shadow-sm'}`}>
                    {pricingGeo.symbol}{calculatePrice(plan.basePrice)}
                  </span>
                  <span className={`font-medium text-xl ml-2 ${easterEggActive ? 'text-green-700' : 'text-gray-500 dark:text-gray-400'}`}>/mo</span>
                </div>

                <ul className="space-y-5 mb-10 flex-grow relative z-10">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-4">
                      <CheckCircle className={`h-6 w-6 flex-shrink-0 ${easterEggActive ? 'text-green-500' : 'text-brand-500'}`} />
                      <span className={`font-medium text-lg ${easterEggActive ? 'text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handlePlanClick(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-5 rounded-2xl font-extrabold text-lg text-center transition-all duration-300 relative z-10 ${
                    isCurrentPlan 
                      ? (easterEggActive ? 'bg-green-900/30 text-green-700 cursor-not-allowed border border-green-900' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-not-allowed border border-green-200 dark:border-green-800') 
                      : plan.secret 
                        ? 'bg-green-600 text-black hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] hover:-translate-y-1' 
                        : plan.highlight 
                          ? (easterEggActive ? 'bg-green-600 text-black hover:bg-green-500 hover:-translate-y-1' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1') 
                          : (easterEggActive ? 'bg-green-900/20 text-green-500 hover:bg-green-900/40 border border-green-800 hover:-translate-y-1' : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white hover:-translate-y-1 shadow-md')
                  }`}
                >
                  {isCurrentPlan ? 'Active Plan' : (user ? `Upgrade to ${plan.name}` : 'Sign Up to Buy')}
                </button>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* CHECKOUT MODAL (HIGH FIDELITY) */}
      {checkoutModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in perspective-1000">
          <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl border overflow-hidden relative transform-3d animate-fade-in-up ${easterEggActive ? 'bg-black border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'}`}>
            
            <div className={`px-8 py-6 border-b flex justify-between items-center ${easterEggActive ? 'border-green-900 bg-green-900/20' : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50'}`}>
              <h3 className={`font-bold text-xl flex items-center gap-3 ${easterEggActive ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                <CreditCard className={`h-6 w-6 ${easterEggActive ? 'text-green-500' : 'text-brand-500'}`} /> Secure Checkout
              </h3>
              <button onClick={() => !isProcessing && setCheckoutModal({isOpen: false, plan: null})} className={`p-2 rounded-full transition-colors ${easterEggActive ? 'hover:bg-green-900/40 text-green-700 hover:text-green-400' : 'hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8">
              {paymentSuccess ? (
                <div className="text-center py-10 animate-fade-in-up">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${easterEggActive ? 'bg-green-900/40' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    <CheckCircle className={`h-10 w-10 ${easterEggActive ? 'text-green-500' : 'text-green-600 dark:text-green-400'}`} />
                  </div>
                  <h4 className={`text-3xl font-bold mb-3 ${easterEggActive ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>Success!</h4>
                  <p className={`text-lg ${easterEggActive ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>Welcome to the {checkoutModal.plan.name} tier.</p>
                </div>
              ) : (
                <form onSubmit={processPayment}>
                  <div className={`mb-8 p-6 rounded-2xl border ${easterEggActive ? 'bg-green-900/10 border-green-900/50' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700/50'}`}>
                    <p className={`text-sm font-bold mb-2 uppercase tracking-widest ${easterEggActive ? 'text-green-600' : 'text-brand-600 dark:text-brand-400'}`}>Upgrading to</p>
                    <div className="flex justify-between items-end">
                      <h4 className={`text-4xl font-extrabold ${easterEggActive ? 'text-green-400' : 'text-gray-900 dark:text-white'}`}>{checkoutModal.plan.name}</h4>
                      <span className={`text-2xl font-bold ${easterEggActive ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                        {pricingGeo.symbol}{calculatePrice(checkoutModal.plan.basePrice)} <span className={`text-sm font-medium ${easterEggActive ? 'text-green-700' : 'text-gray-500'}`}>/mo</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div>
                      <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${easterEggActive ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>Card Information</label>
                      <div className="relative shadow-sm rounded-xl overflow-hidden">
                        <input type="text" placeholder="Card number" required className={`w-full p-4 border outline-none font-mono text-base transition-all ${easterEggActive ? 'bg-black border-green-900 text-green-500 focus:border-green-500 placeholder-green-900/50' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white'}`} defaultValue="4242 4242 4242 4242" />
                        <div className="flex">
                          <input type="text" placeholder="MM / YY" required className={`w-1/2 p-4 border-x border-b outline-none font-mono text-base transition-all ${easterEggActive ? 'bg-black border-green-900 text-green-500 focus:border-green-500 placeholder-green-900/50' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white'}`} defaultValue="12 / 28" />
                          <input type="text" placeholder="CVC" required className={`w-1/2 p-4 border-r border-b outline-none font-mono text-base transition-all ${easterEggActive ? 'bg-black border-green-900 text-green-500 focus:border-green-500 placeholder-green-900/50' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white'}`} defaultValue="123" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={isProcessing} className={`w-full font-extrabold text-lg py-5 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 hover:-translate-y-1 ${easterEggActive ? 'bg-green-600 text-black hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-brand-600 dark:hover:bg-brand-500'}`}>
                    {isProcessing ? <><Loader2 className="h-6 w-6 animate-spin" /> Processing...</> : `Pay ${pricingGeo.symbol}${calculatePrice(checkoutModal.plan.basePrice)}`}
                  </button>
                  <p className={`text-center text-xs mt-6 flex justify-center items-center gap-1.5 font-medium ${easterEggActive ? 'text-green-800' : 'text-gray-400'}`}>
                    <CreditCard className="h-4 w-4" /> Payments are simulated for this demo.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL PROFESSIONAL FOOTER */}
      <footer className={`relative z-10 border-t pt-16 pb-8 ${easterEggActive ? 'bg-black border-green-900/50' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6 group">
                <div className={`p-1.5 rounded-lg text-white group-hover:scale-105 transition-transform ${easterEggActive ? 'bg-green-600' : 'bg-gradient-to-tr from-brand-600 to-fuchsia-500'}`}>
                  <Layout className="h-5 w-5" />
                </div>
                <span className={`font-extrabold text-xl tracking-tight ${easterEggActive ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                  BuildMyFolio
                </span>
              </Link>
              <p className={`max-w-sm mb-6 leading-relaxed ${easterEggActive ? 'text-green-700' : 'text-gray-500 dark:text-gray-400'}`}>
                The AI-powered visual website builder. From prompt to production-ready code in seconds. No vendor lock-in.
              </p>
              <div className="flex gap-4">
                <a href="#" className={`p-2 rounded-full transition-colors ${easterEggActive ? 'bg-green-900/20 text-green-600 hover:text-green-400 hover:bg-green-900/40' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700'}`}><Twitter className="h-5 w-5" /></a>
                <a href="#" className={`p-2 rounded-full transition-colors ${easterEggActive ? 'bg-green-900/20 text-green-600 hover:text-green-400 hover:bg-green-900/40' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700'}`}><Github className="h-5 w-5" /></a>
                <a href="#" className={`p-2 rounded-full transition-colors ${easterEggActive ? 'bg-green-900/20 text-green-600 hover:text-green-400 hover:bg-green-900/40' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700'}`}><Linkedin className="h-5 w-5" /></a>
              </div>
            </div>

            <div>
              <h4 className={`font-bold mb-6 ${easterEggActive ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>Product</h4>
              <ul className="space-y-4 font-medium">
                <li><a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}>AI Generator</a></li>
                <li><a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}>Visual Editor</a></li>
                <li><a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}>Templates</a></li>
                <li><a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}>Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-bold mb-6 ${easterEggActive ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>Resources</h4>
              <ul className="space-y-4 font-medium">
                <li><a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}>Documentation</a></li>
                <li><a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}>Blog</a></li>
                <li><a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}>Community</a></li>
                <li><a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}>Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-bold mb-6 ${easterEggActive ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>Stay Updated</h4>
              <p className={`text-sm mb-4 ${easterEggActive ? 'text-green-700' : 'text-gray-500 dark:text-gray-400'}`}>Subscribe to our newsletter for the latest AI features.</p>
              <form className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className={`border text-sm rounded-lg outline-none block w-full p-2.5 transition-colors ${easterEggActive ? 'bg-black border-green-900 text-green-500 placeholder-green-800 focus:border-green-500' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500'}`}
                />
                <button type="button" className={`font-bold rounded-lg px-4 py-2 text-sm transition-colors shadow-md ${easterEggActive ? 'bg-green-600 text-black hover:bg-green-500' : 'bg-gray-900 dark:bg-white hover:bg-brand-600 dark:hover:bg-brand-500 text-white dark:text-gray-900'}`}>
                  Join
                </button>
              </form>
            </div>

          </div>

          <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${easterEggActive ? 'border-green-900/50' : 'border-gray-200 dark:border-slate-800'}`}>
            <p className={`text-sm font-medium ${easterEggActive ? 'text-green-700' : 'text-gray-500 dark:text-gray-400'}`}>
              &copy; {new Date().getFullYear()} BuildMyFolio Inc. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm font-medium">
              <a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Privacy Policy</a>
              <a href="#" className={`transition-colors ${easterEggActive ? 'text-green-700 hover:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;