import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./LoadingScreen.css";

/* ── Timing (ms) ── */
const MIN_DISPLAY = 3200;
const FADE_OUT = 1000;

/* ── Generate floating particles ── */
function useParticles(count = 30) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 6 + 5,
      delay: Math.random() * 4,
      drift: (Math.random() - 0.5) * 60,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, [count]);
}

/* ── Letter-by-letter stagger for title ── */
const titleText = "Aviora Resort";
const titleLetters = titleText.split("");

const letterContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.6,
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 30, rotateX: -80 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Orbit ring dots ── */
const orbitDots = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  delay: i * 1.2,
  size: 3 - i * 0.5,
}));

export default function LoadingScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading | complete | exiting
  const particles = useParticles(30);

  useEffect(() => {
    const start = Date.now();

    const tick = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(tick);
          return 100;
        }
        const elapsed = Date.now() - start;
        const raw = Math.min(100, (elapsed / MIN_DISPLAY) * 100);
        /* Ease-out with a satisfying curve */
        const eased =
          raw < 60
            ? raw * 1.1
            : raw < 90
              ? 66 + (raw - 60) * 0.7
              : 87 + (raw - 90) * 1.3;
        return Math.min(100, Math.round(eased));
      });
    }, 30);

    const timer = setTimeout(() => {
      setProgress(100);
      clearInterval(tick);
      setPhase("complete");
      setTimeout(() => {
        setPhase("exiting");
        setTimeout(() => setIsVisible(false), 200);
      }, 600);
    }, MIN_DISPLAY);

    return () => {
      clearTimeout(timer);
      clearInterval(tick);
    };
  }, []);

  const handleExitComplete = () => onComplete?.();

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          key="loading-screen"
          className="ls"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: FADE_OUT / 1000,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* ── Ambient backgrounds ── */}
          <div className="ls__bg" />
          <div className="ls__noise" />
          <div className="ls__vignette" />

          {/* ── Floating gold particles ── */}
          <div className="ls__particles" aria-hidden="true">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="ls__particle"
                style={{
                  left: `${p.x}%`,
                  width: p.size,
                  height: p.size,
                }}
                initial={{ y: "100vh", x: 0, opacity: 0 }}
                animate={{
                  y: "-20vh",
                  x: p.drift,
                  opacity: [0, p.opacity, p.opacity, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* ── Center content ── */}
          <div className="ls__content">
            {/* Orbiting ring around logo */}
            <div className="ls__orbit-container">
              {/* Outer decorative ring */}
              <motion.div
                className="ls__orbit-ring"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="ls__orbit-ring-inner" />
              </motion.div>

              {/* Orbiting dots */}
              {orbitDots.map((dot) => (
                <motion.div
                  key={dot.id}
                  className="ls__orbit-dot"
                  style={{ "--orbit-delay": `${dot.delay}s`, "--dot-size": `${dot.size}px` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + dot.delay * 0.3, duration: 0.5 }}
                />
              ))}

              {/* Logo */}
              <motion.div
                className="ls__logo-wrap"
                initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <img
                  src="/assets/logo/Aviora Resort Logo - Without Background.png"
                  alt="Aviora Resort"
                  className="ls__logo"
                />
                <div className="ls__glow" />
                <div className="ls__glow-secondary" />
              </motion.div>
            </div>

            {/* Title — letter by letter */}
            <motion.h1
              className="ls__title"
              variants={letterContainerVariants}
              initial="hidden"
              animate="visible"
              style={{ perspective: 400 }}
            >
              {titleLetters.map((letter, i) => (
                <motion.span
                  key={i}
                  variants={letterVariants}
                  className="ls__letter"
                  style={{ display: "inline-block" }}
                >
                  {letter === " " ? "\u00A0" : letter}
                </motion.span>
              ))}
            </motion.h1>

            {/* Tagline with line reveal */}
            <motion.div
              className="ls__tagline-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              <motion.div
                className="ls__tagline-line ls__tagline-line--left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.5, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
              <motion.p
                className="ls__tagline"
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                animate={{ opacity: 0.85, letterSpacing: "0.25em" }}
                transition={{ delay: 1.6, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Luxury Hotels &amp; Villas
              </motion.p>
              <motion.div
                className="ls__tagline-line ls__tagline-line--right"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.5, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </motion.div>

            {/* Progress area */}
            <motion.div
              className="ls__progress-area"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
            >
              {/* Circular progress ring */}
              <div className="ls__ring-progress">
                <svg viewBox="0 0 44 44" className="ls__ring-svg">
                  <circle
                    className="ls__ring-track"
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    strokeWidth="1"
                  />
                  <motion.circle
                    className="ls__ring-fill"
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 18}
                    initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 18 * (1 - progress / 100),
                    }}
                    transition={{ duration: 0.15, ease: "linear" }}
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "center",
                    }}
                  />
                </svg>
                <span className="ls__ring-percent">
                  {progress}
                </span>
              </div>

              {/* Progress bar */}
              <div className="ls__progress-track">
                <motion.div
                  className="ls__progress-bar"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.15, ease: "linear" }}
                />
                <div className="ls__progress-glow" />
              </div>

              {/* Status text */}
              <motion.span
                className="ls__status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.4 }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={phase}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {phase === "complete" || phase === "exiting"
                      ? "Welcome to Paradise"
                      : "Preparing your experience"}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
            </motion.div>
          </div>

          {/* ── Corner accents ── */}
          <motion.div
            className="ls__corner ls__corner--tl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
          <motion.div
            className="ls__corner ls__corner--tr"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          <motion.div
            className="ls__corner ls__corner--bl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          />
          <motion.div
            className="ls__corner ls__corner--br"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
