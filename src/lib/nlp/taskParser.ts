/**
 * Natural Language Task Parser - Main Parser Module
 * 
 * This is the core parser that extracts structured task data from natural language input.
 * 
 * ARCHITECTURE NOTES:
 * -------------------
 * This module is designed for forward compatibility with AI/LLM integration:
 * 
 * 1. CURRENT (Stage 1): Rule-based parsing
 *    - Fully offline, no dependencies
 *    - Fast and predictable
 * 
 * 2. FUTURE (Stage 2): Local LLM integration point
 *    - Replace or augment parseNaturalTask() with LLM call
 *    - Fallback to rule-based if LLM fails
 *    - See comments marked [AI_HOOK] for integration points
 * 
 * 3. FUTURE (Stage 3): Rust backend parsing
 *    - Call Tauri command instead of frontend parsing
 *    - Same interface, different implementation
 *    - See comments marked [RUST_HOOK] for integration points
 */

import {
  ParsedTask,
  ParseResult,
  ParseMetadata,
  ParseSummary,
  TaskPriority,
  ParserConfig,
  DEFAULT_PARSER_CONFIG,
} from './types';

import {
  parseDateTime,
  formatISODate,
  formatTime,
  formatISODateTime,
  formatDisplayDate,
} from './dateParser';

// =============================================================================
// Priority Detection
// =============================================================================

/**
 * Keywords that indicate priority levels.
 * Order matters - more specific patterns first.
 */
const PRIORITY_PATTERNS: Array<{ pattern: RegExp; priority: TaskPriority }> = [
  // High priority keywords
  { pattern: /\b(high\s+priority|urgent|asap|critical|important)\b/i, priority: 'High' },
  { pattern: /\bhigh\s+pri(ority)?\b/i, priority: 'High' },
  { pattern: /\b!{2,}\b/i, priority: 'High' }, // !! or more
  
  // Low priority keywords
  { pattern: /\b(low\s+priority|low\s+pri|someday|whenever|optional)\b/i, priority: 'Low' },
  
  // Medium is explicitly stated
  { pattern: /\b(medium\s+priority|medium\s+pri|normal\s+priority)\b/i, priority: 'Medium' },
];

/**
 * Detect priority from input and return the matched text for removal.
 */
function detectPriority(input: string, defaultPriority: TaskPriority): {
  priority: TaskPriority;
  matchedText: string;
} {
  for (const { pattern, priority } of PRIORITY_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      return { priority, matchedText: match[0] };
    }
  }
  
  return { priority: defaultPriority, matchedText: '' };
}

// =============================================================================
// Tag Extraction
// =============================================================================

/**
 * Extract hashtags from input.
 * Supports: #work, #college, #my-tag, #tag123
 */
function extractTags(input: string): {
  tags: string[];
  matchedTexts: string[];
} {
  const tagPattern = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;
  const tags: string[] = [];
  const matchedTexts: string[] = [];
  
  let match;
  while ((match = tagPattern.exec(input)) !== null) {
    // Capitalize first letter for consistency with existing tags
    const tag = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    if (!tags.includes(tag)) {
      tags.push(tag);
      matchedTexts.push(match[0]);
    }
  }
  
  return { tags, matchedTexts };
}

// =============================================================================
// Duration Detection
// =============================================================================

/**
 * Detect estimated duration from input.
 * Supports: 30 min, 2 hours, 1.5h, 90 minutes
 */
function detectDuration(input: string): {
  minutes: number | null;
  matchedText: string;
} {
  // Pattern: X hours/hrs/h
  const hourPattern = /\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i;
  const hourMatch = input.match(hourPattern);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    return { minutes: Math.round(hours * 60), matchedText: hourMatch[0] };
  }
  
  // Pattern: X minutes/mins/min/m
  const minPattern = /\b(\d+)\s*(?:minutes?|mins?|m)\b/i;
  const minMatch = input.match(minPattern);
  if (minMatch) {
    return { minutes: parseInt(minMatch[1], 10), matchedText: minMatch[0] };
  }
  
  return { minutes: null, matchedText: '' };
}

// =============================================================================
// Title Cleanup
// =============================================================================

/**
 * Clean up the title by removing parsed segments.
 */
function cleanTitle(
  input: string,
  segments: string[]
): string {
  let title = input;
  
  for (const segment of segments) {
    if (!segment) continue;
    
    // Escape special regex characters
    const escaped = segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Remove the segment and surrounding whitespace
    title = title.replace(new RegExp(`\\s*${escaped}\\s*`, 'gi'), ' ');
  }
  
  // Clean up:
  // - Multiple spaces to single space
  // - Leading/trailing whitespace
  // - Common leftover words
  title = title
    .replace(/\s+/g, ' ')
    .replace(/^\s*(and|with|at|by|on|for)\s+/i, '')
    .replace(/\s+(and|with|at|by|on|for)\s*$/i, '')
    .trim();
  
  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  return title;
}

