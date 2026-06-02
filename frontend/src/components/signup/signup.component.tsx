import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { WandSparkles, BookOpen, UsersRound } from "lucide-react";
import {
  useEmailVerifyMutation,
  useRegisterUserMutation,
  useVerifyOtpMutation,
} from "../../redux/apis/auth.api";
import SSInput from "../ui-component/ss-input/ss-input";
import SSButton from "../ui-component/ss-button/ss-button";

type Inputs = {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  otp?: string;
};

const PASSWORD_REQUIREMENTS = [
  { label: "8+ characters", key: "length", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", key: "upper", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", key: "lower", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", key: "number", test: (p: string) => /[0-9]/.test(p) },
];

const SignUpComponent = () => {
  const navigate = useNavigate();
  const [showOtpField, setShowOtpField] = useState(false);
  const [registerInfo, setRegisterInfo] = useState<Inputs | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiredAt, setExpiredAt] = useState<number | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Inputs>();
  const password = watch("password", "");

  const [registerUser] = useRegisterUserMutation();
  const [emailVerify] = useEmailVerifyMutation();
  const [verifyOtp] = useVerifyOtpMutation();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const passwordChecks = PASSWORD_REQUIREMENTS.reduce((acc, rule) => {
    acc[rule.key] = rule.test(password);
    return acc;
  }, {} as Record<string, boolean>);

  const strength = Object.values(passwordChecks).filter(Boolean).length;
  const strengthLabel = strength <= 1 ? "Weak" : strength <= 3 ? "Medium" : "Strong";
  const barColor = strength <= 1 ? "bg-red-500" : strength <= 3 ? "bg-yellow-500" : "bg-green-500";
  const barWidth = `w-${(strength / 4) * 100}%`;
  const textColor = strength <= 1 ? "text-red-400" : strength <= 3 ? "text-yellow-400" : "text-green-400";

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    if (isBusy) return;
    setIsBusy(true);

    try {
      if (!showOtpField) {
        if (data.password !== data.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        // Step 1: Request OTP
        const res = await emailVerify({ name: data.name, email: data.email }).unwrap();
        if (res) {
          setRegisterInfo(data);
          setShowOtpField(true);
          if (res.data?.expiresAt) {
            setExpiredAt(new Date(res.data.expiresAt).getTime());
          }
          toast.success(res.message || "OTP sent to your email!");
          setCooldown(60);
        }
      } else {
        if (!data.otp) {
          toast.error("Please enter the OTP");
          return;
        }
        const res = await verifyOtp({
          email: registerInfo?.email || "",
          otp: data.otp,
        }).unwrap();
        if (res && res.verificationToken) {
          const regRes = await registerUser({
            ...registerInfo,
            verificationToken: res.verificationToken
          }).unwrap();
          if (regRes) {
            toast.success("Account created successfully!");
            navigate("/login");
          }
        } else {
          toast.error("Verification failed");
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isBusy || !registerInfo) return;
    setIsBusy(true);
    try {
      const res = await emailVerify({ name: registerInfo.name, email: registerInfo.email }).unwrap();
      if (res?.data) {
        if (res.data.expiresAt) {
          setExpiredAt(new Date(res.data.expiresAt).getTime());
        }
        toast.success("OTP resent successfully!");
        setValue("otp", "");
        setCooldown(60);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-white dark:bg-[#050816] text-slate-900 dark:text-white transition-all duration-300">
      <main className="flex flex-col md:flex-row overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-6xl bg-white dark:bg-[#0b1020]">
        
        {/* Left Side - Branding */}
        <section className="hidden md:flex md:w-[45%] bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-12 group">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                <WandSparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-white font-black tracking-widest text-lg uppercase">StorySpark AI</span>
            </Link>

            <h1 className="text-5xl font-black text-white leading-tight mb-8">
              Turns Ideas into<br />
              <span className="text-indigo-200">unforgettable</span><br />stories.
            </h1>

            <div className="space-y-6">
              {[
                { icon: <WandSparkles className="w-5 h-5" />, title: "Smart Writing", desc: "AI that understands your unique ideas" },
                { icon: <BookOpen className="w-5 h-5" />, title: "Endless Creativity", desc: "Captivating stories from simple prompts" },
                { icon: <UsersRound className="w-5 h-5" />, title: "Built for Everyone", desc: "For writers, creators and dreamers" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="mt-1 text-indigo-300">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <p className="text-indigo-100/70 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8 text-indigo-100/50 text-xs">
            © 2026 StorySpark AI. Powered by next-gen intelligence.
          </div>
        </section>

        {/* Right Side - Form */}
        <section className="w-full md:w-[55%] p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-gray-50 dark:bg-transparent">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
                {showOtpField ? "Verify Your Email" : "Create Account"}
              </h2>
              <p className="text-slate-500 dark:text-gray-400">
                {showOtpField ? "We've sent a 6-digit code to your email." : "Join our community of creative storytellers."}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {!showOtpField ? (
                <>
                  <SSInput label="Full Name" name="name" placeholder="Enter your name" register={register} error={errors.name} required icon="fi fi-rr-user" />
                  <SSInput label="Email Address" name="email" type="email" placeholder="name@example.com" register={register} error={errors.email} required icon="fi fi-rr-envelope" />
                  <div className="space-y-3">
                    <SSInput label="Password" name="password" type="password" placeholder="Create a strong password" register={register} error={errors.password} required icon="fi fi-rr-lock" />
                    {password && (
                      <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                          <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${(strength/4)*100}%` }} />
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>Strength: {strengthLabel}</p>
                      </div>
                    )}
                  </div>
                  <SSInput label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm your password" register={register} error={errors.confirmPassword} required icon="fi fi-rr-lock-check" />
                </>
              ) : (
                <div className="space-y-6">
                  <SSInput label="Verification Code" name="otp" placeholder="Enter 6-digit OTP" register={register} error={errors.otp} required icon="fi fi-rr-key" />
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={handleResendOtp} disabled={cooldown > 0 || isBusy} className={`font-bold transition-colors ${cooldown > 0 ? "text-slate-400 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-500 cursor-pointer"}`}>
                      {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend Code"}
                    </button>
                    {expiredAt && <span className="text-slate-500">Expiring soon</span>}
                  </div>
                </div>
              )}

              <SSButton text={showOtpField ? "Verify & Complete" : "Start Creating ✨"} type="submit" isLoading={isBusy} className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/20" />
            </form>

            {!showOtpField && (
              <p className="mt-10 text-center text-slate-500 dark:text-gray-400 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Sign In</Link>
              </p>
            )}
          </div>
        </section>
      </main>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default SignUpComponent;
