import { useEffect, useRef, useState } from 'react';
import { useSpring, useTransform, motion, animate } from 'framer-motion';

function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 800,
  decimals = 0,
}) {
  const nodeRef = useRef(null);
  const prevValue = useRef(value);
  const [isGlowing, setIsGlowing] = useState(false);

  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 30,
    duration: duration / 1000,
  });

  const displayValue = useTransform(springValue, (latest) =>
    latest.toFixed(decimals)
  );

  useEffect(() => {
    springValue.set(value);

    // Trigger glow when value changes
    if (prevValue.current !== value) {
      setIsGlowing(true);
      const timer = setTimeout(() => setIsGlowing(false), 600);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (latest) => {
      if (nodeRef.current) {
        const num = parseFloat(latest);
        nodeRef.current.textContent = `${prefix}${
          decimals > 0 ? num.toFixed(decimals) : Math.round(num).toLocaleString()
        }${suffix}`;
      }
    });
    return unsubscribe;
  }, [displayValue, prefix, suffix, decimals]);

  return (
    <motion.span
      ref={nodeRef}
      className="font-mono text-2xl font-bold tabular-nums"
      style={{ color: '#00E5FF' }}
      animate={{
        textShadow: isGlowing
          ? '0 0 12px rgba(0, 229, 255, 0.6), 0 0 24px rgba(0, 229, 255, 0.3)'
          : '0 0 0px rgba(0, 229, 255, 0)',
      }}
      transition={{ duration: 0.4 }}
    >
      {prefix}
      {decimals > 0 ? value.toFixed(decimals) : value.toLocaleString()}
      {suffix}
    </motion.span>
  );
}

export default AnimatedCounter;