// =============================================================================
// Summary Generation
// =============================================================================

/**
 * Generate a human-readable summary for confirmation UI.
 */
function generateSummary(task: ParsedTask): ParseSummary {
  const parts: string[] = [];
  
  // Title
  parts.push(`"${task.title}"`);
  
  // Due date
  if (task.dueDate) {
    const date = new Date(task.dueDate);
    const displayDate = formatDisplayDate(
      date,
      task.dueTime ? {
        hours: parseInt(task.dueTime.split(':')[0], 10),
        minutes: parseInt(task.dueTime.split(':')[1], 10),
      } : null
    );
    parts.push(`due ${displayDate}`);
  }
  
  // Tags
  if (task.tags.length > 0) {
    parts.push(`tagged ${task.tags.map(t => `#${t}`).join(', ')}`);
  }
  
  // Priority (only if not medium/default)
  if (task.priority !== 'Medium') {
    parts.push(`${task.priority.toLowerCase()} priority`);
  }
  
  // Duration
  if (task.estimatedMinutes) {
    const hours = Math.floor(task.estimatedMinutes / 60);
    const mins = task.estimatedMinutes % 60;
    const durationStr = hours > 0 
      ? mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
      : `${mins}m`;
    parts.push(`estimated ${durationStr}`);
  }
  
  return {
    text: parts.join(' • '),
    dueDateDisplay: task.dueDate 
      ? formatDisplayDate(
          new Date(task.dueDate),
          task.dueTime ? {
            hours: parseInt(task.dueTime.split(':')[0], 10),
            minutes: parseInt(task.dueTime.split(':')[1], 10),
          } : null
        )
      : null,
    needsConfirmation: true, // Always confirm for now; can be based on confidence later
  };
}

// =============================================================================
// Main Parser Function
// =============================================================================

/**
 * Parse natural language input into a structured task.
 * 
 * @param input - The natural language task description
 * @param config - Optional parser configuration
 * @returns ParseResult with the parsed task and metadata
 * 
 * @example
 * ```typescript
 * const result = parseNaturalTask("Finish math assignment tomorrow at 6pm #college high priority");
 * // result.task = {
 * //   title: "Finish math assignment",
 * //   dueDate: "2026-01-15",
 * //   dueTime: "18:00",
 * //   tags: ["College"],
 * //   priority: "High",
 * //   status: "Pending"
 * // }
 * ```
 * 
 * [AI_HOOK] To integrate LLM parsing:
 * 1. Create an async version: parseNaturalTaskWithLLM()
 * 2. Call local LLM endpoint with structured prompt
 * 3. Parse LLM JSON response into ParsedTask
 * 4. Fall back to this function if LLM fails
 * 
 * [RUST_HOOK] To integrate Rust backend:
 * 1. Create: parseNaturalTaskRemote() using invoke()
 * 2. Send input to Tauri command
 * 3. Receive ParseResult from Rust
 * 4. Fall back to this function if Tauri call fails
 */
export function parseNaturalTask(
  input: string,
  config: Partial<ParserConfig> = {}
): ParseResult {
  const startTime = performance.now();
  const mergedConfig = { ...DEFAULT_PARSER_CONFIG, ...config };
  
  // Validate input
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return {
      success: false,
      task: null,
      summary: null,
      metadata: {
        originalInput: input,
        extractedSegments: {},
        confidence: 'low',
        source: 'rule-based',
        parseTimeMs: performance.now() - startTime,
        warnings: ['Empty input'],
      },
      error: 'Input cannot be empty',
    };
  }
  
  // Track segments to remove from title
  const segmentsToRemove: string[] = [];
  const warnings: string[] = [];
  
  // 1. Extract date and time
  const dateTimeResult = parseDateTime(trimmedInput);
  if (dateTimeResult.matchedText) {
    segmentsToRemove.push(dateTimeResult.matchedText);
  }
  
  // 2. Extract tags
  const tagResult = extractTags(trimmedInput);
  segmentsToRemove.push(...tagResult.matchedTexts);
  const tags = tagResult.tags.length > 0 
    ? tagResult.tags 
    : mergedConfig.defaultTags;
  
  // 3. Detect priority
  const priorityResult = detectPriority(trimmedInput, mergedConfig.defaultPriority);
  if (priorityResult.matchedText) {
    segmentsToRemove.push(priorityResult.matchedText);
  }
  
  // 4. Detect duration
  const durationResult = detectDuration(trimmedInput);
  if (durationResult.matchedText) {
    segmentsToRemove.push(durationResult.matchedText);
  }
  
  // 5. Clean up title
  const title = cleanTitle(trimmedInput, segmentsToRemove);
  
  if (!title) {
    return {
      success: false,
      task: null,
      summary: null,
      metadata: {
        originalInput: input,
        extractedSegments: {
          dateTime: dateTimeResult.matchedText || undefined,
          tags: tagResult.matchedTexts,
          priority: priorityResult.matchedText || undefined,
        },
        confidence: 'low',
        source: 'rule-based',
        parseTimeMs: performance.now() - startTime,
        warnings: ['Could not extract task title'],
      },
      error: 'Could not extract task title from input',
    };
  }
  
  // Build the parsed task
  const parsedTask: ParsedTask = {
    title,
    description: '', // Could be extended to support longer input
    dueDate: dateTimeResult.date ? formatISODate(dateTimeResult.date) : null,
    dueTime: dateTimeResult.time ? formatTime(dateTimeResult.time) : null,
    dueDatetime: dateTimeResult.date 
      ? formatISODateTime(dateTimeResult.date, dateTimeResult.time)
      : null,
    tags,
    priority: priorityResult.priority,
    status: 'Pending',
    estimatedMinutes: durationResult.minutes || undefined,
  };
  
  // Calculate confidence
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (dateTimeResult.confidence === 'high' && title.length > 3) {
    confidence = 'high';
  } else if (!dateTimeResult.date && tags.length === 0) {
    confidence = 'low';
    warnings.push('No date or tags detected');
  }
  
  // Build metadata
  const metadata: ParseMetadata = {
    originalInput: input,
    extractedSegments: {
      dateTime: dateTimeResult.matchedText || undefined,
      tags: tagResult.matchedTexts.length > 0 ? tagResult.matchedTexts : undefined,
      priority: priorityResult.matchedText || undefined,
    },
    confidence,
    source: 'rule-based',
    parseTimeMs: performance.now() - startTime,
    warnings,
  };
  
  // Generate summary
  const summary = generateSummary(parsedTask);
  
  return {
    success: true,
    task: parsedTask,
    summary,
    metadata,
  };
}

