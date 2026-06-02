import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  GitPullRequest,
  Users,
  Star,
  ExternalLink,
  Code2,
  Trophy,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ImageFallback from "../ImageFallback";

gsap.registerPlugin(ScrollTrigger);

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

/* ───────────── Floating Particles Background ───────────── */
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      hue: number;
    }[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        hue: Math.random() * 60 + 220,
      });
    }

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
        ctx.fill();
      });

      // connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(240, 60%, 70%, ${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.5 }}
    />
  );
};

/* ───────────── Animated Number Counter ───────────── */
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current || value === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: value,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
              if (ref.current) {
                ref.current.textContent = Math.round(obj.val) + suffix;
              }
            },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

/* ───────────── Contributor Card ───────────── */
const ContributorCard = ({ contributor, index, maxContributions }: { contributor: Contributor; index: number; maxContributions: number }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hasBarAnimated = useRef(false);

  const rankColors = [
    { glow: "rgba(251,191,36,0.3)", badge: "bg-gradient-to-r from-amber-400 to-yellow-500", label: "🥇", borderColor: "rgba(251,191,36,0.4)" },
    { glow: "rgba(148,163,184,0.3)", badge: "bg-gradient-to-r from-slate-300 to-gray-400", label: "🥈", borderColor: "rgba(148,163,184,0.3)" },
    { glow: "rgba(251,146,60,0.25)", badge: "bg-gradient-to-r from-orange-400 to-amber-600", label: "🥉", borderColor: "rgba(251,146,60,0.3)" },
  ];

  const isTop3 = index < 3;
  const rank = isTop3 ? rankColors[index] : null;
  const barWidth = `${Math.min((contributor.contributions / Math.max(maxContributions, 1)) * 100, 100)}%`;

  useEffect(() => {
    if (!barRef.current || hasBarAnimated.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasBarAnimated.current) {
        hasBarAnimated.current = true;
        gsap.to(barRef.current, { width: barWidth, duration: 1.2, ease: "power2.out", delay: 0.3 + index * 0.05 });
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(barRef.current);
    return () => observer.disconnect();
  }, [barWidth, index]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    gsap.to(card, { rotateX, rotateY, duration: 0.3, ease: "power2.out", transformPerspective: 800 });
    gsap.to(glow, { x: x - 100, y: y - 100, opacity: 0.8, duration: 0.3 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    gsap.to(glow, { opacity: 0, duration: 0.4 });
  }, []);

  return (
    <a
      ref={cardRef}
      href={contributor.html_url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col items-center text-center rounded-3xl p-7 will-change-transform"
      style={{
        background: isTop3
          ? `linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.7) 50%, rgba(15,23,42,0.9) 100%)`
          : `linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(20,20,50,0.5) 100%)`,
        border: `1px solid ${isTop3 ? rank!.borderColor : "rgba(148,163,184,0.08)"}`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute w-[200px] h-[200px] rounded-full opacity-0"
        style={{
          background: isTop3 ? `radial-gradient(circle, ${rank!.glow}, transparent 70%)` : "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)",
          filter: "blur(25px)",
        }}
      />

      {isTop3 && (
        <div className={`absolute -top-3 -right-3 ${rank!.badge} text-slate-950 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg z-10`}>
          {rank!.label}
        </div>
      )}

      <div className="relative mb-5" style={{ transform: "translateZ(30px)" }}>
        <div
          className={`absolute inset-[-4px] rounded-full transition-opacity duration-500 ${isTop3 ? "opacity-40 group-hover:opacity-70" : "opacity-0 group-hover:opacity-30"}`}
          style={{ background: isTop3 ? rank!.glow : "rgba(99,102,241,0.4)", filter: "blur(12px)" }}
        />
        <ImageFallback
          src={contributor.avatar_url}
          alt={contributor.login}
          className="relative h-24 w-24 rounded-full object-cover border-2 border-white/10 transition-all duration-500 group-hover:border-white/30 group-hover:scale-110"
        />
        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0c1222]">
          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-1 transition-colors group-hover:text-indigo-300" style={{ transform: "translateZ(20px)" }}>
        @{contributor.login}
      </h3>

      <div className="w-full mt-3 mb-4" style={{ transform: "translateZ(15px)" }}>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Contributions</span>
          <span className="text-indigo-400 font-semibold">{contributor.contributions}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div ref={barRef} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" style={{ width: "0%" }} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 group-hover:text-indigo-400 transition-all duration-300" style={{ transform: "translateZ(10px)" }}>
        <ExternalLink size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        <span>View Profile</span>
      </div>
    </a>
  );
};

const ContributorsComponent = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const response = await fetch("https://api.github.com/repos/ronisarkarexe/story-spark-ai/contributors");
        const data = await response.json();
        if (Array.isArray(data)) {
          setContributors(data.filter((c: Contributor) => c.contributions >= 1));
        }
      } catch (error) {
        console.error("Failed to fetch contributors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContributors();
  }, []);

  const totalPRs = contributors.reduce((acc, c) => acc + c.contributions, 0);
  const maxContributions = contributors.length ? Math.max(...contributors.map((c) => c.contributions)) : 1;

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (heroRef.current) {
        gsap.fromTo(heroRef.current.querySelectorAll(".hero-animate"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out" });
      }
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.querySelectorAll(".stat-card"), { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: statsRef.current, start: "top 90%" } });
      }
      if (gridRef.current) {
        gsap.fromTo(gridRef.current.children, { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: gridRef.current, start: "top 92%" } });
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [loading, contributors]);

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #030712 0%, #0c0a1f 35%, #0f172a 65%, #030712 100%)" }}>
      <ParticleField />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div ref={heroRef} className="text-center mb-20 md:mb-28">
          <div className="hero-animate inline-flex items-center gap-2.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-5 py-2 text-sm text-indigo-300 mb-8">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Open Source Community
          </div>
          <h1 className="hero-animate text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6">
            Meet Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Contributors</span>
          </h1>
          <p className="hero-animate mt-8 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The brilliant minds behind StorySparkAI — building, iterating, and pushing the boundaries of AI-powered storytelling.
          </p>
        </div>

        <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20 md:mb-28">
          {[
            { icon: <Users size={22} />, label: "Contributors", value: contributors.length, suffix: "+", gradient: "from-blue-500 to-cyan-400", iconColor: "text-blue-400" },
            { icon: <GitPullRequest size={22} />, label: "Total Commits", value: totalPRs, suffix: "+", gradient: "from-indigo-500 to-violet-400", iconColor: "text-indigo-400" },
            { icon: <Code2 size={22} />, label: "Repositories", value: 1, suffix: "", gradient: "from-emerald-500 to-teal-400", iconColor: "text-emerald-400" },
            { icon: <Star size={22} />, label: "Community Love", value: 100, suffix: "%", gradient: "from-fuchsia-500 to-pink-400", iconColor: "text-fuchsia-400" },
          ].map((stat, i) => (
            <div key={i} className="stat-card relative rounded-2xl p-6 border border-white/5 bg-white/5 backdrop-blur-xl group overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${stat.iconColor}`}>{stat.icon}</div>
                <p className="text-sm text-slate-500 uppercase tracking-widest font-medium mb-2">{stat.label}</p>
                <p className={`text-4xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Trophy size={24} className="text-amber-400" /> Hall of Fame
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 rounded-3xl animate-pulse bg-white/5 border border-white/5" />
            ))}
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {contributors.map((c, i) => (
              <ContributorCard key={c.login} contributor={c} index={i} maxContributions={maxContributions} />
            ))}
          </div>
        )}

        <div ref={ctaRef} className="mt-24 md:mt-32">
          <div className="relative rounded-[2.5rem] p-10 md:p-14 overflow-hidden text-center border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-slate-900/60">
            <div className="absolute top-6 left-10 w-20 h-20 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="absolute bottom-8 right-14 w-28 h-28 rounded-full bg-purple-500/10 blur-2xl" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-sm text-indigo-300 mb-6">
                <Globe size={14} /> Join the community
              </div>
              <h3 className="text-3xl md:text-5xl font-black text-white mb-5">Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Contribute</span>?</h3>
              <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                Fork the repo, pick an issue, and make your first PR. Every line of code makes a difference.
              </p>
              <a
                href="https://github.com/ronisarkarexe/story-spark-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 hover:scale-105 shadow-xl shadow-indigo-500/20"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}
              >
                <Code2 size={20} className="group-hover:rotate-12 transition-transform" />
                Start Contributing
                <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorsComponent;
