/**
 * Natural Language Processing Module
 * 
 * This module provides natural language task parsing for ZenTrack.
 * 
 * ARCHITECTURE OVERVIEW:
 * ----------------------
 * 
 * Stage 1 (Current): Rule-Based Parsing
 * - Fully offline, zero dependencies
 * - Handles dates, times, tags, priorities
 * - Fast and predictable
 * 
 * Stage 2 (Future): Local LLM Integration
 * - Integration point: parseNaturalTaskAsync() in taskParser.ts
 * - Supports Ollama, LM Studio, or any local LLM
 * - Automatic fallback to rule-based parsing
 * 
 * Stage 3 (Future): Rust Backend Integration
 * - Integration point: parseNaturalTaskAsync() in taskParser.ts
 * - Offload parsing to Tauri backend
 * - Enables native performance and complex NLP
 * 
 * USAGE:
 * ------
 * 
 * // Simple parsing
 * import { parseNaturalTask } from '@/lib/nlp';
 * const result = parseNaturalTask("Finish report tomorrow 5pm #work");
 * 
 * // React hook
 * import { useNaturalTaskParser } from '@/lib/nlp';
 * const { input, setInput, result, isValid, confirm } = useNaturalTaskParser();
 * 
 * // Convert to app task format
 * import { toAppTask } from '@/lib/nlp';
 * const appTask = toAppTask(result.task);
 * await invoke('add_task', { task: appTask });
 */

// =============================================================================
// Core Types
// =============================================================================

export type {
  ParsedTask,
  ParseResult,
  ParseMetadata,
  ParseSummary,
  TaskPriority,
  TaskStatus,
  ParseConfidence,
  ParseSource,
  ParserConfig,
} from './types';

export { DEFAULT_PARSER_CONFIG, toAppTask } from './types';

// =============================================================================
// Parsing Functions
// =============================================================================

export {
  // Main parser function
  parseNaturalTask,
  
  // Async version for future AI integration
  parseNaturalTaskAsync,
  
  // Individual parsing utilities (for testing/customization)
  detectPriority,
  extractTags,
  detectDuration,
  cleanTitle,
  generateSummary,
} from './taskParser';

// =============================================================================
// Date/Time Utilities
// =============================================================================

export {
  parseDateTime,
  parseTime,
  formatISODate,
  formatTime,
  formatISODateTime,
  formatDisplayDate,
  removeDateTimeFromInput,
} from './dateParser';

export type { ParsedDateTime } from './dateParser';

// =============================================================================
// React Hooks
// =============================================================================

export {
  useNaturalTaskParser,
  useTaskParser,
} from './useNaturalTaskParser';

export type {
  UseNaturalTaskParserOptions,
  UseNaturalTaskParserReturn,
} from './useNaturalTaskParser';
