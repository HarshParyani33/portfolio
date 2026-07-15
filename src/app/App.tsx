import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { motion } from "motion/react";
import { toast, Toaster } from "sonner";
import {
  Moon, Sun, Github, Linkedin, Mail, Phone, ArrowUp,
  Code2, Layers, Cpu, Wrench, ExternalLink,
  Award, GraduationCap, ChevronRight, Zap,
  BadgeCheck, Send, User, Building2, MessageSquare,
} from "lucide-react";

// ─── Theme context ─────────────────────────────────────────────────────────────
const DarkCtx = createContext(true);
const useIsDark = () => useContext(DarkCtx);

const CYAN = "#00E5FF";
const CYAN_ALPHA = (a: number) => `rgba(0,229,255,${a})`;

// ─── Shared cursor hue ref (trail + dot stay in sync) ─────────────────────────
const cursorHue = { current: 180 };

// ─── Cursor trail canvas ───────────────────────────────────────────────────────
function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trail = useRef<Array<{ x: number; y: number; t: number; hue: number }>>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      cursorHue.current = (cursorHue.current + 2.2) % 360;
      trail.current.push({ x: e.clientX, y: e.clientY, t: Date.now(), hue: cursorHue.current });
    };
    window.addEventListener("mousemove", onMove);

    const DURATION = 520;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();
      trail.current = trail.current.filter(p => now - p.t < DURATION);

      trail.current.forEach((p, i) => {
        const age = now - p.t;
        const progress = 1 - age / DURATION;

        // Distortion: sinusoidal wobble grows as the point ages
        const wobble = (1 - progress) * 10;
        const seed = p.t * 0.003 + i * 0.9;
        const wx = p.x + Math.sin(seed) * wobble;
        const wy = p.y + Math.cos(seed * 1.4) * wobble;

        const radius = (2 + progress * 4.5) * progress;
        const alpha = progress * 0.75;

        // Outer glow
        const grd = ctx.createRadialGradient(wx, wy, 0, wx, wy, radius * 2.8);
        grd.addColorStop(0, `hsla(${p.hue}, 100%, 68%, ${alpha * 0.6})`);
        grd.addColorStop(1, `hsla(${p.hue}, 100%, 68%, 0)`);
        ctx.beginPath();
        ctx.arc(wx, wy, radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(wx, wy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 72%, ${alpha})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99997, width: "100%", height: "100%" }}
    />
  );
}

// ─── Custom cursor — hue-cycling dot ──────────────────────────────────────────
function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [expanded, setExpanded] = useState(false);
  const [hue, setHue] = useState(180);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Gently animate hue even when mouse is still
  useEffect(() => {
    const tick = () => {
      cursorHue.current = (cursorHue.current + 0.35) % 360;
      setHue(cursorHue.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const enter = () => setExpanded(true);
    const leave = () => setExpanded(false);
    const attach = () => {
      document.querySelectorAll("a,button,[data-hover]").forEach(el => {
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
      });
    };
    attach();
    const obs = new MutationObserver(attach);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.querySelectorAll("a,button,[data-hover]").forEach(el => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
      obs.disconnect();
    };
  }, []);

  const color = `hsl(${hue}, 100%, 65%)`;

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: expanded ? 34 : 10,
        height: expanded ? 34 : 10,
        borderRadius: "50%",
        background: expanded ? "transparent" : color,
        border: expanded ? `1.5px solid ${color}` : "none",
        boxShadow: `0 0 ${expanded ? 18 : 10}px ${color}99, 0 0 ${expanded ? 36 : 18}px ${color}44`,
        transform: "translate(-50%,-50%)",
        transition: "width 0.2s ease, height 0.2s ease",
        pointerEvents: "none",
        zIndex: 99999,
      }}
    />
  );
}

// ─── Page loader ───────────────────────────────────────────────────────────────
const BOOT = [
  "$ initializing portfolio_v2.0...",
  "$ loading modules.................. [✓]",
  "$ compiling react components........ [✓]",
  "$ connecting to gemini api.......... [✓]",
  "$ boot sequence complete.",
  "  welcome // harsh.dev",
];

function PageLoader({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    let i = 0;
    const tick = () => {
      if (i < BOOT.length) {
        const line = BOOT[i++];
        setLines(p => [...p, line]);
        setTimeout(tick, i === BOOT.length ? 700 : 260);
      } else {
        setTimeout(() => {
          setFade(true);
          setTimeout(onComplete, 750);
        }, 150);
      }
    };
    setTimeout(tick, 280);
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998, background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: fade ? 0 : 1,
        transition: "opacity 0.75s cubic-bezier(.4,0,.2,1)",
        pointerEvents: fade ? "none" : "all",
      }}
    >
      <style>{`
        @keyframes bootIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes bootBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, maxWidth: 500, width: "100%", padding: "0 40px" }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: line.startsWith("  welcome") ? CYAN : "rgba(0,229,255,0.8)",
              fontWeight: line.startsWith("  welcome") ? 600 : 400,
              lineHeight: "2.1",
              animation: "bootIn 0.22s ease both",
              fontSize: line.startsWith("  welcome") ? 15 : 13,
            }}
          >
            {line}
          </div>
        ))}
        {!fade && (
          <span style={{ display: "inline-block", width: 8, height: 14, background: CYAN, marginLeft: 2, animation: "bootBlink 0.9s step-end infinite" }} />
        )}
      </div>
    </div>
  );
}

// ─── Particle canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const isDark = useIsDark();
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const S = 58;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const onM = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onM);
    let t = 0;
    const draw = () => {
      t += 0.0065;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width / S) + 2;
      const rows = Math.ceil(canvas.height / S) + 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ph = (r * 7 + c * 5) * 0.28;
          const ox = c * S, oy = r * S;
          const wx = ox + Math.sin(t + ph) * 5.5;
          const wy = oy + Math.cos(t + ph * 1.18) * 5.5;
          const dist = Math.hypot(wx - mouse.current.x, wy - mouse.current.y);
          const glow = Math.max(0, 1 - dist / 175);
          const drawEdge = (nx: number, ny: number) => {
            const mg = Math.max(0, 1 - Math.hypot((wx + nx) / 2 - mouse.current.x, (wy + ny) / 2 - mouse.current.y) / 175);
            ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(nx, ny);
            ctx.strokeStyle = `rgba(0,229,255,${0.045 + mg * 0.26})`;
            ctx.lineWidth = 0.45 + mg * 1.2; ctx.stroke();
          };
          if (c < cols - 1) {
            const nph = (r * 7 + (c + 1) * 5) * 0.28;
            drawEdge((c + 1) * S + Math.sin(t + nph) * 5.5, oy + Math.cos(t + nph * 1.18) * 5.5);
          }
          if (r < rows - 1) {
            const nph = ((r + 1) * 7 + c * 5) * 0.28;
            drawEdge(ox + Math.sin(t + nph) * 5.5, (r + 1) * S + Math.cos(t + nph * 1.18) * 5.5);
          }
          ctx.beginPath(); ctx.arc(wx, wy, 1.2 + glow * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,229,255,${0.1 + glow * 0.85})`; ctx.fill();
        }
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onM);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: isDark ? 0.6 : 0.22 }}
    />
  );
}

