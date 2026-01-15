/**
 * Ollama Client
 * 
 * A production-ready client for interacting with a local Ollama server.
 * Designed for optional AI features with graceful degradation.
 * 
 * FEATURES:
 * ---------
 * - Cancellable requests via AbortController
 * - Configurable timeouts
 * - Silent failure with fallback support
 * - JSON mode for structured outputs
 * - Type-safe API
 * 
 * USAGE:
 * ------
 * const client = new OllamaClient();
 * const result = await client.parseTask("Finish report by Friday 5pm");
 * if (result.success) {
 *   console.log(result.task);
 * }
 */

import {
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  AITaskParseResult,
  AIParseResponse,
  OLLAMA_CONFIG,
} from './types';
import { checkOllamaAvailability, getCachedAvailability } from './availability';

// =============================================================================
// Prompts
// =============================================================================

/**
 * System prompt for task parsing.
 * Optimized for small local models to produce consistent JSON output.
 */
const TASK_PARSE_PROMPT = `You are a task parser. Extract structured data from the user's natural language task description.

RULES:
1. Extract the task title (what needs to be done)
2. Parse any date/time mentioned (convert to ISO format: YYYY-MM-DDTHH:MM:SS or just YYYY-MM-DD)
3. Determine priority: "High", "Medium", or "Low" (default to "Medium" if not mentioned)
4. Extract tags/categories as an array (look for #hashtags or topic keywords)

OUTPUT FORMAT (strict JSON, no explanation):
{
  "title": "the task description",
  "due_date": "YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS or empty string",
  "priority": "High" or "Medium" or "Low",
  "tags": ["tag1", "tag2"]
}

EXAMPLES:
Input: "Finish math homework by tomorrow 5pm #school high priority"
Output: {"title":"Finish math homework","due_date":"2026-01-15T17:00:00","priority":"High","tags":["school"]}

Input: "Call mom"
Output: {"title":"Call mom","due_date":"","priority":"Medium","tags":[]}

Input: "Submit report friday #work #urgent"
Output: {"title":"Submit report","due_date":"2026-01-17","priority":"High","tags":["work","urgent"]}

Today's date is: ${new Date().toISOString().split('T')[0]}

Now parse this task:`;

// =============================================================================
// Client Class
// =============================================================================

export class OllamaClient {
  private baseUrl: string;
  private currentAbortController: AbortController | null = null;
  
  constructor(baseUrl: string = OLLAMA_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  // ===========================================================================
  // Core API Methods
  // ===========================================================================
  
  /**
   * Generate text from Ollama.
   * This is a low-level method - prefer using parseTask() for task parsing.
   * 
   * @param request - Generation request parameters
   * @param timeout - Request timeout in milliseconds
   * @returns Generated response or null on failure
   */
  async generate(
    request: OllamaGenerateRequest,
    timeout: number = OLLAMA_CONFIG.GENERATE_TIMEOUT
  ): Promise<OllamaGenerateResponse | null> {
    // Cancel any existing request
    this.cancel();
    
    this.currentAbortController = new AbortController();
    const timeoutId = setTimeout(() => this.cancel(), timeout);
    
    try {
      const response = await fetch(
        `${this.baseUrl}${OLLAMA_CONFIG.ENDPOINTS.GENERATE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...request,
            stream: false, // Always disable streaming for simplicity
          }),
          signal: this.currentAbortController.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch {
      // Silently fail - AI is optional
      return null;
    } finally {
      this.currentAbortController = null;
    }
  }
  
  /**
   * Cancel the current request if one is in progress.
   */
  cancel(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }
  
  // ===========================================================================
  // Task Parsing
  // ===========================================================================
  
  /**
   * Parse a natural language task description using AI.
   * 
   * This method:
   * - Checks AI availability first
   * - Uses JSON mode for structured output
   * - Has a timeout to prevent UI blocking
   * - Returns a detailed result with success/failure info
   * 
   * @param input - Natural language task description
   * @returns Parsed task result with metadata
   */
  async parseTask(input: string): Promise<AIParseResponse> {
    const startTime = Date.now();
    
    // Check availability
    const availability = getCachedAvailability() ?? await checkOllamaAvailability();
    
    if (!availability.available || !availability.preferredModel) {
      return {
        success: false,
        task: null,
        error: 'AI not available',
        usedFallback: true,
        duration: Date.now() - startTime,
      };
    }
    
    try {
      const response = await this.generate({
        model: availability.preferredModel,
        prompt: `${TASK_PARSE_PROMPT}\n\n"${input}"`,
        format: 'json',
        options: {
          temperature: 0.1, // Low temperature for consistent output
          num_predict: 256, // Limit token generation
        },
      });
      
      if (!response?.response) {
        return {
          success: false,
          task: null,
          error: 'No response from AI',
          usedFallback: true,
          duration: Date.now() - startTime,
        };
      }
      
      // Parse JSON response
      const task = this.parseJsonResponse(response.response);
      
      if (!task) {
        return {
          success: false,
          task: null,
          error: 'Failed to parse AI response',
          usedFallback: true,
          duration: Date.now() - startTime,
        };
      }
      
      return {
        success: true,
        task,
        usedFallback: false,
        duration: Date.now() - startTime,
      };
    } catch {
      return {
        success: false,
        task: null,
        error: 'AI request failed',
        usedFallback: true,
        duration: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Parse and validate JSON response from the model.
   * 
   * @param response - Raw response string from the model
   * @returns Parsed task or null if invalid
   */
  private parseJsonResponse(response: string): AITaskParseResult | null {
    try {
      // Try to extract JSON from the response (models sometimes add extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (typeof parsed.title !== 'string' || !parsed.title.trim()) {
        return null;
      }
      
      // Normalize and validate the result
      return {
        title: parsed.title.trim(),
        due_date: this.normalizeDueDate(parsed.due_date),
        priority: this.normalizePriority(parsed.priority),
        tags: this.normalizeTags(parsed.tags),
      };
    } catch {
      return null;
    }
  }
  
  /**
   * Normalize due_date field from AI response.
   */
  private normalizeDueDate(value: unknown): string {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    // Basic validation - should be ISO date format
    if (trimmed && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed;
    }
    return '';
  }
  
  /**
   * Normalize priority field from AI response.
   */
  private normalizePriority(value: unknown): string {
    if (typeof value !== 'string') return 'Medium';
    const normalized = value.trim();
    if (['High', 'Medium', 'Low'].includes(normalized)) {
      return normalized;
    }
    // Handle lowercase/variations
    const lower = normalized.toLowerCase();
    if (lower === 'high' || lower === 'urgent' || lower === 'important') return 'High';
    if (lower === 'low' || lower === 'minor') return 'Low';
    return 'Medium';
  }
  
  /**
   * Normalize tags field from AI response.
   */
  private normalizeTags(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((tag): tag is string => typeof tag === 'string')
      .map((tag) => tag.trim().replace(/^#/, '')) // Remove # prefix if present
      .filter((tag) => tag.length > 0);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/** Default Ollama client instance */
export const ollamaClient = new OllamaClient();

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Parse a task using the default Ollama client.
 * Convenience function for quick usage.
 * 
 * @param input - Natural language task description
 * @returns Parsed task result
 */
export async function parseTaskWithAI(input: string): Promise<AIParseResponse> {
  return ollamaClient.parseTask(input);
}

/**
 * Cancel any ongoing AI request.
 */
export function cancelAIRequest(): void {
  ollamaClient.cancel();
}
