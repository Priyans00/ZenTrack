/**
 * React Hook for Natural Language Task Parsing
 * 
 * Provides a convenient hook interface for parsing natural language task input
 * with debouncing, loading states, and error handling.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { parseNaturalTask, parseNaturalTaskAsync } from './taskParser';
import { ParseResult, ParsedTask, ParserConfig, toAppTask } from './types';

// =============================================================================
// Types
// =============================================================================

export interface UseNaturalTaskParserOptions {
  /** Debounce delay in milliseconds for real-time parsing (default: 300) */
  debounceMs?: number;
  
  /** Enable real-time parsing as user types */
  realTimeParsing?: boolean;
  
  /** Parser configuration */
  config?: Partial<ParserConfig>;
  
  /** Callback when parsing completes */
  onParseComplete?: (result: ParseResult) => void;
  
  /** Callback when task is confirmed */
  onConfirm?: (task: ParsedTask) => void;
}

export interface UseNaturalTaskParserReturn {
  /** Current input value */
  input: string;
  
  /** Set input value */
  setInput: (value: string) => void;
  
  /** Current parse result */
  result: ParseResult | null;
  
  /** Whether parsing is in progress */
  isParsing: boolean;
  
  /** Parse the current input manually */
  parse: () => void;
  
  /** Parse specific input and return result */
  parseInput: (input: string) => ParseResult;
  
  /** Reset input and result */
  reset: () => void;
  
  /** Confirm the current parsed task */
  confirm: () => void;
  
  /** Get task in app-compatible format */
  getAppTask: () => ReturnType<typeof toAppTask> | null;
  
  /** Whether the current parse is valid and confirmable */
  isValid: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for natural language task parsing.
 * 
 * @example
 * ```tsx
 * function TaskInput() {
 *   const {
 *     input,
 *     setInput,
 *     result,
 *     isParsing,
 *     isValid,
 *     confirm,
 *     getAppTask
 *   } = useNaturalTaskParser({
 *     realTimeParsing: true,
 *     onConfirm: (task) => addTask(task)
 *   });
 * 
 *   return (
 *     <div>
 *       <input value={input} onChange={e => setInput(e.target.value)} />
 *       {result?.summary && <p>{result.summary.text}</p>}
 *       <button onClick={confirm} disabled={!isValid}>Add Task</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNaturalTaskParser(
  options: UseNaturalTaskParserOptions = {}
): UseNaturalTaskParserReturn {
  const {
    debounceMs = 300,
    realTimeParsing = true,
    config,
    onParseComplete,
    onConfirm,
  } = options;
  
  const [input, setInputState] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  // Debounce timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  
  /**
   * Parse specific input and return result.
   */
  const parseInput = useCallback((inputText: string): ParseResult => {
    return parseNaturalTask(inputText, config);
  }, [config]);
  
  /**
   * Parse current input.
   */
  const parse = useCallback(() => {
    if (!input.trim()) {
      setResult(null);
      return;
    }
    
    setIsParsing(true);
    
    // Use async version for future AI compatibility
    parseNaturalTaskAsync(input, config)
      .then((parseResult) => {
        setResult(parseResult);
        onParseComplete?.(parseResult);
      })
      .finally(() => {
        setIsParsing(false);
      });
  }, [input, config, onParseComplete]);
  
  /**
   * Set input with optional real-time parsing.
   */
  const setInput = useCallback((value: string) => {
    setInputState(value);
    
    if (!realTimeParsing) return;
    
    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Don't parse empty input
    if (!value.trim()) {
      setResult(null);
      return;
    }
    
    // Debounce parsing
    debounceTimer.current = setTimeout(() => {
      setIsParsing(true);
      const parseResult = parseNaturalTask(value, config);
      setResult(parseResult);
      setIsParsing(false);
      onParseComplete?.(parseResult);
    }, debounceMs);
  }, [realTimeParsing, debounceMs, config, onParseComplete]);
  
  /**
   * Reset input and result.
   */
  const reset = useCallback(() => {
    setInputState('');
    setResult(null);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);
  
  /**
   * Confirm the current parsed task.
   */
  const confirm = useCallback(() => {
    if (result?.success && result.task) {
      onConfirm?.(result.task);
      reset();
    }
  }, [result, onConfirm, reset]);
  
  /**
   * Get task in app-compatible format.
   */
  const getAppTask = useCallback(() => {
    if (result?.success && result.task) {
      return toAppTask(result.task);
    }
    return null;
  }, [result]);
  
  /**
   * Whether the current parse is valid and confirmable.
   */
  const isValid = Boolean(result?.success && result.task?.title);
  
  return {
    input,
    setInput,
    result,
    isParsing,
    parse,
    parseInput,
    reset,
    confirm,
    getAppTask,
    isValid,
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Simple hook for one-off parsing without state management.
 * 
 * @example
 * ```tsx
 * function QuickParse() {
 *   const parse = useTaskParser();
 *   
 *   const handleSubmit = (input: string) => {
 *     const result = parse(input);
 *     if (result.success) {
 *       console.log(result.task);
 *     }
 *   };
 * }
 * ```
 */
export function useTaskParser(config?: Partial<ParserConfig>) {
  return useCallback(
    (input: string) => parseNaturalTask(input, config),
    [config]
  );
}