// =============================================================================
// Async Parser Wrapper (For Future AI Integration)
// =============================================================================

/**
 * Async wrapper for task parsing.
 * 
 * [AI_HOOK] This is the primary integration point for LLM parsing.
 * 
 * Current behavior: Calls synchronous rule-based parser.
 * Future behavior: Try LLM first, fall back to rule-based.
 * 
 * @param input - Natural language input
 * @param config - Parser configuration
 * @param options - Additional options for AI/backend parsing
 * @returns Promise<ParseResult>
 * 
 * Example future implementation:
 * ```typescript
 * export async function parseNaturalTaskAsync(
 *   input: string,
 *   config?: Partial<ParserConfig>,
 *   options?: { useLLM?: boolean; useBackend?: boolean }
 * ): Promise<ParseResult> {
 *   // Try Rust backend first (if enabled)
 *   if (options?.useBackend) {
 *     try {
 *       const result = await invoke<ParseResult>('parse_natural_task', { input });
 *       return { ...result, metadata: { ...result.metadata, source: 'rust-backend' } };
 *     } catch (e) {
 *       console.warn('Rust parsing failed, falling back', e);
 *     }
 *   }
 *   
 *   // Try LLM (if enabled)
 *   if (options?.useLLM) {
 *     try {
 *       const llmResult = await callLocalLLM(input);
 *       return { ...llmResult, metadata: { ...llmResult.metadata, source: 'llm-local' } };
 *     } catch (e) {
 *       console.warn('LLM parsing failed, falling back', e);
 *     }
 *   }
 *   
 *   // Fallback to rule-based
 *   return parseNaturalTask(input, config);
 * }
 * ```
 */
export async function parseNaturalTaskAsync(
  input: string,
  config?: Partial<ParserConfig>
): Promise<ParseResult> {
  // [RUST_HOOK] Add Tauri invoke here when ready
  // try {
  //   const result = await invoke<ParseResult>('parse_natural_task', { input, config });
  //   return result;
  // } catch (e) {
  //   console.warn('Backend parsing unavailable, using frontend parser');
  // }
  
  // [AI_HOOK] Add LLM call here when ready
  // try {
  //   const llmResult = await parseWithLLM(input);
  //   if (llmResult.success) return llmResult;
  // } catch (e) {
  //   console.warn('LLM parsing failed, using rule-based fallback');
  // }
  
  // Current: synchronous rule-based parsing
  return parseNaturalTask(input, config);
}

// =============================================================================
// Exports
// =============================================================================

export {
  detectPriority,
  extractTags,
  detectDuration,
  cleanTitle,
  generateSummary,
};
