/**
 * AI Module Type Definitions
 * 
 * Core types for the optional Ollama AI integration.
 * All AI features are non-critical and fail silently.
 */

// =============================================================================
// Ollama API Types
// =============================================================================

/**
 * Model information returned by Ollama API
 */
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

/**
 * Response from Ollama /api/tags endpoint
 */
export interface OllamaTagsResponse {
  models: OllamaModel[];
}

/**
 * Request body for Ollama /api/generate endpoint
 */
export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  format?: 'json';
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
    stop?: string[];
  };
}

/**
 * Response from Ollama /api/generate endpoint (non-streaming)
 */
export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

// =============================================================================
// AI Availability Types
// =============================================================================

/**
 * Result of checking Ollama availability
 */
export interface OllamaAvailability {
  /** Whether Ollama server is reachable */
  installed: boolean;
  
  /** Whether at least one compatible model is available */
  available: boolean;
  
  /** List of installed model names */
  models: string[];
  
  /** The preferred model to use (first compatible one found) */
  preferredModel: string | null;
  
  /** Error message if check failed */
  error?: string;
}

/**
 * AI feature state for the application
 */
export interface AIState {
  /** Current availability status */
  availability: OllamaAvailability;
  
  /** Whether AI features should be shown in UI */
  enabled: boolean;
  
  /** Whether availability check is in progress */
  checking: boolean;
  
  /** Last time availability was checked */
  lastChecked: Date | null;
}

// =============================================================================
// AI Task Parsing Types
// =============================================================================

/**
 * Parsed task from AI (strict JSON output format)
 */
export interface AITaskParseResult {
  title: string;
  due_date: string;
  priority: string;
  tags: string[];
}

/**
 * Result wrapper for AI parsing operations
 */
export interface AIParseResponse {
  success: boolean;
  task: AITaskParseResult | null;
  error?: string;
  /** Whether fallback to rule-based parsing was used */
  usedFallback: boolean;
  /** Processing time in milliseconds */
  duration: number;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default Ollama server configuration
 */
export const OLLAMA_CONFIG = {
  /** Default Ollama API base URL */
  BASE_URL: 'http://127.0.0.1:11434',
  
  /** Endpoints */
  ENDPOINTS: {
    TAGS: '/api/tags',
    GENERATE: '/api/generate',
  },
  
  /** Timeout for availability check (ms) */
  AVAILABILITY_TIMEOUT: 3000,
  
  /** Timeout for AI generation requests (ms) */
  GENERATE_TIMEOUT: 30000,
  
  /** How often to recheck availability (ms) - 5 minutes */
  RECHECK_INTERVAL: 5 * 60 * 1000,
  
  /** Compatible model prefixes (in order of preference) */
  COMPATIBLE_MODELS: [
    'llama3',
    'llama2',
    'qwen2.5',
    'qwen2',
    'qwen',
    'phi3',
    'phi-3',
    'phi',
    'mistral',
    'gemma2',
    'gemma',
    'deepseek',
    'codellama',
    'neural-chat',
    'openchat',
    'vicuna',
    'orca',
  ],
} as const;
