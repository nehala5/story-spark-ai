import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Lock,
  User,
} from "lucide-react";
import { getUserInfo } from "../../../services/auth.service";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getUserInfo();
  const loggedIn = !!user;

  const [name, setName] = useState(user?.name || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  const planName = searchParams.get("plan") || "Pro";
  const planPrice = Number(searchParams.get("price") || "19.99");

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, "").replace(/(.{2})/, "$1/").trim().slice(0, 5);
  };

  const handlePay = async () => {
    setLoading(true);
    const loaded = await loadRazorpayScript();

    if (!loaded) {
      alert("Failed to load Razorpay SDK.");
      setLoading(false);
      return;
    }

    try {
      // Mock order creation for frontend-only stability
      // In a real app, this would be a POST to /api/v1/payment/create-order
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mock",
        amount: Math.round(planPrice * 100),
        currency: "INR",
        name: "StorySparkAI",
        description: `${planName} Subscription`,
        handler: async (response: any) => {
          console.log("Payment Success:", response);
          alert("Payment successful! Welcome to " + planName + ".");
          navigate("/dashboard");
        },
        prefill: {
          name: name,
          email: user?.email || "",
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error(response.error);
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Something went wrong with the payment process.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name.trim() && cardNumber.length >= 16 && expiry.length === 5 && cvv.length === 3;

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-slate-100 sm:px-6 lg:px-8 transition-all duration-500">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* Payment Section */}
          <section className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-8">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
                <ShieldCheck size={14} /> Secure checkout
              </span>
              <h1 className="text-4xl font-black tracking-tight text-white mb-4 leading-none">
                Upgrade to {planName}
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md font-medium">
                Unlock professional AI tools and priority features with our secure payment partner.
              </p>
            </div>

            {/* Selected Plan Summary */}
            <div className="mb-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Active Selection</p>
                <h2 className="text-xl font-bold text-white">{planName} Plan</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-indigo-400">₹{planPrice}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">per month</p>
              </div>
            </div>

            {loggedIn && (
              <div className="mb-8 flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Verified</p>
                  <p className="text-sm font-bold text-white">{user?.email}</p>
                </div>
              </div>
            )}

            {!loggedIn ? (
              <div className="space-y-8 py-10 text-center">
                <div className="mx-auto w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                  <Lock size={32} className="text-indigo-400" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black">Hold on!</h2>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    You must be logged in to link this subscription to your profile. It only takes a second.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <button onClick={() => navigate("/login")} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                    Log In
                  </button>
                  <button onClick={() => navigate("/signup")} className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all active:scale-95">
                    Create Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-4 bg-[#0a0f1d] border border-white/10 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="w-full pl-12 pr-5 py-4 bg-[#0a0f1d] border border-white/10 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all text-sm font-mono tracking-widest"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        className="w-full px-5 py-4 bg-[#0a0f1d] border border-white/10 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        className="w-full px-5 py-4 bg-[#0a0f1d] border border-white/10 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  disabled={loading || !isFormValid}
                  className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/25 active:scale-[0.98] mt-4 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <>
                      <span>Pay ₹{planPrice} Total</span>
                      <i className="fas fa-arrow-right text-xs opacity-50"></i>
                    </>
                  )}
                </button>
              </div>
            )}

            <Link to="/pricing" className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">
              <ArrowLeft size={14} /> Back to Pricing
            </Link>
          </section>

          {/* Benefits summary */}
          <aside className="lg:mt-0 mt-8 space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-xl h-full">
              <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={16} />
                </div>
                Membership Perks
              </h3>
              
              <ul className="space-y-6">
                {[
                  { title: "Infinite Words", desc: "No monthly limits on story generation." },
                  { title: "Priority Queue", desc: "Your requests process first during peak hours." },
                  { title: "Cloud Storage", desc: "All your drafts and chapters synced everywhere." },
                  { title: "Custom Models", desc: "Access to advanced fine-tuned creative models." }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 text-emerald-500"><CheckCircle2 size={14} /></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5 font-medium">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-12 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-xs font-bold text-indigo-300 mb-2">Billing Policy</p>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Cancel anytime. Subscriptions are billed monthly. By clicking "Pay Now" you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PaymentComponent;
