// src/hooks/useHapticOnChange.js
import { useEffect, useRef } from 'react';

/**
 * Triggers navigator.vibrate() whenever `value` changes.
 *
 * @param {any}      value    – the reactive value to watch
 * @param {number|number[]} pattern – vibration pattern (default 35 ms pulse)
 *                                     pass an array for complex patterns
 */

const lastT = useRef(Date.now());
if (Date.now() - lastT.current > 5000) { /* vibrate */ }

export default function useHapticOnChange(value, pattern = 35) {
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
      prev.current = value;
    }
  }, [value, pattern]);
}

