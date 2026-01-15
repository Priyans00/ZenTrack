/**
 * SmartTaskInput Component
 * 
 * A natural language task input that shows a structured preview before saving.
 * This component augments the existing manual task form - it does NOT replace it.
 * 
 * ARCHITECTURE:
 * -------------
 * The parsing logic uses a dual-mode approach:
 * 
 * 1. AI Mode (when Ollama is available):
 *    - Uses local LLM for natural language understanding
 *    - Falls back to rule-based if AI fails
 *    - Shows "⚡ AI Enabled" badge
 * 
 * 2. Rule-Based Mode (default/fallback):
 *    - Fast, offline parsing using pattern matching
 *    - Always available, no external dependencies
 * 
 * Both modes produce the same output format for seamless integration.
 */

import { useState, useCallback, useEffect, KeyboardEvent } from 'react';
import { parseNaturalTaskAsync, ParseResult, toAppTask } from '../lib/nlp';
import { useAIAvailability } from '../hooks/useAIAvailability';
import { parseTaskWithAI, cancelAIRequest } from '../ai';

// =============================================================================
// Types
// =============================================================================

/** Task format expected by the parent component (matches Tauri backend) */
type TaskData = {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  tags: string[];
  priority: string;
  status: string;
};

export interface SmartTaskInputProps {
  /** Called when user confirms the parsed task - triggers save to database */
  onConfirm: (task: TaskData) => Promise<void>;
  
  /** Called when user clicks Edit - populates the manual form */
  onEdit: (task: Omit<TaskData, 'id'>) => void;
  
  /** Whether the input is disabled (e.g., during save) */
  disabled?: boolean;
}

// =============================================================================
// Subcomponents
// =============================================================================

/** Priority badge with appropriate styling */
function PriorityBadge({ priority }: { priority: string }) {
  const badgeClass = {
    High: 'badge-danger',
    Medium: 'badge-warning',
    Low: 'badge-success',
  }[priority] || 'badge-neutral';
  
  return <span className={`badge ${badgeClass}`}>{priority}</span>;
}

/** Status badge with appropriate styling */
function StatusBadge({ status }: { status: string }) {
  const badgeClass = {
    Done: 'badge-success',
    'In Progress': 'badge-warning',
    Pending: 'badge-neutral',
  }[status] || 'badge-neutral';
  
  return <span className={`badge ${badgeClass}`}>{status}</span>;
}

/** Tag chip component */
function TagChip({ tag }: { tag: string }) {
  return (
    <span 
      className="px-2 py-1 rounded-md text-xs font-medium"
      style={{ 
        backgroundColor: 'var(--accent-dim)', 
        color: 'var(--accent)' 
      }}
    >
      #{tag}
    </span>
  );
}

/**
 * Format ISO date string for display.
 */
function formatDateForDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    
    // Add time if present
    if (dateStr.includes('T')) {
      options.hour = 'numeric';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
  } catch {
    return dateStr;
  }
}

// =============================================================================
// Preview Card
// =============================================================================

interface PreviewCardProps {
  result: ParseResult;
  onConfirm: () => void;
  onEdit: () => void;
  isLoading: boolean;
  /** Whether AI was used for parsing */
  usedAI?: boolean;
}