// ─── Magnetic button ───────────────────────────────────────────────────────────
interface MagBtnProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  target?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}
function MagBtn({ children, className, style, onClick, href, target, type = "button", disabled }: MagBtnProps) {
  const ref = useRef<HTMLElement>(null);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const onMove = (e: React.MouseEvent) => {
    if (disabled) return;
    const r = ref.current!.getBoundingClientRect();
    setTx((e.clientX - (r.left + r.width / 2)) * 0.3);
    setTy((e.clientY - (r.top + r.height / 2)) * 0.3);
  };
  const onLeave = () => { setTx(0); setTy(0); };
  const s: React.CSSProperties = {
    ...style,
    transform: `translate(${tx}px,${ty}px)`,
    transition: tx === 0 ? "transform 0.5s cubic-bezier(.23,1,.32,1)" : "transform 0.08s ease",
    display: "inline-flex", alignItems: "center",
    opacity: disabled ? 0.5 : 1,
  };
  if (href) return (
    <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={className} style={s} onMouseMove={onMove} onMouseLeave={onLeave} data-hover>
      {children}
    </a>
  );
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type={type} className={className} style={s}
      onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} disabled={disabled} data-hover>
      {children}
    </button>
  );
}

// ─── Spotlight card ────────────────────────────────────────────────────────────
function SpotCard({ children, className, style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 0, y: 0, on: false });
  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`} style={style}
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect();
        setSpot({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
      }}
      onMouseLeave={() => setSpot(s => ({ ...s, on: false }))}
    >
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(380px circle at ${spot.x}px ${spot.y}px, ${CYAN_ALPHA(0.09)}, transparent 60%)`,
        opacity: spot.on ? 1 : 0, transition: "opacity 0.4s ease", zIndex: 0,
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── Scroll reveal ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold: 0.07 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(26px)",
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s cubic-bezier(.16,1,.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function Counter({ end, label, suffix = "" }: { end: number; label: string; suffix?: string }) {
  const isDark = useIsDark();
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  const muted = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)";
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const timer = setInterval(() => {
        start += 16;
        const p = Math.min(start / 1800, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * end));
        if (p === 1) clearInterval(timer);
      }, 16);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-family-mono)", fontSize: 28, fontWeight: 700, color: CYAN, lineHeight: 1 }}>
        {val.toLocaleString()}{suffix}
      </div>
      <div style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: muted, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}

// ─── Console / REPL intro snippet ─────────────────────────────────────────────
type ConsoleLine =
  | { kind: "comment"; text: string }
  | { kind: "blank" }
  | { kind: "input"; tokens: { c: string; t: string }[] }
  | { kind: "output"; tokens: { c: string; t: string }[] };

const CONSOLE_LINES: ConsoleLine[] = [
  { kind: "comment", text: "// harsh.dev — open session" },
  { kind: "blank" },
  { kind: "input", tokens: [
    { c: "#ff79c6", t: "const " }, { c: "#f8f8f2", t: "dev" }, { c: "#f8f8f2", t: " = {" },
  ]},
  { kind: "input", tokens: [
    { c: "transparent", t: "  " }, { c: "#bd93f9", t: "name" },
    { c: "#f8f8f2", t: ":   " }, { c: CYAN, t: '"Harsh Paryani"' }, { c: "#f8f8f2", t: "," },
  ]},
  { kind: "input", tokens: [
    { c: "transparent", t: "  " }, { c: "#bd93f9", t: "status" },
    { c: "#f8f8f2", t: ": " }, { c: CYAN, t: '"open_to_work"' },
    { c: "rgba(255,255,255,0.28)", t: "  // 🟢 actively hiring" },
  ]},
  { kind: "input", tokens: [
    { c: "transparent", t: "  " }, { c: "#bd93f9", t: "roles" },
    { c: "#f8f8f2", t: ":  " },
    { c: "#f1fa8c", t: '["Fullstack Dev", "Freelancer"]' }, { c: "#f8f8f2", t: "," },
  ]},
  { kind: "input", tokens: [
    { c: "transparent", t: "  " }, { c: "#bd93f9", t: "stack" },
    { c: "#f8f8f2", t: ":  " },
    { c: "#f1fa8c", t: '["MERN", "TypeScript", "AI APIs"]' },
  ]},
  { kind: "input", tokens: [{ c: "#f8f8f2", t: "};" }] },
  { kind: "blank" },
  { kind: "input", tokens: [
    { c: "#50fa7b", t: "console" }, { c: "#f8f8f2", t: "." }, { c: "#50fa7b", t: "log" },
    { c: "#f8f8f2", t: "(" }, { c: "#f8f8f2", t: "dev." }, { c: "#bd93f9", t: "status" },
    { c: "#f8f8f2", t: ");" },
  ]},
  { kind: "output", tokens: [{ c: CYAN, t: '"open_to_work"' }, { c: "#50fa7b", t: "  ✓" }] },
  { kind: "blank" },
  { kind: "input", tokens: [
    { c: "#50fa7b", t: "hire" }, { c: "#f8f8f2", t: "(" }, { c: "#f8f8f2", t: "dev" },
    { c: "#f8f8f2", t: ");" },
  ]},
  { kind: "output", tokens: [{ c: "#50fa7b", t: "→ connecting... done" }, { c: CYAN, t: "  ✓" }] },
];

