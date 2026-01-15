# ZenTrack AI Layer — Developer Documentation

This document explains the architecture and constraints of the local AI integration in ZenTrack.

---

## Purpose

The AI layer exists to enhance task parsing and provide conversational assistance for productivity queries. It does not replace core app logic or make decisions on behalf of the user.

The system is designed to fail gracefully. If AI is unavailable, the app must function identically to a version where AI was never implemented.

---

## Architectural Boundaries

### What AI Can Do

- Parse natural language task input into structured data (title, due date, tags, priority)
- Answer questions about tasks, time entries, study streaks, and upcoming deadlines
- Suggest prioritization strategies based on user context
- Provide focus recommendations (e.g., "What should I work on next?")

### What AI Must Never Do

- Modify the database directly
- Make automatic changes to tasks without explicit user confirmation
- Send any data outside the local machine
- Block or delay core app functionality (all AI calls have timeouts)
- Assume control over UI state beyond the chat panel

AI responses are advisory. The user retains full control over task creation, editing, and deletion.

---

## Local Model Integration Strategy

### Why Ollama

- Standardized HTTP API for model inference
- Wide model compatibility (llama, qwen, phi, mistral, gemma, deepseek)
- Runs as a local service with minimal configuration
- No API keys or authentication required

### Why AI Is Optional

1. **Deployment simplicity**: Users should not need to install Ollama to evaluate ZenTrack
2. **Performance**: Not all machines can run LLMs efficiently
3. **Privacy**: Some users prefer zero AI involvement
4. **Reliability**: Local models can fail, timeout, or produce malformed output

The app must never assume AI is present.

### Availability Detection

- On mount, `checkOllamaAvailability()` pings `http://127.0.0.1:11434/api/tags`
- Timeout: 3 seconds
- Result cached for 5 minutes
- `useAIAvailability()` hook exposes `{ isAvailable, isChecking, forceRefresh }`
- Manual recheck triggered via UI button (no auto-polling)

If Ollama is not running, the check fails silently. No errors logged to console.

---

## App → AI Communication Flow

### Task Parsing

1. User types natural language in task input field
2. `SmartTaskInput` calls `ollamaClient.parseTask(input)`
3. Timeout: 30 seconds
4. If successful: Structured JSON returned → prefill form fields
5. If failed: Fall back to regex-based parsing (existing NLP layer)
6. No user-facing error messages for AI failures

### Chat Assistant

1. User opens AI Assistant panel (only visible when AI available)
2. System message injects context: tasks, time entries, streak data
3. User sends query → `ollamaClient.generate()` with conversation history
4. Streaming responses not implemented (MVP uses full responses)
5. Chat history stored in React state (not persisted)
6. "Reset Chat" clears conversation and re-injects fresh context

Context injection format:
```
You are a productivity assistant for ZenTrack.

User Context:
- 12 active tasks (3 overdue)
- 4.5 hours tracked today
- Current study streak: 7 days
- Next deadline: Math assignment in 2 days

Answer questions about tasks, suggest priorities, and provide focus advice.
```

---

## Chat UI Behavior

### When to Show the Panel

- AI availability check passes
- Compatible model detected
- Panel toggles via sidebar button

### When to Hide the Panel

- AI becomes unavailable mid-session (rare, but handle gracefully)
- User clicks outside panel or presses Escape

### Error Handling

- Malformed AI responses: Show "I couldn't process that request" fallback
- Timeout: Show "Response took too long" message
- Lost connection: Hide AI Assistant button, show recheck UI

Do not crash the app if Ollama stops responding.

---

## Error Handling Philosophy

### Silent Failures

AI errors must not surface as alerts, toasts, or modal dialogs. Users who never enabled AI should never know it exists.

### Defensive Checks

- Wrap all `ollamaClient` calls in try-catch
- Validate JSON structure before parsing
- Provide fallback values for missing fields
- Log errors to console only in development mode

### Timeout Strategy

- Availability check: 3s
- Task parsing: 30s (allows time for cold start)
- Chat generation: 30s

If timeout exceeded, cancel the request via `AbortController`.

---

## What NOT to Implement Yet

### Anti-Goals

- **Automatic task creation**: AI should not add tasks without user confirmation
- **Background agents**: No autonomous AI running in the background
- **Model fine-tuning**: Use pre-trained models as-is
- **Multi-turn reasoning**: Keep conversations shallow (no chain-of-thought)
- **Voice input**: Text-only for now
- **Cloud model fallback**: Do not contact external APIs if local AI fails
- **Persistent chat history**: Do not save conversations to SQLite
- **Custom model configurations**: No UI for changing temperature, top_p, etc.

These constraints exist to keep the AI layer simple, predictable, and maintainable.

---

## Contribution Rules for AI-Related Changes

### Before Submitting a PR

1. Verify the app works fully with Ollama disabled
2. Ensure no console errors when AI calls fail
3. Test with at least two different models (e.g., llama3 and qwen2.5)
4. Confirm no UI blocking or freezing during AI operations
5. Check that no user data is logged to console or terminal

### Code Style

- All AI-related code lives in `/src/ai/` or `/src/hooks/` for AI hooks
- Use TypeScript strict mode
- Prefer explicit error types over `any`
- Document prompt templates in source files (not external config)

### Testing

- Manual testing only (no AI unit tests required yet)
- Verify cold start behavior (Ollama running but model not loaded)
- Test interrupted responses (stop Ollama mid-generation)
- Confirm fallback parsing works when AI is disabled

### Pull Request Checklist

- [ ] AI failure does not break core functionality
- [ ] No new dependencies added for AI features
- [ ] Timeout values documented
- [ ] Chat panel does not leak memory on repeated open/close
- [ ] Recheck button works correctly after Ollama restarts

---

## Model Compatibility

Current supported models (tested):
- llama3 (8B recommended)
- qwen2.5 (7B or 14B)
- phi-3 (3.8B, fast on CPU)
- mistral (7B)
- gemma (7B)
- deepseek-coder (6.7B)

Models must support JSON output formatting via prompt instructions. Do not rely on special API features (e.g., Ollama's `format: "json"` parameter is not required but can be used if present).

---

## Performance Considerations

- First AI call may take 10-15 seconds (model loading)
- Subsequent calls: 1-3 seconds depending on hardware
- Context injection adds ~500 tokens per chat message
- Large task lists (100+ tasks) may slow context generation

Do not optimize prematurely. Profile before adding complexity.

---

## Future Considerations (Not Roadmap)

If AI usage grows, we'll consider:
- Caching parsed task structures
- Streaming responses for chat
- Allowing users to select preferred model
- Persisting chat history (with explicit user consent)

