import { useEffect, useRef, useState } from "react";
import "./Caunter.css";

const countersData = [
  { target: 15, label: "نمو السكان", suffix: "%", variant: "default" },
  { target: 25847, label: "عقارات متاحه", suffix: "", variant: "default" },
  { target: 100, label: "الالتزام بمواعيد التسليم", suffix: "%", variant: "highlight" },
  { target: 1500, label: "المستخدمون النشطون", suffix: "k+", variant: "default" },
];

const DURATION_MS = 1500;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const CaunterBoxes = () => {
  const containerRef = useRef(null);
  const [counts, setCounts] = useState(
    countersData.map((counter) => (prefersReducedMotion() ? counter.target : 0))
  );

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    let rafId;
    const animation = () => {
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / DURATION_MS, 1);
        const eased = easeOutCubic(progress);
        setCounts(
          countersData.map((counter) => Math.round(counter.target * eased))
        );
        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animation();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const formatNumber = (num) => num.toLocaleString();

  return (
    <div className="counter-container" ref={containerRef}>
      {counts.map((count, index) => (
        <div
          key={index}
          className={`counter-box ${countersData[index].variant}`}>
          <div className="counter-number">
            {formatNumber(count)}
            {countersData[index].suffix}
          </div>
          <div className="counter-label">{countersData[index].label}</div>
        </div>
      ))}
    </div>
  );
};

export default CaunterBoxes;