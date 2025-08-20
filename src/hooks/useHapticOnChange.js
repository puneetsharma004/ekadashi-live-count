// // src/hooks/useHapticOnChange.js
// import { useEffect, useRef } from 'react';

// /**
//  * Fires a vibration whenever `value` changes.
//  *
//  * @param  {*}                 value        value to watch
//  * @param  {number|number[]}   pattern      vibration pattern (default 35 ms)
//  * @param  {number}            minDelay     min gap between buzzes (ms)
//  */
// export default function useHapticOnChange(value, pattern = 35, minDelay = 0) {
//   const prev  = useRef(value);
//   const last  = useRef(0);

//   useEffect(() => {
//     const now = Date.now();

//     const shouldBuzz =
//       value !== prev.current &&          // changed
//       now   - last.current >= minDelay && // throttled
//       'vibrate' in navigator;            // supported

//     if (shouldBuzz) {
//       // Chrome blocks the first call until user interaction; that’s OK.
//       navigator.vibrate(pattern);
//       last.current = now;
//     }

//     prev.current = value;
//   }, [value, pattern, minDelay]);
// }
