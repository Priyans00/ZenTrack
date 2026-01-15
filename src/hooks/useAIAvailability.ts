/**
 * useAIAvailability Hook
 * 
 * React hook for checking and monitoring Ollama AI availability.
 * Designed to be non-intrusive and never block the UI.
 * 
 * FEATURES:
 * ---------
 * - Automatic availability check on mount
 * - Periodic rechecking (configurable)
 * - Manual refresh capability
 * - Memoized for performance
 * 
 * USAGE:
 * ------
 * const { isAvailable, isChecking, models, refresh } = useAIAvailability();
 * 
 * if (isAvailable) {
 *   // Show AI-powered features
 * }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkOllamaAvailability,
  clearAvailabilityCache,
  OLLAMA_CONFIG,
} from '../ai';
import type { OllamaAvailability } from '../ai';

// =============================================================================
// Types
// =============================================================================

export interface UseAIAvailabilityOptions {
  /** Whether to check availability on mount (default: true) */
  checkOnMount?: boolean;
  
  /** Whether to periodically recheck availability (default: true) */
  enablePeriodicCheck?: boolean;
  
  /** Interval for periodic checks in milliseconds (default: 5 minutes) */
  recheckInterval?: number;
}

export interface UseAIAvailabilityResult {
  /** Whether AI features are available and ready to use */
  isAvailable: boolean;
  
  /** Whether Ollama is installed (even if no models) */
  isInstalled: boolean;
  
  /** Whether an availability check is in progress */
  isChecking: boolean;
  
  /** List of available model names */
  models: string[];
  
  /** The preferred model to use */
  preferredModel: string | null;
  
  /** Full availability object for advanced usage */
  availability: OllamaAvailability | null;
  
  /** Last error message, if any */
  error: string | null;
  
  /** Manually trigger a fresh availability check */
  refresh: () => Promise<void>;
  
  /** Clear cache and recheck */
  forceRefresh: () => Promise<void>;
}

// =============================================================================
// Default Options
// =============================================================================

const DEFAULT_OPTIONS: Required<UseAIAvailabilityOptions> = {
  checkOnMount: true,
  enablePeriodicCheck: true,
  recheckInterval: OLLAMA_CONFIG.RECHECK_INTERVAL,
};

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAIAvailability(
  options: UseAIAvailabilityOptions = {}
): UseAIAvailabilityResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State
  const [availability, setAvailability] = useState<OllamaAvailability | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to avoid stale closures in intervals
  const isMountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  /**
   * Perform an availability check.
   */
  const checkAvailability = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;
    
    setIsChecking(true);
    setError(null);
    
    try {
      if (forceRefresh) {
        clearAvailabilityCache();
      }
      
      const result = await checkOllamaAvailability(forceRefresh);
      
      if (isMountedRef.current) {
        setAvailability(result);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAvailability({
          installed: false,
          available: false,
          models: [],
          preferredModel: null,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);
  
  /**
   * Public refresh function (uses cache if available).
   */
  const refresh = useCallback(async () => {
    await checkAvailability(false);
  }, [checkAvailability]);
  
  /**
   * Public force refresh function (clears cache first).
   */
  const forceRefresh = useCallback(async () => {
    await checkAvailability(true);
  }, [checkAvailability]);
  
  // Initial check on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (opts.checkOnMount) {
      checkAvailability(false);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Periodic recheck
  useEffect(() => {
    if (!opts.enablePeriodicCheck) return;
    
    intervalRef.current = setInterval(() => {
      checkAvailability(false);
    }, opts.recheckInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [opts.enablePeriodicCheck, opts.recheckInterval, checkAvailability]);
  
  // Derived values
  const isAvailable = availability?.available ?? false;
  const isInstalled = availability?.installed ?? false;
  const models = availability?.models ?? [];
  const preferredModel = availability?.preferredModel ?? null;
  
  return {
    isAvailable,
    isInstalled,
    isChecking,
    models,
    preferredModel,
    availability,
    error,
    refresh,
    forceRefresh,
  };
}

// =============================================================================
// Convenience Hook - Simple Boolean Check
// =============================================================================

/**
 * Simple hook that just returns whether AI is available.
 * Use this for conditional rendering.
 */
export function useIsAIAvailable(): boolean {
  const { isAvailable } = useAIAvailability({
    enablePeriodicCheck: false, // Don't recheck repeatedly for simple usage
  });
  return isAvailable;
}
