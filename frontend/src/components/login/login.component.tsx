import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import {
  useLoginUserMutation,
  useGoogleLoginMutation,
} from "../../redux/apis/auth.api";
import { storeUserInfo } from "../../services/auth.service";
import SSInput from "../ui-component/ss-input/ss-input";
import SSButton from "../ui-component/ss-button/ss-button";
import { WandSparkles, BookOpen, UsersRound } from "lucide-react";

type Inputs = {
  email: string;
  password: string;
};

const LoginComponent = () => {
  const navigate = useNavigate();
  const [isBusy, setIsBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>();

  const [loginUser] = useLoginUserMutation();
  const [socialLogin] = useGoogleLoginMutation();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const res = await loginUser(data).unwrap();
      if (res?.data) {
        storeUserInfo(res.data);
        toast.success("Welcome back to StorySpark AI!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Invalid email or password");
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogleLoginSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    setIsBusy(true);
    try {
      const decoded: any = jwtDecode(response.credential);
      const res = await socialLogin({
        name: decoded.name,
        email: decoded.email,
        profileImage: decoded.picture,
      }).unwrap();
      if (res?.data) {
        storeUserInfo(res.data);
        toast.success("Signed in with Google!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error("Google login failed");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-white dark:bg-[#050816] text-slate-900 dark:text-white transition-all duration-300">
      <main className="flex flex-col md:flex-row overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-6xl bg-white dark:bg-[#0b1020]">
        
        {/* Left Side - Branding */}
        <section className="hidden md:flex md:w-[45%] bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-12 group">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                <WandSparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-white font-black tracking-widest text-lg uppercase">StorySpark AI</span>
            </Link>

            <h1 className="text-5xl font-black text-white leading-tight mb-8">
              Welcome back to<br />
              <span className="text-blue-200">Infinite</span><br />Stories.
            </h1>

            <div className="space-y-6">
              {[
                { icon: <WandSparkles className="w-5 h-5" />, title: "Resume Writing", desc: "Pick up exactly where you left off" },
                { icon: <BookOpen className="w-5 h-5" />, title: "Explore Community", desc: "See what others have created lately" },
                { icon: <UsersRound className="w-5 h-5" />, title: "Collaborate", desc: "Join forces with other storytellers" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="mt-1 text-blue-300">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <p className="text-blue-100/70 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8 text-blue-100/50 text-xs">
            © 2026 StorySpark AI. Your creative portal.
          </div>
        </section>

        {/* Right Side - Form */}
        <section className="w-full md:w-[55%] p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-gray-50 dark:bg-transparent">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
                Sign In
              </h2>
              <p className="text-slate-500 dark:text-gray-400">
                Enter your credentials to access your creative studio.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <SSInput label="Email Address" name="email" type="email" placeholder="name@example.com" register={register} error={errors.email} required icon="fi fi-rr-envelope" />
              <div className="space-y-1">
                <SSInput label="Password" name="password" type="password" placeholder="••••••••" register={register} error={errors.password} required icon="fi fi-rr-lock" />
                <div className="flex justify-end">
                  <Link to="/forgot-password" size-sm className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Forgot Password?</Link>
                </div>
              </div>

              <SSButton text="Sign In ✨" type="submit" isLoading={isBusy} className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/20" />
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Or continue with</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={() => toast.error("Google Sign-In failed")} theme="filled_blue" shape="pill" />
            </div>

            <p className="mt-10 text-center text-slate-500 dark:text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Create Account</Link>
            </p>
          </div>
        </section>
      </main>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default LoginComponent;