function CodeSnippet() {
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(16px)", fontFamily: "var(--font-family-mono)", fontSize: 12,
    }}>
      {/* Window chrome */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {["#ff5f57","#febc2e","#28c840"].map(c => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, display: "inline-block" }} />
        ))}
        <span style={{ marginLeft: 10, color: "rgba(255,255,255,0.22)", fontSize: 11 }}>harsh.dev — console</span>
        <span style={{ marginLeft: "auto", width: 7, height: 14, background: CYAN, animation: "bootBlink 1s step-end infinite", display: "inline-block" }} />
      </div>
      {/* Lines */}
      <div style={{ padding: "14px 16px", lineHeight: "1.85" }}>
        {CONSOLE_LINES.map((line, i) => {
          if (line.kind === "blank") return <div key={i} style={{ height: 6 }} />;
          if (line.kind === "comment") return (
            <div key={i} style={{ color: "rgba(255,255,255,0.2)", paddingLeft: 20 }}>{line.text}</div>
          );
          const isOutput = line.kind === "output";
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", whiteSpace: "pre" }}>
              <span style={{
                userSelect: "none", width: 16, marginRight: 6, flexShrink: 0,
                color: isOutput ? "rgba(255,255,255,0.18)" : CYAN_ALPHA(0.8),
                fontWeight: isOutput ? 400 : 700,
                fontSize: isOutput ? 9 : 13,
              }}>
                {isOutput ? "◀" : "›"}
              </span>
              <span>
                {line.tokens.map((tok, j) => (
                  <span key={j} style={{ color: tok.c }}>{tok.t}</span>
                ))}
              </span>
            </div>
          );
        })}
        {/* Blinking caret on last line */}
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 2 }}>
          <span style={{ color: CYAN_ALPHA(0.8), fontWeight: 700, fontSize: 13, marginRight: 6 }}>›</span>
          <span style={{ display: "inline-block", width: 7, height: 13, background: CYAN, animation: "bootBlink 1s step-end infinite" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Section tag ───────────────────────────────────────────────────────────────
function SectionTag({ text }: { text: string }) {
  return (
    <Reveal>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        fontFamily: "var(--font-family-mono)", fontSize: 11,
        letterSpacing: "0.1em", textTransform: "uppercase",
        padding: "6px 14px", borderRadius: 9999, marginBottom: 18,
        border: `1px solid ${CYAN_ALPHA(0.3)}`,
        background: CYAN_ALPHA(0.05), color: CYAN_ALPHA(0.9),
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: CYAN, animation: "bootBlink 2s ease infinite" }} />
        {text}
      </span>
    </Reveal>
  );
}

// ─── Skill card ────────────────────────────────────────────────────────────────
function SkillCard({ title, icon: Icon, techs }: {
  title: string; icon: React.ComponentType<{ size?: number }>; techs: string[];
}) {
  const isDark = useIsDark();
  const [hov, setHov] = useState(false);
  const fg = isDark ? "#fff" : "#0a0a0a";
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const cardBg = isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)";
  const border = hov ? CYAN_ALPHA(0.38) : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)");
  return (
    <SpotCard className="rounded-2xl p-6 cursor-default h-full"
      style={{ background: cardBg, border: `1px solid ${border}`, transition: "border-color 0.3s, box-shadow 0.3s", boxShadow: hov ? `0 0 32px ${CYAN_ALPHA(0.08)}` : "none" }}
    >
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            background: hov ? CYAN_ALPHA(0.15) : "rgba(255,255,255,0.05)", transition: "background 0.3s",
          }}>
            <Icon size={16} style={{ color: hov ? CYAN : muted, transition: "color 0.3s" }} />
          </div>
          <span style={{ fontFamily: "var(--font-family-mono)", fontSize: 13, fontWeight: 500, color: fg }}>{title}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {techs.map((tech, i) => (
            <span key={tech} style={{
              fontFamily: "var(--font-family-mono)", fontSize: 11, padding: "4px 10px", borderRadius: 6,
              border: `1px solid ${hov ? CYAN_ALPHA(0.32) : (isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)")}`,
              color: hov ? "#00d8f5" : muted,
              background: hov ? CYAN_ALPHA(0.06) : "transparent",
              transition: `all 0.2s ease ${i * 28}ms`,
            }}>{tech}</span>
          ))}
        </div>
      </div>
    </SpotCard>
  );
}

