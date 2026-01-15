/**
 * AI Module Index
 * 
 * Central export point for all AI-related functionality.
 * This module is completely optional and non-blocking.
 */

// Types
export type {
  OllamaModel,
  OllamaTagsResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaAvailability,
  AIState,
  AITaskParseResult,
  AIParseResponse,
} from './types';

export { OLLAMA_CONFIG } from './types';

// Availability
export {
  checkOllamaAvailability,
  clearAvailabilityCache,
  getCachedAvailability,
  isAIEnabled,
  getTimeUntilRecheck,
} from './availability';

// Client
export {
  OllamaClient,
  ollamaClient,
  parseTaskWithAI,
  cancelAIRequest,
} from './ollamaClient';
