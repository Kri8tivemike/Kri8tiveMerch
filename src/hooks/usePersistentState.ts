import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A hook that persists state across unmounts/remounts of a component
 * This is useful for preserving state during navigation
 * 
 * @param key A unique string key to identify this state
 * @param initialValue The initial value of the state
 * @returns A state tuple [state, setState] similar to useState
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Get from sessionStorage if available, otherwise use initialValue
  const getStoredValue = (): T => {
    try {
      const item = sessionStorage.getItem(`persistent_state_${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error retrieving persistent state:', error);
      return initialValue;
    }
  };

  // Setup state with the stored or initial value
  const [state, setState] = useState<T>(getStoredValue);

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(`persistent_state_${key}`, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving persistent state:', error);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * A hook to persist multiple values in a single object
 * This is useful when you need to persist multiple related values
 * 
 * @param key A unique string key to identify this state
 * @param initialValues An object containing the initial values
 * @returns An object with values and setters
 */
export function usePersistentObject<T extends Record<string, any>>(
  key: string,
  initialValues: T
): { values: T; setValue: <K extends keyof T>(field: K, value: T[K]) => void; reset: () => void } {
  const [values, setValues] = usePersistentState<T>(key, initialValues);
  
  const setValue = <K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };
  
  const reset = () => {
    setValues(initialValues);
  };
  
  return { values, setValue, reset };
}

export default usePersistentState; 