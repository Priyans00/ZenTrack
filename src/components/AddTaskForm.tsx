/**
 * AddTaskForm Component
 * 
 * A unified task creation component that combines:
 * - Smart Task Input (natural language with optional AI)
 * - Manual Task Form (traditional fields)
 * 
 * BEHAVIOR:
 * ---------
 * - Both input methods are always available
 * - AI enhances the Smart Input when Ollama is available
 * - No AI required for basic functionality
 * - Seamless switching between modes
 */

import { useState, useCallback } from 'react';
import SmartTaskInput from './SmartTaskInput';
import { useAIAvailability } from '../hooks/useAIAvailability';

// =============================================================================
// Types
// =============================================================================

type Task = {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  tags: string[];
  priority: string;
  status: string;
};

export interface AddTaskFormProps {
  /** Called when a task is submitted (from either input method) */
  onSubmit: (task: Omit<Task, 'id'>) => Promise<void>;
  
  /** Default task values for the manual form */
  defaultValues?: Partial<Omit<Task, 'id'>>;
  
  /** Whether the form is in edit mode */
  editMode?: boolean;
  
  /** Edit task id if in edit mode */
  editId?: number | null;
  
  /** Callback when edit is cancelled */
  onCancelEdit?: () => void;
  
  /** Whether the form is disabled */
  disabled?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'In Progress', 'Done'];
const TAG_OPTIONS = ['Work', 'Study', 'Personal'];

const DEFAULT_TASK: Omit<Task, 'id'> = {
  title: '',
  description: '',
  due_date: '',
  tags: [],
  priority: 'Medium',
  status: 'Pending',
};

// =============================================================================
// Component
// =============================================================================

export default function AddTaskForm({
  onSubmit,
  defaultValues,
  editMode = false,
  onCancelEdit,
  disabled = false,
}: AddTaskFormProps) {
  // Form state
  const [form, setForm] = useState<Omit<Task, 'id'>>({
    ...DEFAULT_TASK,
    ...defaultValues,
  });
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Input mode: 'smart' for natural language, 'manual' for form fields
  const [inputMode, setInputMode] = useState<'smart' | 'manual'>('smart');
  
  // AI availability
  const { isAvailable: isAIAvailable } = useAIAvailability();
  
  /**
   * Handle form field changes
   */
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);
  
  /**
   * Handle tag selection
   */
  const handleTagChange = useCallback((tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);
  
  /**
   * Handle form submission (manual mode)
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setForm(DEFAULT_TASK);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSubmit]);
  
  /**
   * Handle smart task confirmation
   */
  const handleSmartConfirm = useCallback(async (task: Task) => {
    await onSubmit({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      tags: task.tags,
      priority: task.priority,
      status: task.status,
    });
  }, [onSubmit]);
  
  /**
   * Handle smart task edit - populates manual form
   */
  const handleSmartEdit = useCallback((task: Omit<Task, 'id'>) => {
    setForm(task);
    setInputMode('manual');
  }, []);
  
  /**
   * Cancel edit mode
   */
  const handleCancel = useCallback(() => {
    setForm(DEFAULT_TASK);
    onCancelEdit?.();
  }, [onCancelEdit]);
  
  return (
    <div 
      className="rounded-xl p-5 space-y-4"
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-color)' 
      }}
    >
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 
          className="font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {editMode ? 'Edit Task' : 'Add Task'}
        </h3>
        
        {!editMode && (
          <div 
            className="flex rounded-lg overflow-hidden text-sm"
            style={{ backgroundColor: 'var(--bg-card-hover)' }}
          >
            <button
              onClick={() => setInputMode('smart')}
              className="px-3 py-1.5 transition-colors"
              style={{
                backgroundColor: inputMode === 'smart' ? 'var(--accent)' : 'transparent',
                color: inputMode === 'smart' ? '#000' : 'var(--text-secondary)',
              }}
            >
              Smart
              {isAIAvailable && inputMode === 'smart' && (
                <span className="ml-1">⚡</span>
              )}
            </button>
            <button
              onClick={() => setInputMode('manual')}
              className="px-3 py-1.5 transition-colors"
              style={{
                backgroundColor: inputMode === 'manual' ? 'var(--accent)' : 'transparent',
                color: inputMode === 'manual' ? '#000' : 'var(--text-secondary)',
              }}
            >
              Manual
            </button>
          </div>
        )}
      </div>
      
      {/* Smart Input Mode */}
      {inputMode === 'smart' && !editMode && (
        <SmartTaskInput
          onConfirm={handleSmartConfirm}
          onEdit={handleSmartEdit}
          disabled={disabled || isSubmitting}
        />
      )}
      
      {/* Manual Form Mode */}
      {(inputMode === 'manual' || editMode) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Task title"
              disabled={disabled || isSubmitting}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          
          {/* Description */}
          <div>
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Task description (optional)"
              rows={2}
              disabled={disabled || isSubmitting}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          
          {/* Due Date & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Due Date
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                disabled={disabled || isSubmitting}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                disabled={disabled || isSubmitting}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Status (only in edit mode) */}
          {editMode && (
            <div>
              <label 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={disabled || isSubmitting}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Tags */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagChange(tag)}
                  disabled={disabled || isSubmitting}
                  className="px-3 py-1 rounded-full text-sm transition-colors"
                  style={{
                    backgroundColor: form.tags.includes(tag) 
                      ? 'var(--accent-dim)' 
                      : 'var(--bg-card-hover)',
                    color: form.tags.includes(tag) 
                      ? 'var(--accent)' 
                      : 'var(--text-secondary)',
                    border: `1px solid ${form.tags.includes(tag) ? 'var(--accent)' : 'var(--border-color)'}`,
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={disabled || isSubmitting || !form.title.trim()}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? 'Saving...' : editMode ? 'Update Task' : 'Add Task'}
            </button>
            
            {editMode && onCancelEdit && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
