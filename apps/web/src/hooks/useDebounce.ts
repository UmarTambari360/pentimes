'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce a value by the given delay (ms).
 * The returned value only updates after the input value has been stable
 * for `delay` milliseconds — preventing excessive API calls as the user
 * types.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}