import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { CreditCard, CheckCircle, Loader2, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';

const Upgrade = () => {
  const { user, updatePlan } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Get plan from state or default to Pro
  const selectedPlan = location.state?.plan || {
    name: 'Pro',
    basePrice: 15,
    desc: 'Ideal for freelancers and creators building multiple sites.',
    features: ['Unlimited Websites', 'AI JavaScript Generation', 'Premium Dark/Light Themes']
  };

  const [billingCycle] = useState(location.state?.billingCycle || 'monthly');
  const [pricingGeo, setPricingGeo] = useState({ currency: 'USD', symbol: '$', rate: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form states
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    const fallbackTimezoneCheck = () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Asia/Calcutta' || tz === 'Asia/Kolkata') {
        setPricingGeo({ currency: 'INR', symbol: '₹', rate: 83 });
      } else if (tz.startsWith('Europe/')) {
        setPricingGeo({ currency: 'EUR', symbol: '€', rate: 0.92 });
      } else {
        setPricingGeo({ currency: 'USD', symbol: '$', rate: 1 });
      }
    };

    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const currencyMap = {
          'USD': { symbol: '$', rate: 1 },
          'INR': { symbol: '₹', rate: 83 },
          'EUR': { symbol: '€', rate: 0.92 },
          'GBP': { symbol: '£', rate: 0.78 },
          'AUD': { symbol: 'A$', rate: 1.52 },
          'CAD': { symbol: 'C$', rate: 1.35 },
        };
        if (data.currency && currencyMap[data.currency]) {
          setPricingGeo({ currency: data.currency, ...currencyMap[data.currency] });
        } else {
          fallbackTimezoneCheck();
        }
      } catch (error) {
        fallbackTimezoneCheck();
      }
    };
    detectLocation();
  }, []);

  const calculatePrice = (basePriceUsd) => {
    if (basePriceUsd === 0) return 0;
    const price = basePriceUsd * pricingGeo.rate;
    let finalPrice = pricingGeo.currency === 'INR' ? Math.ceil(price / 10) * 10 - 1 : Math.round(price);
    
    // Apply discount for annual billing
    if (billingCycle === 'yearly') {
      finalPrice = Math.round(finalPrice * 0.8);
    }
    return finalPrice;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      alert("Please fill in all payment details.");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate Stripe/Gateway handshakes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await api.post('/payments/checkout', { planName: selectedPlan.name });
      
      // Update JWT token and user plan globally
      updatePlan(response.data.updatedPlan, response.data.token);
      
      setPaymentSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      alert("Payment processing failed. Please ensure the backend server is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Format card inputs
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s?/g, '').replace(/[^0-9]/gi, '');
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length >= 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
    } else {
      setCardExpiry(value);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center max-w-md p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl text-center border border-gray-100 dark:border-slate-800 animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Upgrade Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Welcome to the <span className="text-brand-500 font-bold">{selectedPlan.name}</span> tier. Preparing your premium workspace...
          </p>
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to pricing
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300 grid grid-cols-1 md:grid-cols-12">
          
          {/* Order Summary (Left Column) */}
          <div className="md:col-span-5 bg-gray-50 dark:bg-slate-800/40 p-8 sm:p-10 border-r border-gray-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-6">
                Order Summary
              </span>
              
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                {selectedPlan.name} Tier
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                {selectedPlan.desc}
              </p>

              {/* Pricing Display */}
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {pricingGeo.symbol}{calculatePrice(selectedPlan.basePrice)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase">
                  / {billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Included Features</h4>
                <ul className="space-y-3">
                  {selectedPlan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-5 w-5 text-brand-500 flex-shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Secure Badging */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-6 mt-8 space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
                <ShieldCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                SSL Encrypted & Secure Payments
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
                <HelpCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                Need help? Contact support@buildmyfolio.com
              </div>
            </div>
          </div>

          {/* Payment Details Form (Right Column) */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-brand-500" /> Payment Details
            </h3>

            <form onSubmit={handlePayment} className="space-y-5">
              
              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input 
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    maxLength="19"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500 font-medium"
                  />
                  <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Expiry & CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Expiration Date
                  </label>
                  <input 
                    type="text"
                    required
                    maxLength="5"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500 font-medium text-center"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    CVC / CVV
                  </label>
                  <input 
                    type="password"
                    required
                    maxLength="4"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/gi, ''))}
                    placeholder="•••"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500 font-medium text-center"
                  />
                </div>
              </div>

              {/* Complete Purchase Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-6 py-4 rounded-xl text-white bg-gray-900 dark:bg-brand-600 hover:bg-brand-600 dark:hover:bg-brand-500 font-bold text-lg disabled:opacity-80 transition-all hover:-translate-y-0.5 flex justify-center items-center gap-3 shadow-lg shadow-brand-500/10"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-brand-300" />
                    Processing Payment...
                  </>
                ) : (
                  `Upgrade to ${selectedPlan.name}`
                )}
              </button>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy. Your subscription will auto-renew at the end of each billing cycle.
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Upgrade;
