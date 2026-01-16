/**
 * AI Assistant Panel
 * 
 * A slide-over chat panel for interacting with the local AI assistant.
 * This component provides a conversational interface for querying
 * tasks, productivity data, and getting insights.
 * 
 * ARCHITECTURE:
 * -------------
 * - Read-only: AI cannot modify data directly
 * - Context-aware: Receives summarized task/productivity data
 * - Non-blocking: All AI calls are cancellable with timeouts
 * - Extensible: Designed for future action suggestions and rich messages
 * 
 * FUTURE EXTENSIONS:
 * ------------------
 * [ACTION_BUTTONS] - Add action suggestions to AI messages
 * [RICH_MESSAGES] - Support cards, charts, task previews
 * [STREAMING] - Stream AI responses for better UX
 */

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { useAppStore, Task, TimeEntry } from '../state/appStore';
import { useAIAvailability } from '../hooks/useAIAvailability';
import { ollamaClient, getCachedAvailability } from '../ai';

// =============================================================================
// Types
// =============================================================================

/**
 * Message roles for the chat.
 * 
 * FUTURE: Add 'action' type for actionable suggestions
 */
type MessageRole = 'user' | 'ai' | 'system';

/**
 * Chat message structure.
 * 
 * FUTURE EXTENSIONS:
 * - Add 'actions?: ActionButton[]' for clickable suggestions
 * - Add 'card?: TaskCard | ChartCard' for rich content
 * - Add 'metadata?: { confidence, sources }' for transparency
 */
interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  /** Whether this message is still being generated */
  isLoading?: boolean;
  /** Error state for failed messages */
  error?: boolean;
}

/**
 * Context summary passed to AI for awareness.
 * Kept lightweight to fit in context window.
 */
interface AIContext {
  todaysTasks: Array<{ title: string; status: string; priority: string }>;
  overdueTasks: number;
  pendingTasks: number;
  completedToday: number;
  totalTimeToday: number; // minutes
  currentStreak: number;
}

export interface AIAssistantPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const ASSISTANT_SYSTEM_PROMPT = `You are a helpful productivity assistant for ZenTrack, a task management app.
You can answer questions about the user's tasks, productivity, and provide helpful suggestions.

IMPORTANT RULES:
1. You are READ-ONLY - you cannot create, modify, or delete tasks directly
2. If the user asks to perform an action, explain what they should do in the app
3. Be concise and helpful
4. Focus on productivity insights and task management advice
5. Reference specific tasks when relevant

Current date and time: {{CURRENT_DATE}}

USER'S CURRENT DATA:
{{CONTEXT}}

Respond naturally to the user's questions about their tasks and productivity.`;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique message ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a task is overdue
 */
function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'Done') return false;
  return new Date(task.due_date) < new Date();
}

/**
 * Check if a task is due today
 */
function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const date = new Date(dateStr);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Get total time tracked today in minutes
 */
function getTodayTimeMinutes(entries: TimeEntry[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return entries
    .filter((e) => new Date(e.start_time) >= today)
    .reduce((sum, e) => sum + (e.duration || 0), 0);
}

/**
 * Build context summary for AI
 */
function buildContext(tasks: Task[], timeEntries: TimeEntry[], streak: number): AIContext {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get today's tasks (due today or with activity today)
  const todaysTasks = tasks
    .filter((t) => isToday(t.due_date) || t.status !== 'Done')
    .slice(0, 10) // Limit to avoid context overflow
    .map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
    }));
  
  return {
    todaysTasks,
    overdueTasks: tasks.filter(isOverdue).length,
    pendingTasks: tasks.filter((t) => t.status === 'Pending').length,
    completedToday: tasks.filter((t) => t.status === 'Done' && isToday(t.due_date)).length,
    totalTimeToday: getTodayTimeMinutes(timeEntries),
    currentStreak: streak,
  };
}

/**
 * Format context for AI prompt
 */
