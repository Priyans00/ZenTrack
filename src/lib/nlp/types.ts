/**
 * Natural Language Task Parser - Type Definitions
 * 
 * These types define the structure for parsed tasks from natural language input.
 * Designed for forward compatibility with:
 * - Rust Tauri backend parsing
 * - Local LLM integration (Ollama / LM Studio)
 * - Rule-based fallback parsing
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * Priority levels for tasks.
 * Matches existing app conventions (capitalized for display).
 */
export type TaskPriority = 'Low' | 'Medium' | 'High';

/**
 * Task status options.
 * New tasks from NLP always start as 'Pending'.
 */
export type TaskStatus = 'Pending' | 'In Progress' | 'Done';

/**
 * Confidence level of the parse result.
 * Useful for deciding whether to show confirmation UI.
 */
export type ParseConfidence = 'low' | 'medium' | 'high';

/**
 * Source of the parsing - enables fallback chains.
 * 
 * FORWARD COMPATIBILITY:
 * When adding LLM support, add 'llm-local' | 'llm-api' here.
 */
export type ParseSource = 'rule-based' | 'llm-local' | 'llm-api' | 'rust-backend';

// =============================================================================
// Parsed Task Structure
// =============================================================================

/**
 * The structured task data extracted from natural language input.
 * 
 * This interface is designed to be:
 * 1. Serializable to JSON (for Tauri IPC)
 * 2. Compatible with existing Task type in appStore.ts
 * 3. Extensible for future AI-parsed fields
 */
export interface ParsedTask {
  /** The cleaned task title with metadata removed */
  title: string;
  
  /** Optional description extracted from input */
  description: string;
  
  /** ISO date string (YYYY-MM-DD) or null if not detected */
  dueDate: string | null;
  
  /** Time in HH:MM 24-hour format or null if not detected */
  dueTime: string | null;
  
  /** Combined ISO datetime string for storage (e.g., "2026-01-15T18:00:00") */
  dueDatetime: string | null;
  
  /** Array of extracted tags (without # prefix) */
  tags: string[];
  
  /** Detected priority level */
  priority: TaskPriority;
  
  /** Always 'Pending' for new tasks */
  status: TaskStatus;
  
  /** Optional subject ID if matched to existing subjects */
  subjectId?: number;
  
  /** Estimated duration in minutes if detected */
  estimatedMinutes?: number;
}

// =============================================================================
// Parse Result Wrapper
// =============================================================================

/**
 * Metadata about how the input was parsed.
 * Useful for debugging and UI feedback.
 */
export interface ParseMetadata {
  /** Original unmodified input */
  originalInput: string;
  
  /** Text segments that were identified and removed */
  extractedSegments: {
    dateTime?: string;
    tags?: string[];
    priority?: string;
  };
  
  /** How confident we are in the parse */
  confidence: ParseConfidence;
  
  /** Which parser produced this result */
  source: ParseSource;
  
  /** Parsing duration in milliseconds */
  parseTimeMs: number;
  
  /** Any warnings during parsing */
  warnings: string[];
}

/**
 * Human-readable summary for UI confirmation.
 */
export interface ParseSummary {
  /** One-line summary of the parsed task */
  text: string;
  
  /** Formatted due date/time for display */
  dueDateDisplay: string | null;
  
  /** Whether this needs user confirmation */
  needsConfirmation: boolean;
}

/**
 * Complete result from parseNaturalTask().
 * 
 * This wrapper enables:
 * - Success/failure handling
 * - Metadata for debugging
 * - UI-ready summary text
 * - Easy serialization for Tauri
 */
export interface ParseResult {
  /** Whether parsing succeeded */
  success: boolean;
  
  /** The parsed task data (null if parsing failed) */
  task: ParsedTask | null;
  
  /** Human-readable summary for confirmation UI */
  summary: ParseSummary | null;
  
  /** Parsing metadata for debugging/logging */
  metadata: ParseMetadata;
  
  /** Error message if parsing failed */
  error?: string;
}

// =============================================================================
// Parser Configuration
// =============================================================================

/**
 * Configuration options for the parser.
 * 
 * FORWARD COMPATIBILITY:
 * Add LLM-specific options here when integrating AI.
 */
export interface ParserConfig {
  /** Default priority when none detected */
  defaultPriority: TaskPriority;
  
  /** Default tags to apply */
  defaultTags: string[];
  
  /** Whether to require confirmation for low-confidence parses */
  requireConfirmationThreshold: ParseConfidence;
  
  /** 
   * FUTURE: LLM configuration
   * llmEndpoint?: string;
   * llmModel?: string;
   * llmTimeout?: number;
   * useLlmFallback?: boolean;
   */
}

/**
 * Default parser configuration.
 */
export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  defaultPriority: 'Medium',
  defaultTags: [],
  requireConfirmationThreshold: 'medium',
};

// =============================================================================
// Conversion Utilities
// =============================================================================

/**
 * Converts ParsedTask to the Task format used in appStore.ts.
 * This ensures compatibility with existing task management.
 */
export function toAppTask(parsed: ParsedTask): {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  tags: string[];
  priority: string;
  status: string;
  subject_id?: number;
  estimated_minutes?: number;
} {
  return {
    id: 0, // Will be assigned by backend
    title: parsed.title,
    description: parsed.description,
    due_date: parsed.dueDatetime || undefined,
    tags: parsed.tags,
    priority: parsed.priority,
    status: parsed.status,
    subject_id: parsed.subjectId,
    estimated_minutes: parsed.estimatedMinutes,
  };
}
