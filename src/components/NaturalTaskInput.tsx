/**
 * Natural Language Task Input Component
 * 
 * A React component that provides natural language task input with:
 * - Real-time parsing preview
 * - Confirmation UI
 * - Keyboard shortcuts (Enter to confirm)
 * - Visual feedback for parsed elements
 * 
 * This component demonstrates the UI confirmation pattern for NLP task input.
 */

import { useState, useCallback, KeyboardEvent } from 'react';
import { useNaturalTaskParser } from '../lib/nlp/useNaturalTaskParser';
import { ParsedTask, toAppTask } from '../lib/nlp/types';

// =============================================================================
// Types
// =============================================================================

export interface NaturalTaskInputProps {
  /** Callback when a task is confirmed */
  onTaskConfirm: (task: ReturnType<typeof toAppTask>) => void;
  
  /** Placeholder text for the input */
  placeholder?: string;
  
  /** Whether the input is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Badge component for displaying tags, priority, etc.
 */
function Badge({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'tag' | 'priority-high' | 'priority-low' | 'date' | 'time';
}) {
  const baseStyles = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
  
  const variantStyles: Record<string, string> = {
    default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    'priority-high': "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    'priority-low': "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    date: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    time: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };
  
  return (
    <span className={`${baseStyles} ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}

/**
 * Parsed task preview card.
 */
function ParsedTaskPreview({ 
  task, 
  summary 
}: { 
  task: ParsedTask; 
  summary: { text: string; dueDateDisplay: string | null };
}) {
  return (
    <div 
      className="rounded-xl p-4 space-y-3 animate-fade-in"
      style={{ 
        backgroundColor: 'var(--bg-card-hover)', 
        border: '1px solid var(--border-color)' 
      }}
    >
      {/* Task title */}
      <div>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Task
        </p>
        <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </p>
      </div>
      
      {/* Parsed elements */}
      <div className="flex flex-wrap gap-2">
        {/* Due date */}
        {summary.dueDateDisplay && (
          <Badge variant="date">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {summary.dueDateDisplay}
          </Badge>
        )}
        
        {/* Tags */}
        {task.tags.map((tag) => (
          <Badge key={tag} variant="tag">
            #{tag}
          </Badge>
        ))}
        
        {/* Priority */}
        {task.priority !== 'Medium' && (
          <Badge variant={task.priority === 'High' ? 'priority-high' : 'priority-low'}>
            {task.priority === 'High' ? '⚡' : '📋'} {task.priority} Priority
          </Badge>
        )}
        
        {/* Duration */}
        {task.estimatedMinutes && (
          <Badge variant="time">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {task.estimatedMinutes >= 60 
              ? `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`
              : `${task.estimatedMinutes}m`
            }
          </Badge>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Natural Language Task Input Component
 * 
 * @example
 * ```tsx
 * <NaturalTaskInput
 *   onTaskConfirm={(task) => {
 *     invoke('add_task', { task });
 *   }}
 *   placeholder="Add a task... e.g., 'Finish report tomorrow 5pm #work high priority'"
 * />
 * ```
 */
export default function NaturalTaskInput({
  onTaskConfirm,
  placeholder = "Add a task... e.g., 'Finish report tomorrow 5pm #work'",
  disabled = false,
  className = '',
  autoFocus = false,
}: NaturalTaskInputProps) {
  const [showExamples, setShowExamples] = useState(false);
  
  const {
    input,
    setInput,
    result,
    isParsing,
    isValid,
    reset,
    getAppTask,
  } = useNaturalTaskParser({
    realTimeParsing: true,
    debounceMs: 200,
  });
  
  /**
   * Handle task confirmation.
   */
  const handleConfirm = useCallback(() => {
    const appTask = getAppTask();
    if (appTask) {
      onTaskConfirm(appTask);
      reset();
    }
  }, [getAppTask, onTaskConfirm, reset]);
  
  /**
   * Handle keyboard events.
   */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    // Enter to confirm
    if (e.key === 'Enter' && !e.shiftKey && isValid) {
      e.preventDefault();
      handleConfirm();
    }
    
    // Escape to clear
    if (e.key === 'Escape') {
      reset();
    }
  }, [isValid, handleConfirm, reset]);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input field */}
      <div className="relative">
        <div 
          className="flex items-center rounded-xl overflow-hidden transition-all"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-color)',
            boxShadow: input ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {/* Magic wand icon */}
          <div className="pl-4" style={{ color: 'var(--accent)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          
          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className="flex-1 px-3 py-3 bg-transparent outline-none text-base"
            style={{ color: 'var(--text-primary)' }}
          />
          
          {/* Loading indicator */}
          {isParsing && (
            <div className="pr-3" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          
          {/* Confirm button */}
          {isValid && (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 mr-2 rounded-lg font-medium text-sm transition-colors"
              style={{ 
                backgroundColor: 'var(--accent)', 
                color: 'white',
              }}
            >
              Add Task
            </button>
          )}
          
          {/* Clear button */}
          {input && (
            <button
              onClick={reset}
              className="pr-4 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Clear (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Help toggle */}
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="absolute right-0 -bottom-6 text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {showExamples ? 'Hide examples' : 'Show examples'}
        </button>
      </div>
      
      {/* Examples dropdown */}
      {showExamples && (
        <div 
          className="rounded-lg p-3 text-sm space-y-1"
          style={{ 
            backgroundColor: 'var(--bg-card-hover)', 
            border: '1px solid var(--border-color)' 
          }}
        >
          <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Example inputs:
          </p>
          <ul className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>"<span style={{ color: 'var(--accent)' }}>Finish report tomorrow at 5pm #work high priority</span>"</li>
            <li>"<span style={{ color: 'var(--accent)' }}>Study for exam next monday #college 2 hours</span>"</li>
            <li>"<span style={{ color: 'var(--accent)' }}>Call mom today noon #personal low priority</span>"</li>
            <li>"<span style={{ color: 'var(--accent)' }}>Review PR in 3 days #work</span>"</li>
          </ul>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Press <kbd className="px-1 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>Enter</kbd> to add, 
            <kbd className="px-1 rounded ml-1" style={{ backgroundColor: 'var(--bg-card)' }}>Esc</kbd> to clear
          </p>
        </div>
      )}
      
      {/* Parse preview */}
      {result?.success && result.task && result.summary && (
        <ParsedTaskPreview 
          task={result.task} 
          summary={result.summary} 
        />
      )}
      
      {/* Parse error */}
      {result && !result.success && input.trim() && (
        <div 
          className="rounded-lg p-3 text-sm"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)' 
          }}
        >
          {result.error || 'Could not parse task. Try adding more details.'}
        </div>
      )}
      
      {/* Parse metadata (debug mode - can be hidden in production) */}
      {import.meta.env.DEV && result?.metadata && (
        <details className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <summary className="cursor-pointer">Debug info</summary>
          <pre className="mt-2 p-2 rounded overflow-auto" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
            {JSON.stringify(result.metadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// =============================================================================
// Compact Variant
// =============================================================================

/**
 * Compact version for embedding in task lists or modals.
 */
export function NaturalTaskInputCompact({
  onTaskConfirm,
  placeholder = "Quick add task...",
}: Pick<NaturalTaskInputProps, 'onTaskConfirm' | 'placeholder'>) {
  const { input, setInput, isValid, getAppTask, reset } = useNaturalTaskParser({
    realTimeParsing: true,
    debounceMs: 300,
  });
  
  const handleSubmit = () => {
    const appTask = getAppTask();
    if (appTask) {
      onTaskConfirm(appTask);
      reset();
    }
  };
  
  return (
    <div 
      className="flex items-center rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-card-hover)', 
        border: '1px solid var(--border-color)' 
      }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && isValid && handleSubmit()}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 bg-transparent outline-none text-sm"
        style={{ color: 'var(--text-primary)' }}
      />
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className="px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        style={{ color: isValid ? 'var(--accent)' : 'var(--text-muted)' }}
      >
        Add
      </button>
    </div>
  );
}