function formatContextForPrompt(ctx: AIContext): string {
  const lines = [
    `Tasks for today: ${ctx.todaysTasks.length}`,
    ctx.todaysTasks.length > 0
      ? ctx.todaysTasks.map((t) => `  - "${t.title}" (${t.status}, ${t.priority})`).join('\n')
      : '  (No tasks scheduled for today)',
    `Overdue tasks: ${ctx.overdueTasks}`,
    `Pending tasks: ${ctx.pendingTasks}`,
    `Completed today: ${ctx.completedToday}`,
    `Time tracked today: ${ctx.totalTimeToday} minutes`,
    `Current streak: ${ctx.currentStreak} days`,
  ];
  
  return lines.join('\n');
}

/**
 * Build the full prompt with context
 */
function buildPrompt(context: AIContext, conversationHistory: ChatMessage[]): string {
  const contextStr = formatContextForPrompt(context);
  const currentDate = new Date().toLocaleString();
  
  let prompt = ASSISTANT_SYSTEM_PROMPT
    .replace('{{CURRENT_DATE}}', currentDate)
    .replace('{{CONTEXT}}', contextStr);
  
  // Add conversation history (last 6 messages to stay within context)
  const recentMessages = conversationHistory
    .filter((m) => m.role !== 'system' && !m.isLoading)
    .slice(-6);
  
  if (recentMessages.length > 0) {
    prompt += '\n\nCONVERSATION HISTORY:\n';
    for (const msg of recentMessages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      prompt += `${role}: ${msg.content}\n`;
    }
  }
  
  return prompt;
}

// =============================================================================
// Component
// =============================================================================

// Track if scope message has been shown this session (persists across panel open/close)
let hasShownScopeMessage = false;