// ─── Project card ──────────────────────────────────────────────────────────────
function ProjectCard({ title, description, details, techs, liveUrl, githubUrl, gradient, badge }: {
  title: string; description: string; details: string;
  techs: string[]; liveUrl?: string; githubUrl?: string;
  gradient: string; badge?: string;
}) {
  const isDark = useIsDark();
  const [hov, setHov] = useState(false);
  const [spot, setSpot] = useState({ x: 0, y: 0, on: false });
  const ref = useRef<HTMLDivElement>(null);
  const fg = isDark ? "#fff" : "#0a0a0a";
  const muted = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const dimmed = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.3)";
  const cardBorder = hov ? CYAN_ALPHA(0.32) : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)");
  return (
    <div ref={ref}
      style={{
        borderRadius: 20, overflow: "hidden", position: "relative",
        border: `1px solid ${cardBorder}`, background: isDark ? "#090909" : "#fafafa",
        boxShadow: hov ? `0 24px 64px ${CYAN_ALPHA(0.08)}` : "none",
        transition: "border-color 0.4s, box-shadow 0.4s", cursor: "default",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setSpot(s => ({ ...s, on: false })); }}
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect();
        setSpot({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
      }}
    >
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10,
        background: `radial-gradient(420px circle at ${spot.x}px ${spot.y}px, ${CYAN_ALPHA(0.07)}, transparent 60%)`,
        opacity: spot.on ? 1 : 0, transition: "opacity 0.3s ease",
      }} />
      <div className={gradient} style={{
        height: 180, display: "flex", alignItems: "flex-end", padding: "20px 24px",
        transform: hov ? "scale(1.04)" : "scale(1)", transformOrigin: "center",
        transition: "transform 0.5s cubic-bezier(.23,1,.32,1)",
      }}>
        <span style={{ fontFamily: "var(--font-family-mono)", fontWeight: 900, fontSize: 52, lineHeight: 1, color: "rgba(255,255,255,0.07)", userSelect: "none" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "24px 24px 28px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {badge && (
            <span style={{
              fontFamily: "var(--font-family-mono)", fontSize: 10, padding: "3px 9px", borderRadius: 5,
              background: CYAN_ALPHA(0.12), border: `1px solid ${CYAN_ALPHA(0.28)}`, color: CYAN,
              letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
            }}>{badge}</span>
          )}
          <h3 style={{ fontFamily: "var(--font-family-mono)", fontSize: 18, fontWeight: 600, color: fg }}>{title}</h3>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 8, color: muted }}>{description}</p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 18, color: dimmed }}>{details}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 22 }}>
          {techs.map(t => (
            <span key={t} style={{
              fontFamily: "var(--font-family-mono)", fontSize: 11, padding: "3px 9px", borderRadius: 6,
              background: isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.035)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, color: dimmed,
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {liveUrl && (
            <MagBtn href={liveUrl} target="_blank"
              style={{ gap: 6, padding: "8px 16px", borderRadius: 10, background: CYAN, color: "#000", fontSize: 12, fontFamily: "var(--font-family-mono)", fontWeight: 600 }}>
              <ExternalLink size={11} /> Live Demo
            </MagBtn>
          )}
          {githubUrl && (
            <MagBtn href={githubUrl} target="_blank"
              style={{ gap: 6, padding: "8px 16px", borderRadius: 10, border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)"}`, color: muted, fontSize: 12, fontFamily: "var(--font-family-mono)" }}>
              <Github size={11} /> GitHub
            </MagBtn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline item ─────────────────────────────────────────────────────────────
function TimelineItem({ date, title, subtitle, description, icon: Icon, idx }: {
  date: string; title: string; subtitle?: string; description?: string;
  icon: React.ComponentType<{ size?: number }>; idx: number;
}) {
  const isDark = useIsDark();
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const fg = isDark ? "#fff" : "#0a0a0a";
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const dimmed = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.28)";
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      position: "relative", paddingLeft: 52, paddingBottom: 36,
      opacity: on ? 1 : 0,
      transform: on ? "none" : "translateX(-18px)",
      transition: `opacity 0.65s ease ${idx * 0.09}s, transform 0.65s cubic-bezier(.16,1,.3,1) ${idx * 0.09}s`,
    }}>
      <div style={{
        position: "absolute", left: 0, top: 2, width: 34, height: 34, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${on ? CYAN : (isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)")}`,
        background: on ? CYAN_ALPHA(0.12) : "transparent",
        boxShadow: on ? `0 0 18px ${CYAN_ALPHA(0.35)}` : "none",
        transition: "all 0.7s ease",
      }}>
        <Icon size={13} style={{ color: on ? CYAN : muted, transition: "color 0.6s" }} />
      </div>
      <div style={{
        position: "absolute", left: 16, top: 36, bottom: 0, width: 1,
        background: `linear-gradient(to bottom, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}, transparent)`,
      }} />
      <div>
        <span style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: CYAN_ALPHA(0.72) }}>{date}</span>
        <h4 style={{ fontFamily: "var(--font-family-mono)", fontSize: 14, fontWeight: 600, color: fg, marginTop: 3 }}>{title}</h4>
        {subtitle && <p style={{ fontSize: 13, color: muted, marginTop: 2 }}>{subtitle}</p>}
        {description && <p style={{ fontSize: 12, color: dimmed, marginTop: 6, lineHeight: 1.65 }}>{description}</p>}
      </div>
    </div>
  );
}

// ─── Certificate card ──────────────────────────────────────────────────────────
interface CertData {
  title: string; issuer: string; platform: string;
  year: string; accentColor: string; letter: string; verifyUrl?: string;
}
function CertCard({ cert, idx }: { cert: CertData; idx: number }) {
  const isDark = useIsDark();
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [hov, setHov] = useState(false);
  const [spot, setSpot] = useState({ x: 0, y: 0, active: false });
  const fg = isDark ? "#fff" : "#0a0a0a";
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const cardBg = isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)";
  const borderCol = hov ? CYAN_ALPHA(0.36) : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(20px)",
        transition: `opacity 0.6s ease ${idx * 0.1}s, transform 0.6s cubic-bezier(.16,1,.3,1) ${idx * 0.1}s`,
      }}
    >
      <div
        style={{
          position: "relative", overflow: "hidden", borderRadius: 18,
          border: `1px solid ${borderCol}`, background: cardBg,
          boxShadow: hov ? `0 0 30px ${CYAN_ALPHA(0.07)}` : "none",
          transition: "border-color 0.3s, box-shadow 0.3s", cursor: "default",
          padding: "24px",
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => { setHov(false); setSpot(s => ({ ...s, active: false })); }}
        onMouseMove={e => {
          const r = ref.current!.getBoundingClientRect();
          setSpot({ x: e.clientX - r.left, y: e.clientY - r.top, active: true });
        }}
      >
        {/* Spotlight */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(300px circle at ${spot.x}px ${spot.y}px, ${CYAN_ALPHA(0.08)}, transparent 60%)`,
          opacity: spot.active ? 1 : 0, transition: "opacity 0.3s",
        }} />

        {/* Issuer badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${cert.accentColor}18`,
            border: `1px solid ${cert.accentColor}33`,
          }}>
            <span style={{
              fontFamily: "var(--font-family-mono)", fontSize: 18, fontWeight: 800,
              color: cert.accentColor,
            }}>{cert.letter}</span>
          </div>
          <BadgeCheck size={18} style={{ color: CYAN_ALPHA(0.6) }} />
        </div>

        {/* Content */}
        <h4 style={{ fontFamily: "var(--font-family-mono)", fontSize: 14, fontWeight: 600, color: fg, marginBottom: 8, lineHeight: 1.4 }}>
          {cert.title}
        </h4>
        <p style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{cert.issuer}</p>
        <p style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", marginBottom: 18 }}>
          {cert.platform} · {cert.year}
        </p>

        {/* Accent line */}
        <div style={{
          height: 2, borderRadius: 1, marginBottom: 18,
          background: `linear-gradient(to right, ${cert.accentColor}55, transparent)`,
        }} />

        {cert.verifyUrl && (
          <MagBtn
            href={cert.verifyUrl}
            target="_blank"
            style={{
              gap: 5, fontFamily: "var(--font-family-mono)", fontSize: 11,
              color: CYAN_ALPHA(0.8), background: "none", border: "none",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={11} /> Verify Certificate
          </MagBtn>
        )}
      </div>
    </div>
  );
}

