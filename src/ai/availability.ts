/**
 * Ollama Availability Detection
 * 
 * Runtime detection of Ollama installation and available models.
 * This module is completely non-blocking and fails silently.
 * 
 * ARCHITECTURE:
 * -------------
 * - All functions are async and never throw
 * - Timeouts prevent blocking the UI
 * - Results are cached to avoid repeated network calls
 * - No error popups or forced prompts to users
 */

import {
  OllamaAvailability,
  OllamaTagsResponse,
  OLLAMA_CONFIG,
} from './types';

// =============================================================================
// Cache
// =============================================================================

let cachedAvailability: OllamaAvailability | null = null;
let lastCheckTime: number = 0;

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Check if Ollama is running and get available models.
 * 
 * This function:
 * - Never throws exceptions
 * - Has a configurable timeout
 * - Caches results to avoid repeated network calls
 * - Fails silently with a default "unavailable" response
 * 
 * @param forceRefresh - Skip cache and perform fresh check
 * @returns Availability status with installed models
 */
export async function checkOllamaAvailability(
  forceRefresh = false
): Promise<OllamaAvailability> {
  // Return cached result if still valid
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedAvailability &&
    now - lastCheckTime < OLLAMA_CONFIG.RECHECK_INTERVAL
  ) {
    return cachedAvailability;
  }
  
  const unavailable: OllamaAvailability = {
    installed: false,
    available: false,
    models: [],
    preferredModel: null,
  };
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      OLLAMA_CONFIG.AVAILABILITY_TIMEOUT
    );
    
    const response = await fetch(
      `${OLLAMA_CONFIG.BASE_URL}${OLLAMA_CONFIG.ENDPOINTS.TAGS}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      cachedAvailability = { ...unavailable, error: `HTTP ${response.status}` };
      lastCheckTime = now;
      return cachedAvailability;
    }
    
    const data: OllamaTagsResponse = await response.json();
    const modelNames = data.models?.map((m) => m.name) ?? [];
    
    // Find preferred model (first compatible one)
    const preferredModel = findPreferredModel(modelNames);
    
    cachedAvailability = {
      installed: true,
      available: preferredModel !== null,
      models: modelNames,
      preferredModel,
    };
    lastCheckTime = now;
    
    return cachedAvailability;
  } catch (error) {
    // Silently handle all errors - Ollama is simply not available
    const errorMessage = error instanceof Error ? error.name : 'Unknown error';
    
    // Don't log AbortError (timeout) as it's expected
    if (errorMessage !== 'AbortError') {
      // Silent fail - no console.error to avoid polluting logs
    }
    
    cachedAvailability = unavailable;
    lastCheckTime = now;
    
    return cachedAvailability;
  }
}

/**
 * Find the first compatible model from the installed models.
 * Models are prioritized based on OLLAMA_CONFIG.COMPATIBLE_MODELS order.
 * 
 * @param installedModels - List of installed model names
 * @returns The preferred model name, or null if none found
 */
function findPreferredModel(installedModels: string[]): string | null {
  if (!installedModels.length) return null;
  
  // Normalize model names (remove tags like :latest, :7b, etc.)
  const normalizedModels = installedModels.map((name) => ({
    original: name,
    normalized: name.split(':')[0].toLowerCase(),
  }));
  
  // Find first compatible model in order of preference
  for (const prefix of OLLAMA_CONFIG.COMPATIBLE_MODELS) {
    const match = normalizedModels.find((m) =>
      m.normalized.startsWith(prefix.toLowerCase())
    );
    if (match) {
      return match.original;
    }
  }
  
  // If no compatible model found, return the first available model
  // (user might have a custom model that works)
  return installedModels[0] || null;
}

/**
 * Clear the availability cache.
 * Useful when user manually installs/removes models.
 */
export function clearAvailabilityCache(): void {
  cachedAvailability = null;
  lastCheckTime = 0;
}

/**
 * Get cached availability without triggering a new check.
 * Returns null if no cached result exists.
 */
export function getCachedAvailability(): OllamaAvailability | null {
  return cachedAvailability;
}

/**
 * Check if AI features should be enabled based on current availability.
 * This is a convenience function for quick checks.
 */
export function isAIEnabled(): boolean {
  return cachedAvailability?.available ?? false;
}

/**
 * Get the time until next scheduled recheck.
 * Returns 0 if a recheck is due.
 */
export function getTimeUntilRecheck(): number {
  if (!lastCheckTime) return 0;
  const elapsed = Date.now() - lastCheckTime;
  return Math.max(0, OLLAMA_CONFIG.RECHECK_INTERVAL - elapsed);
}