function PreviewCard({ result, onConfirm, onEdit, isLoading, usedAI = false }: PreviewCardProps) {
  const task = result.task!;
  const summary = result.summary!;
  
  return (
    <div 
      className="rounded-xl p-4 space-y-4 animate-fade-in"
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--accent)',
        boxShadow: '0 0 0 1px var(--accent-dim)'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-dim)' }}
        >
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
          Preview
        </span>
        {usedAI && (
          <span 
            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}
            title="Parsed using local AI"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            AI
          </span>
        )}
        {result.metadata.confidence === 'low' && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--warning)', color: '#000' }}>
            Low confidence
          </span>
        )}
      </div>
      
      {/* Task Title */}
      <div>
        <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </h4>
      </div>
      
      {/* Task Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Due Date */}
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Due Date
          </span>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{summary.dueDateDisplay || 'Not set'}</span>
          </div>
        </div>
        
        {/* Priority */}
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Priority
          </span>
          <div>
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
        
        {/* Status */}
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Status
          </span>
          <div>
            <StatusBadge status={task.status} />
          </div>
        </div>
        
        {/* Duration (if detected) */}
        {task.estimatedMinutes && (
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Estimated
            </span>
            <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {task.estimatedMinutes >= 60 
                  ? `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`
                  : `${task.estimatedMinutes}m`
                }
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm
            </>
          )}
        </button>
        <button
          onClick={onEdit}
          disabled={isLoading}
          className="btn btn-secondary flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function SmartTaskInput({ onConfirm, onEdit, disabled = false }: SmartTaskInputProps) {
  // Input state
  const [input, setInput] = useState('');
  
  // Parse result state - null means no parsing attempted yet
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  
  // Loading states
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Whether AI was used for the current parse result
  const [usedAI, setUsedAI] = useState(false);
  
  // Error state for inline error display
  const [error, setError] = useState<string | null>(null);
  
  // AI availability hook - checks Ollama status
  const { isAvailable: isAIAvailable, preferredModel } = useAIAvailability();
  
  // Cleanup: cancel AI request when component unmounts
  useEffect(() => {
    return () => {
      cancelAIRequest();
    };
  }, []);
  
  /**
   * Parse the current input using AI if available, with fallback to rule-based.
   */
  const handleParse = useCallback(async () => {
    if (!input.trim()) {
      setParseResult(null);
      setError(null);
      setUsedAI(false);
      return;
    }
    
    setIsParsing(true);
    setError(null);
    setUsedAI(false);
    
    try {
      let result: ParseResult | null = null;
      let aiUsed = false;
      
      // Try AI parsing first if available
      if (isAIAvailable && preferredModel) {
        const aiResult = await parseTaskWithAI(input);
        
        if (aiResult.success && aiResult.task) {
          // Convert AI result to ParseResult format
          result = {
            success: true,
            task: {
              title: aiResult.task.title,
              description: '',
              dueDate: aiResult.task.due_date ? aiResult.task.due_date.split('T')[0] : null,
              dueTime: aiResult.task.due_date?.includes('T') 
                ? aiResult.task.due_date.split('T')[1]?.substring(0, 5) || null 
                : null,
              dueDatetime: aiResult.task.due_date || null,
              tags: aiResult.task.tags,
              priority: aiResult.task.priority as 'Low' | 'Medium' | 'High',
              status: 'Pending',
            },
            metadata: {
              originalInput: input,
              extractedSegments: {},
              confidence: 'high',
              source: 'llm-local',
              parseTimeMs: aiResult.duration,
              warnings: [],
            },
            summary: {
              text: `${aiResult.task.title}`,
              dueDateDisplay: aiResult.task.due_date 
                ? formatDateForDisplay(aiResult.task.due_date) 
                : null,
              needsConfirmation: true,
            },
          };
          aiUsed = true;
        }
      }
      
      // Fallback to rule-based parsing if AI failed or unavailable
      if (!result) {
        result = await parseNaturalTaskAsync(input);
      }
      
      setParseResult(result);
      setUsedAI(aiUsed);
      
      if (!result.success) {
        setError(result.error || 'Could not parse task. Try adding more details.');
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError('An unexpected error occurred while parsing.');
      setParseResult(null);
      setUsedAI(false);
    } finally {
      setIsParsing(false);
    }
  }, [input, isAIAvailable, preferredModel]);
  
  /**
   * Handle keyboard events - Enter triggers parsing
   */
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParse();
    }
    if (e.key === 'Escape') {
      setInput('');
      setParseResult(null);
      setError(null);
    }
  }, [handleParse]);
  
  /**
   * Confirm and save the parsed task.
   */
  const handleConfirm = useCallback(async () => {
    if (!parseResult?.success || !parseResult.task) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Convert to app task format (includes id: 0 for new tasks)
      const appTask = toAppTask(parseResult.task);
      
      // Call parent's save handler (invokes Tauri command)
      await onConfirm(appTask);
      
      // Clear input on success
      setInput('');
      setParseResult(null);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [parseResult, onConfirm]);
  
  /**
   * Populate the manual form with parsed data for editing.
   */
  const handleEdit = useCallback(() => {
    if (!parseResult?.success || !parseResult.task) return;
    
    const task = parseResult.task;
    
    // Convert to manual form format
    const formData: Omit<TaskData, 'id'> = {
      title: task.title,
      description: task.description || '',
      due_date: task.dueDatetime || '',
      tags: task.tags,
      priority: task.priority,
      status: task.status,
    };
    
    // Call parent's edit handler
    onEdit(formData);
    
    // Clear smart input
    setInput('');
    setParseResult(null);
  }, [parseResult, onEdit]);
  
  /**
   * Clear the input and results.
   */
  const handleClear = useCallback(() => {
    setInput('');
    setParseResult(null);
    setError(null);
    setUsedAI(false);
    cancelAIRequest(); // Cancel any in-flight AI request
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Input Field */}
      <div className="relative">
        <div 
          className="flex items-center rounded-xl overflow-hidden transition-all"
          style={{ 
            backgroundColor: 'var(--bg-card-hover)', 
            border: `1px solid ${parseResult?.success ? 'var(--accent)' : 'var(--border-color)'}`,
          }}
        >
          {/* Magic Wand Icon */}
          <div className="pl-4 flex-shrink-0" style={{ color: 'var(--accent)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          
          {/* Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Clear previous results when typing
              if (parseResult) setParseResult(null);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Finish math assignment tomorrow 6pm #college high"
            disabled={disabled || isSaving}
            className="flex-1 px-3 py-3 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          
          {/* Loading Indicator */}
          {isParsing && (
            <div className="pr-2" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          
          {/* Parse Button */}
          {input.trim() && !isParsing && (
            <button
              onClick={handleParse}
              disabled={disabled || isSaving}
              className="px-4 py-2 mr-1 rounded-lg text-sm font-medium transition-colors"
              style={{ 
                backgroundColor: 'var(--accent)', 
                color: '#000',
              }}
            >
              Parse
            </button>
          )}
          
          {/* Clear Button */}
          {input && (
            <button
              onClick={handleClear}
              disabled={isSaving}
              className="pr-3 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Clear (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Helper Text with AI Status */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>Enter</kbd> to parse • 
            Supports dates, times, #tags, and priority keywords
          </p>
          
          {/* AI Status Badge */}
          {isAIAvailable ? (
            <span 
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}
              title={`AI Enabled - Using ${preferredModel}`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              AI Enabled (Local)
            </span>
          ) : (
            <span 
              className="text-xs cursor-help"
              style={{ color: 'var(--text-muted)' }}
              title="Install Ollama to unlock local AI features"
            >
              <span className="opacity-60">AI unavailable</span>
            </span>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div 
          className="flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)' 
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      {/* Preview Card - Only shown when parsing succeeds */}
      {parseResult?.success && parseResult.task && parseResult.summary && (
        <PreviewCard
          result={parseResult}
          onConfirm={handleConfirm}
          onEdit={handleEdit}
          isLoading={isSaving}
          usedAI={usedAI}
        />
      )}
    </div>
  );
}
