import { useEffect, useRef, useState } from 'react';

const numericPartPattern = /-?\d[\d,]*(?:\.\d+)?/;

const parseNumber = (value) => {
  const text = String(value ?? '');
  const match = text.match(numericPartPattern);
  if (!match) return null;

  const number = Number(match[0].replace(/,/g, ''));
  if (!Number.isFinite(number)) return null;

  return {
    number,
    prefix: text.slice(0, match.index),
    suffix: text.slice(match.index + match[0].length),
    decimals: (match[0].split('.')[1] || '').length
  };
};

const CountUpNumber = ({ value, duration = 1200, className = '' }) => {
  const target = parseNumber(value);
  const finalText = String(value ?? '');
  const elementRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!target || !elementRef.current) return undefined;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) {
      setStarted(true);
      setDisplayValue(target.number);
      return undefined;
    }

    if (!('IntersectionObserver' in window)) {
      setStarted(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [target?.number]);

  useEffect(() => {
    if (!started || !target) return undefined;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) {
      setDisplayValue(target.number);
      return undefined;
    }

    let frameId;
    let startTime;
    let lastUpdate = 0;
    const frameInterval = 1000 / 30;
    const from = 0;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      if (timestamp - lastUpdate >= frameInterval || progress === 1) {
        const easedProgress = 1 - ((1 - progress) ** 3);
        setDisplayValue(from + ((target.number - from) * easedProgress));
        lastUpdate = timestamp;
      }
      if (progress < 1) frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [started, target?.number, duration]);

  if (!target) return <span className={className}>{finalText}</span>;

  const visibleNumber = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: target.decimals,
    maximumFractionDigits: target.decimals
  }).format(started ? displayValue : 0);

  return (
    <span ref={elementRef} className={className} aria-label={finalText}>
      <span aria-hidden="true">{target.prefix}{started ? visibleNumber : '0'}{target.suffix}</span>
    </span>
  );
};

export default CountUpNumber;