// ─── Contact / message form ─────────────────────────────────────────────────────
function ContactSection() {
  const isDark = useIsDark();
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sending, setSending] = useState(false);

  const fg = isDark ? "#fff" : "#0a0a0a";
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const cardBg = isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const labelColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    background: inputBg, border: `1px solid ${inputBorder}`,
    color: fg, fontSize: 14, fontFamily: "var(--font-family-sans)",
    outline: "none", transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setSending(true);
    
    const subject = `Opportunity for Harsh Paryani${form.company ? ` — ${form.company}` : ""}`;
    const body = [
      `Hi Harsh,`,
      ``,
      `My name is ${form.name}${form.company ? ` from ${form.company}` : ""}.`,
      ``,
      form.message,
      ``,
      `Best regards,`,
      `${form.name}`,
      `${form.email}`,
    ].join("\n");
    
    // Reroute to Gmail Web Client instead of default mail app
    const targetEmail = "harshparyani68@gmail.com";
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    
    setTimeout(() => {
      setSending(false);
      toast.success("Gmail opened! Your message is ready to send.", {
        description: "If it didn't open, email directly at harshparyani68@gmail.com",
      });
      setForm({ name: "", email: "", company: "", message: "" });
    }, 800);
};

  return (
    <section id="contact" style={{ padding: "112px 0", background: isDark ? "#000" : "#fff" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
        <SectionTag text="06 // contact" />
        <Reveal>
          <h2 style={{ fontFamily: "var(--font-family-mono)", fontWeight: 800, fontSize: "clamp(28px, 4vw, 46px)", color: fg, marginBottom: 12 }}>
            Let&apos;s Work Together
          </h2>
        </Reveal>
        <Reveal delay={0.07}>
          <p style={{ fontSize: 15, color: muted, marginBottom: 52, maxWidth: 520, lineHeight: 1.7 }}>
            Recruiters, collaborators, and clients — drop a message directly below and it will land in my inbox.
          </p>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 32, alignItems: "start" }} className="max-md:grid-cols-1">

          {/* Left — contact info */}
          <Reveal delay={0.1}>
            <div>
              <SpotCard
                className="rounded-2xl p-8"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <h3 style={{ fontFamily: "var(--font-family-mono)", fontSize: 15, fontWeight: 600, color: fg, marginBottom: 8 }}>
                  Direct Contact
                </h3>
                <p style={{ fontSize: 13, color: muted, lineHeight: 1.65, marginBottom: 28 }}>
                  Prefer to reach out directly? Here are all the ways to get in touch.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { icon: Mail, label: "Email", val: "harshparyani68@gmail.com", href: "mailto:harshparyani68@gmail.com" },
                    { icon: Phone, label: "Phone", val: "+91 88493 15494", href: "tel:+918849315494" },
                    { icon: Linkedin, label: "LinkedIn", val: "linkedin.com/in/harsh-paryani", href: "https://www.linkedin.com/in/harsh-paryani/" },
                    { icon: Github, label: "GitHub", val: "github.com/HarshParyani33", href: "https://github.com/HarshParyani33" },
                  ].map(({ icon: Icon, label, val, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", padding: "10px 12px", borderRadius: 10, transition: "background 0.2s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = CYAN_ALPHA(0.06); }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      data-hover
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: CYAN_ALPHA(0.08), border: `1px solid ${CYAN_ALPHA(0.15)}`,
                      }}>
                        <Icon size={14} style={{ color: CYAN }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--font-family-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: CYAN_ALPHA(0.65), marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, color: muted }}>{val}</div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Availability badge */}
                <div style={{
                  marginTop: 28, padding: "12px 16px", borderRadius: 10,
                  background: "rgba(0,229,255,0.06)", border: `1px solid ${CYAN_ALPHA(0.18)}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 8px rgba(34,197,94,0.6)" }} />
                  <span style={{ fontFamily: "var(--font-family-mono)", fontSize: 12, color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)" }}>
                    Open to full-time & freelance opportunities
                  </span>
                </div>
              </SpotCard>
            </div>
          </Reveal>

          {/* Right — form */}
          <Reveal delay={0.15}>
            <SpotCard
              className="rounded-2xl p-8"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <h3 style={{ fontFamily: "var(--font-family-mono)", fontSize: 15, fontWeight: 600, color: fg, marginBottom: 24 }}>
                Send a Message
              </h3>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Name + Company row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="max-sm:grid-cols-1">
                  <div>
                    <label style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: labelColor, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                      <User size={11} /> Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = CYAN_ALPHA(0.5); }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = inputBorder; }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: labelColor, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                      <Building2 size={11} /> Company
                    </label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = CYAN_ALPHA(0.5); }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = inputBorder; }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: labelColor, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                    <Mail size={11} /> Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="john@acme.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = CYAN_ALPHA(0.5); }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = inputBorder; }}
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: labelColor, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                    <MessageSquare size={11} /> Message *
                  </label>
                  <textarea
                    placeholder={`Hi Harsh, we're hiring for a ${""} role and think you'd be a great fit...`}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={5}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
                    onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = CYAN_ALPHA(0.5); }}
                    onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = inputBorder; }}
                    required
                  />
                </div>

                <MagBtn
                  type="submit"
                  disabled={sending}
                  style={{
                    gap: 8, padding: "14px 28px", borderRadius: 12, justifyContent: "center",
                    background: CYAN, color: "#000",
                    fontFamily: "var(--font-family-mono)", fontSize: 14, fontWeight: 700,
                    width: "100%", marginTop: 4,
                  }}
                >
                  <Send size={14} />
                  {sending ? "Opening email client..." : "Send Message"}
                </MagBtn>

                <p style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.28)", textAlign: "center", lineHeight: 1.6 }}>
                  This will open your default email client with the message prefilled.
                </p>
              </form>
            </SpotCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ toggleTheme }: { toggleTheme: () => void }) {
  const isDark = useIsDark();
  const [scrolled, setScrolled] = useState(false);
  const fg = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const navItems = [
    { id: "about", label: "About" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "certifications", label: "Certs" },
    { id: "contact", label: "Contact" },
  ];
  return (
    <nav
      style={{
        position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 9000,
        display: "flex", alignItems: "center", gap: 16,
        padding: scrolled ? "8px 18px" : "10px 22px",
        borderRadius: 9999,
        background: isDark ? "rgba(0,0,0,0.52)" : "rgba(255,255,255,0.52)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        boxShadow: scrolled ? "0 8px 40px rgba(0,0,0,0.32)" : "none",
        transition: "padding 0.3s, box-shadow 0.3s", whiteSpace: "nowrap",
      }}
    >
      <span onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{ fontFamily: "var(--font-family-mono)", fontSize: 15, fontWeight: 700, color: CYAN, cursor: "pointer" }}
        data-hover>
        HP<span style={{ color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }}>.</span>
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        {navItems.map(({ id, label }) => (
          <button key={id} onClick={() => go(id)}
            style={{
              fontFamily: "var(--font-family-mono)", fontSize: 12,
              padding: "5px 10px", borderRadius: 8, color: fg,
              background: "transparent", border: "none", cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = isDark ? "#fff" : "#000"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = fg; }}
            data-hover>
            {label}
          </button>
        ))}
      </div>
      <button onClick={toggleTheme}
        style={{
          width: 32, height: 32, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: fg, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          border: "none", cursor: "pointer", transition: "color 0.2s",
        }}
        data-hover>
        {isDark ? <Sun size={13} /> : <Moon size={13} />}
      </button>
    </nav>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const handleResumeAction = () => {
    const resumeUrl = "/Harsh_Paryani_Resume_11-07 (1).pdf";
    
    // 1. Pop open in a new tab
    window.open(resumeUrl, '_blank');
    
    // 2. Trigger the download automatically
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = "Harsh_Paryani_Resume.pdf"; // Clean name for the downloaded file
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [isDark, setIsDark] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const bg = isDark ? "#000" : "#fff";
  const bg2 = isDark ? "#050505" : "#f5f5f5";
  const fg = isDark ? "#fff" : "#0a0a0a";
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const cardBg = isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const skills = [
    { title: "Languages", icon: Code2, techs: ["Python", "Java", "JavaScript", "TypeScript", "C++"] },
    { title: "Frontend", icon: Layers, techs: ["React.js", "Next.js", "HTML", "CSS", "Tailwind CSS"] },
    { title: "Backend", icon: Cpu, techs: ["Node.js", "Express.js", "MongoDB"] },
    { title: "Tools & Cloud", icon: Wrench, techs: ["Git", "Postman", "Figma", "Render", "Vercel"] },
  ];

  const projects = [
    {
      title: "VerQ",
      description: "AI Powered Interview Buddy",
      details: "Resume-driven Q&A, voice responses, text-to-speech, and real-time AI feedback. Architected and shipped solo in 36 hours at Summer of CodeFest '25 — won 1st place out of 150+ teams.",
      techs: ["React", "Tailwind CSS", "Node.js", "Gemini API", "Deepgram API"],
      liveUrl: "https://verqai.vercel.app/",
      githubUrl: "https://github.com/The-Codesmokers/verq",
      gradient: "bg-gradient-to-br from-cyan-950/90 via-blue-950/70 to-black",
      badge: "1st Place",
    },
    {
      title: "CodeRush",
      description: "Real-Time Competitive Coding Platform",
      details: "PvP logic with ELO rating system, Judge0 API for multi-language code execution, Monaco Editor integration, and optimized full-stack architecture for sub-100ms sync latency.",
      techs: ["MERN Stack", "Mongoose", "Node.js", "Judge0 API", "Monaco Editor"],
      githubUrl: "https://github.com/smriti-02/CodeRush",
      gradient: "bg-gradient-to-br from-purple-950/90 via-violet-950/70 to-black",
    },
  ];

  const timeline = [
    { date: "Jul 2025", title: "1st Place — Summer of CodeFest '25", subtitle: "GSoC Innovators Club · 150+ teams competing", description: "Architected and shipped VerQ in 36 hours as a solo developer. Won against 150+ competing teams.", icon: Award },
    { date: "2023 – Present", title: "B.Tech Computer Science", subtitle: "VIT Bhopal University · CGPA 8.68 / 10", description: "Focused on full-stack development, AI systems, and competitive programming.", icon: GraduationCap },
    { date: "2023", title: "Class XII · 83.4%", subtitle: "Savvy International School · CBSE", icon: GraduationCap },
    { date: "2021", title: "Class X · 92.8%", subtitle: "Amarchand Singhvi International School · CBSE", icon: GraduationCap },
  ];

  const certifications: CertData[] = [
    {
      title: "Meta Front-End Developer Professional Certificate",
      issuer: "Meta",
      platform: "Coursera",
      year: "2025",
      accentColor: "#0082FB",
      letter: "M",
      verifyUrl: "https://coursera.org/share/4031bf7427d7cf0a4bac724b1d0e7453",
    },
    {
      title: "Bits and Bytes of Computer Networking",
      issuer: "Google",
      platform: "Coursera",
      year: "2025",
      accentColor: "#4285F4",
      letter: "G",
      verifyUrl: "https://coursera.org/share/def54eb1cfa14bb06faaeb20bd13f284",
    },
  ];

  return (
    <DarkCtx.Provider value={isDark}>
      <style>{`
        @media (pointer: fine) { * { cursor: none !important; } }
        @keyframes bootIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes bootBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: isDark ? "#0d0d0d" : "#fff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            color: isDark ? "#fff" : "#0a0a0a",
            fontFamily: "var(--font-family-mono)",
            fontSize: 13,
          },
        }}
      />

      <CursorTrail />
      <CustomCursor />
      {!loaded && <PageLoader onComplete={() => setLoaded(true)} />}
      <Nav toggleTheme={() => setIsDark(d => !d)} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: bg }}>
        <ParticleCanvas />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 72% 55% at 50% 50%, rgba(0,229,255,0.04) 0%, transparent 70%)",
        }} />
        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1120, margin: "0 auto", padding: "120px 24px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }} className="max-md:grid-cols-1">
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 36 }}
              transition={{ duration: 0.95, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <span style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", background: CYAN, animation: "bootBlink 1.5s ease infinite", opacity: 0.4, transform: "scale(2)" }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: CYAN, display: "inline-block", position: "relative" }} />
                </span>
                <span style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: CYAN_ALPHA(0.7), letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Available for work
                </span>
              </div>
              <h1 style={{ fontFamily: "var(--font-family-mono)", fontWeight: 800, lineHeight: 1.03, fontSize: "clamp(46px, 7vw, 82px)", color: fg, marginBottom: 22 }}>
                Harsh<br /><span style={{ color: CYAN }}>Paryani</span>
              </h1>
              <p style={{ fontFamily: "var(--font-family-mono)", fontSize: 14, color: muted, marginBottom: 6 }}>Full-Stack Developer</p>
              <p style={{ fontFamily: "var(--font-family-mono)", fontSize: 12, color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.28)", marginBottom: 36 }}>
                MERN · AI Integrations · Real-Time Systems
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                <MagBtn
                  onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ gap: 8, padding: "13px 26px", borderRadius: 12, background: CYAN, color: "#000", fontFamily: "var(--font-family-mono)", fontSize: 14, fontWeight: 700 }}>
                  Deployments / Projects
                </MagBtn>
                <MagBtn 
  onClick={(e) => {
    e.preventDefault();
    const resumeUrl = "/Harsh_Paryani_Resume_11-07 (1).pdf";
    
    // 1. Open in new tab
    window.open(resumeUrl, '_blank');
    
    // 2. Trigger download
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = "Harsh_Paryani_Resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }}
  style={{ gap: 8, padding: "13px 26px", borderRadius: 12, border: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)"}`, color: fg, fontFamily: "var(--font-family-mono)", fontSize: 14 }}
>
  View & Download Resume ↗
</MagBtn>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: loaded ? 1 : 0, x: loaded ? 0 : 36 }}
              transition={{ duration: 0.95, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <CodeSnippet />
            </motion.div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }}>
          <span style={{ fontFamily: "var(--font-family-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>scroll</span>
          <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom, currentColor, transparent)" }} />
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────────── */}
      <section id="about" style={{ padding: "112px 0", background: bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <SectionTag text="01 // about" />
          <Reveal>
            <h2 style={{ fontFamily: "var(--font-family-mono)", fontWeight: 800, fontSize: "clamp(28px, 4vw, 46px)", color: fg, marginBottom: 44 }}>
              Who I Am
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="max-md:grid-cols-1">
            <Reveal delay={0.05} className="md:col-span-2">
              <SpotCard className="rounded-2xl p-7 h-full" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 22 }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-family-mono)", fontSize: 16, fontWeight: 700, background: `linear-gradient(135deg, ${CYAN_ALPHA(0.15)}, ${CYAN_ALPHA(0.32)})`, border: `1px solid ${CYAN_ALPHA(0.22)}`, color: CYAN }}>
                    HP
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-family-mono)", fontSize: 18, fontWeight: 600, color: fg }}>Harsh Paryani</h3>
                    <p style={{ fontFamily: "var(--font-family-mono)", fontSize: 12, color: CYAN_ALPHA(0.75), marginTop: 4 }}>Full-Stack Developer</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: muted, marginBottom: 24 }}>
                  B.Tech Computer Science student at VIT Bhopal University (CGPA 8.68/10), building production-grade
                  applications that scale. I specialize in the MERN stack and AI integrations — from real-time WebSocket
                  systems to voice-enabled AI interfaces powered by Gemini and Deepgram. Won 1st place at Summer of CodeFest
                  '25 by shipping a full AI product in 36 hours.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {[{ label: "University", val: "VIT Bhopal" }, { label: "CGPA", val: "8.68 / 10" }, { label: "Batch", val: "2023 – 2027" }].map(({ label, val }) => (
                    <div key={label} style={{ padding: "10px 14px", borderRadius: 12, background: CYAN_ALPHA(0.06), border: `1px solid ${CYAN_ALPHA(0.16)}` }}>
                      <div style={{ fontFamily: "var(--font-family-mono)", fontSize: 10, color: CYAN_ALPHA(0.65), textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontFamily: "var(--font-family-mono)", fontSize: 13, fontWeight: 600, color: fg }}>{val}</div>
                    </div>
                  ))}
                </div>
              </SpotCard>
            </Reveal>
            <Reveal delay={0.1}>
              <SpotCard className="rounded-2xl p-7 h-full" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: CYAN_ALPHA(0.1), border: `1px solid ${CYAN_ALPHA(0.2)}`, marginBottom: 18 }}>
                  <Zap size={15} style={{ color: CYAN }} />
                </div>
                <h4 style={{ fontFamily: "var(--font-family-mono)", fontSize: 13, fontWeight: 600, color: fg, marginBottom: 16 }}>Core Expertise</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Scalable MERN applications", "Low-latency execution systems", "Gemini & Deepgram AI APIs", "Real-time WebSocket systems", "Competitive programming"].map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: muted }}>
                      <ChevronRight size={10} style={{ color: CYAN, flexShrink: 0 }} />{item}
                    </li>
                  ))}
                </ul>
              </SpotCard>
            </Reveal>
            <Reveal delay={0.15} className="md:col-span-3">
              <SpotCard className="rounded-2xl p-7" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <h4 style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>Live Metrics</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }} className="max-sm:grid-cols-2">
                  <Counter end={300} label="GitHub Commits" suffix="+" />
                  <Counter end={3} label="Projects Built" suffix ="+" />
                  <Counter end={5000} label="Lines of Code" suffix="+" />
                  <Counter end={1} label="Hackathons Won" />
                </div>
              </SpotCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SKILLS ───────────────────────────────────────────────────────── */}
      <section id="skills" style={{ padding: "112px 0", background: bg2 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <SectionTag text="02 // stack" />
          <Reveal>
            <h2 style={{ fontFamily: "var(--font-family-mono)", fontWeight: 800, fontSize: "clamp(28px, 4vw, 46px)", color: fg, marginBottom: 44 }}>
              Skills & Technologies
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="max-lg:grid-cols-2 max-sm:grid-cols-1">
            {skills.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}><SkillCard {...s} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROJECTS ─────────────────────────────────────────────────────── */}
      <section id="projects" style={{ padding: "112px 0", background: bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <SectionTag text="03 // work" />
          <Reveal>
            <h2 style={{ fontFamily: "var(--font-family-mono)", fontWeight: 800, fontSize: "clamp(28px, 4vw, 46px)", color: fg, marginBottom: 44 }}>
              Featured Projects
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="max-md:grid-cols-1">
            {projects.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}><ProjectCard {...p} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
      <section id="timeline" style={{ padding: "112px 0", background: bg2 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <SectionTag text="04 // journey" />
          <Reveal>
            <h2 style={{ fontFamily: "var(--font-family-mono)", fontWeight: 800, fontSize: "clamp(28px, 4vw, 46px)", color: fg, marginBottom: 44 }}>
              Achievements & Education
            </h2>
          </Reveal>
          <div style={{ maxWidth: 580 }}>
            {timeline.map((item, i) => <TimelineItem key={i} {...item} idx={i} />)}
          </div>
        </div>
      </section>

      {/* ── CERTIFICATIONS ───────────────────────────────────────────────── */}
      <section id="certifications" style={{ padding: "112px 0", background: bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <SectionTag text="05 // certifications" />
          <Reveal>
            <h2 style={{ fontFamily: "var(--font-family-mono)", fontWeight: 800, fontSize: "clamp(28px, 4vw, 46px)", color: fg, marginBottom: 12 }}>
              Certifications
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p style={{ fontSize: 15, color: muted, marginBottom: 48, maxWidth: 520, lineHeight: 1.7 }}>
              Verified credentials from globally recognized platforms, validating expertise in modern web technologies and networking fundamentals.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, maxWidth: 780 }} className="max-sm:grid-cols-1">
            {certifications.map((cert, i) => <CertCard key={i} cert={cert} idx={i} />)}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────────── */}
      <ContactSection />

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ padding: "64px 0 40px", background: bg, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 40, marginBottom: 40 }} className="max-md:grid-cols-1">
            <div>
              <div style={{ fontFamily: "var(--font-family-mono)", fontSize: 24, fontWeight: 800, marginBottom: 14 }}>
                <span style={{ color: CYAN }}>HP</span><span style={{ color: muted }}>.</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: muted }}>Full-Stack Developer crafting scalable MERN applications and AI-powered products.</p>
            </div>
            <div>
              <h5 style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: muted, marginBottom: 18 }}>Connect</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[{ href: "https://linkedin.com/in/harsh-paryani", Icon: Linkedin, label: "linkedin.com/in/harsh-paryani" }, { href: "https://github.com/HarshParyani33", Icon: Github, label: "github.com/HarshParyani33" }].map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: muted, textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = CYAN; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = muted; }}
                    data-hover>
                    <Icon size={13} />{label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: muted, marginBottom: 18 }}>Contact</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[{ href: "mailto:harshparyani68@gmail.com", Icon: Mail, label: "harshparyani68@gmail.com" }, { href: "tel:+918849315494", Icon: Phone, label: "+91 88493 15494" }].map(({ href, Icon, label }) => (
                  <a key={label} href={href}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: muted, textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = CYAN; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = muted; }}
                    data-hover>
                    <Icon size={13} />{label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
            <p style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.22)" }}>
              © 2025 Harsh Paryani · Built with React & TypeScript
            </p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-family-mono)", fontSize: 11, color: muted, background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = CYAN; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = muted; }}
              data-hover>
              Back to top <ArrowUp size={12} />
            </button>
          </div>
        </div>
      </footer>
    </DarkCtx.Provider>
  );
}
