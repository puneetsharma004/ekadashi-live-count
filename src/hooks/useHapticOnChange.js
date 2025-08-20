// src/hooks/useHapticOnChange.js
import { useEffect, useRef } from 'react';

/**
 * Triggers navigator.vibrate() whenever `value` changes.
 *
 * @param {any}               value    value to watch
 * @param {number|number[]}   pattern  vibration pattern (default 35 ms)
 * @param {number}            minDelay minimum pause between buzzes (ms)
 */
export default function useHapticOnChange(
  value,
  pattern = 35,
  minDelay = 0          // pass 5000 for a 5-second throttle
) {
  const prev   = useRef(value);
  const lastT  = useRef(0);           // ⬅ keeps timestamp between renders

  useEffect(() => {
    const now = Date.now();

    const changed      = value !== prev.current;
    const canVibrate   = 'vibrate' in navigator;
    const enoughPause  = now - lastT.current >= minDelay;

    if (changed && canVibrate && enoughPause) {
      navigator.vibrate(pattern);
      lastT.current = now;
    }

    prev.current = value;
  }, [value, pattern, minDelay]);
}