export default function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiWasAvailable, setAiWasAvailable] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Store data
  const { tasks, timeEntries, streak } = useAppStore();
  
  // AI availability
  const { isAvailable, preferredModel } = useAIAvailability();
  
  // Detect when AI becomes unavailable during session
  useEffect(() => {
    if (isOpen && aiWasAvailable && !isAvailable && messages.length > 0) {
      // AI became unavailable mid-session
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'system',
          content: 'Local AI is no longer available. You can continue using ZenTrack normally.',
          timestamp: new Date(),
          error: true,
        },
      ]);
      
      // Cancel any in-progress generation
      if (isGenerating) {
        abortControllerRef.current?.abort();
        ollamaClient.cancel();
        setIsGenerating(false);
      }
    }
    setAiWasAvailable(isAvailable);
  }, [isAvailable, isOpen, messages.length, aiWasAvailable, isGenerating]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
  
  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMessages: ChatMessage[] = [];
      
      // Add scope explanation (only once per session)
      if (!hasShownScopeMessage) {
        initialMessages.push({
          id: generateId(),
          role: 'system',
          content: "I can see today's tasks, recent activity, and time tracking. I can suggest changes, but I won't modify anything without your confirmation.",
          timestamp: new Date(),
        });
        hasShownScopeMessage = true;
      }
      
      // Add welcome message
      initialMessages.push({
        id: generateId(),
        role: 'ai',
        content: "Hi! I'm your productivity assistant. Ask me about your tasks, schedule, or productivity tips. What would you like to know?",
        timestamp: new Date(),
      });
      
      setMessages(initialMessages);
    }
  }, [isOpen, messages.length]);
  
  /**
   * Send a message to the AI
   */
  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isGenerating) return;
    
    // Check AI availability (defensive)
    if (!isAvailable) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'system',
          content: 'AI is currently unavailable. Please ensure Ollama is running with a compatible model.',
          timestamp: new Date(),
          error: true,
        },
      ]);
      return;
    }
    
    // Double-check availability from source
    const availability = getCachedAvailability();
    if (!availability?.available || !availability?.preferredModel) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'system',
          content: 'AI is currently unavailable. Please ensure Ollama is running with a compatible model.',
          timestamp: new Date(),
          error: true,
        },
      ]);
      return;
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };
    
    // Add placeholder for AI response
    const aiMessageId = generateId();
    const aiPlaceholder: ChatMessage = {
      id: aiMessageId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    
    setMessages((prev) => [...prev, userMessage, aiPlaceholder]);
    setInput('');
    setIsGenerating(true);
    
    try {
      // Build context and prompt
      const context = buildContext(tasks, timeEntries, streak.current_streak);
      const conversationHistory = [...messages, userMessage];
      const systemPrompt = buildPrompt(context, conversationHistory);
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Generate response (defensive - catch all errors)
      let response = null;
      try {
        response = await ollamaClient.generate({
          model: availability.preferredModel,
          prompt: `${systemPrompt}\n\nUser: ${trimmedInput}\n\nAssistant:`,
          options: {
            temperature: 0.7,
            num_predict: 512,
          },
        });
      } catch (genError) {
        // Silently handle generation errors
        response = null;
      }
      
      // Update AI message with response
      const aiContent = response?.response?.trim() || '';
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: aiContent || 'I apologize, but I was unable to generate a response.',
                isLoading: false,
                error: !aiContent,
              }
            : msg
        )
      );
    } catch (error) {
      // Handle errors silently with inline message (no crash, no popup)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: 'Unable to reach AI. Please try again or reset the chat.',
                isLoading: false,
                error: true,
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [input, isGenerating, messages, tasks, timeEntries, streak.current_streak, isAvailable]);
  
  /**
   * Handle keyboard input
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [sendMessage, onClose]
  );
  
  /**
   * Cancel current generation
   */
  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    ollamaClient.cancel();
    setIsGenerating(false);
    
    // Update loading message to cancelled
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isLoading
          ? { ...msg, content: 'Response cancelled.', isLoading: false, error: true }
          : msg
      )
    );
  }, []);
  
  /**
   * Reset chat - clear messages and start fresh
   */
  const resetChat = useCallback(() => {
    // Cancel any in-progress generation
    abortControllerRef.current?.abort();
    ollamaClient.cancel();
    setIsGenerating(false);
    
    // Clear messages and add system message
    setMessages([
      {
        id: generateId(),
        role: 'system',
        content: 'New conversation started.',
        timestamp: new Date(),
      },
    ]);
    
    // Clear input
    setInput('');
  }, []);
  
  // Don't render if not open
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl animate-slide-in-right"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-dim)' }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: 'var(--accent)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-4.5 4.5m0 0l-4.5-4.5m4.5 4.5V3"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                AI Assistant
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isAvailable ? `Using ${preferredModel}` : 'Connecting...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={resetChat}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
              style={{ color: 'var(--text-secondary)' }}
              title="Reset Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
              style={{ color: 'var(--text-secondary)' }}
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div
          className="p-4 border-t"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !isAvailable
                  ? 'AI unavailable'
                  : isGenerating
                  ? 'Waiting for response...'
                  : 'Ask about your tasks...'
              }
              disabled={isGenerating || !isAvailable}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                opacity: !isAvailable ? 0.5 : 1,
              }}
            />
            
            {isGenerating ? (
              <button
                onClick={cancelGeneration}
                className="p-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !isAvailable}
                className="p-3 rounded-xl transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: input.trim() && isAvailable ? 'var(--accent)' : 'var(--bg-card-hover)',
                  color: input.trim() && isAvailable ? '#000' : 'var(--text-muted)',
                }}
                title={!isAvailable ? 'AI unavailable' : 'Send (Enter)'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            )}
          </div>
          
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
            AI responses are for reference only. Always verify important information.
          </p>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Message Bubble Component
// =============================================================================

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  // System messages (errors, info)
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div
          className="px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: message.error ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)',
            color: message.error ? 'var(--danger)' : 'var(--text-muted)',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }
  
  // Loading state
  if (message.isLoading) {
    return (
      <div className="flex justify-start">
        <div
          className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: 'var(--accent)', animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: 'var(--accent)', animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: 'var(--accent)', animationDelay: '300ms' }}
              />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Thinking...
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // User and AI messages
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isUser ? 'rounded-br-md' : 'rounded-bl-md'
        }`}
        style={{
          backgroundColor: isUser ? 'var(--accent)' : 'var(--bg-card)',
          color: isUser ? '#1a1200' : 'var(--text-primary)',
        }}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {/* FUTURE: Action buttons would go here */}
        {/* [ACTION_BUTTONS] */}
        
        {/* FUTURE: Rich content cards would go here */}
        {/* [RICH_MESSAGES] */}
        
        {message.error && !isUser && (
          <p className="text-xs mt-2 opacity-70">
            ⚠️ There was an issue generating this response.
          </p>
        )}
      </div>
    </div>
  );
}
