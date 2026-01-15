


# ZenTrack

A local-first desktop productivity tool for students who need to manage tasks, track time, and stay focused without cloud dependencies or distractions.

Built with Tauri, React, and SQLite. Runs entirely on your machine.

---

## What It Does

- **Task Management**: Create, organize, and prioritize tasks with natural language input
- **Time Tracking**: Monitor how you spend time across different activities and subjects
- **Pomodoro Timer**: Structured work sessions with break enforcement
- **Calendar View**: Visualize tasks and deadlines across days, weeks, and months
- **Study Streaks**: Track consecutive days of focused work
- **Exam Mode**: Countdown tracking for upcoming tests and deadlines
- **Activity Analytics**: Insights into productivity patterns and time allocation

All data stays on your device. No accounts, no servers, no sync.

---

## Local AI Assistant (Optional)

ZenTrack includes an optional AI layer that runs entirely on your machine via Ollama.

When enabled, the AI can:
- Parse natural language task input ("Submit report tomorrow 4pm #Work")
- Answer questions about your schedule and productivity patterns
- Suggest focus strategies based on your tracked activity
- Help prioritize tasks by analyzing deadlines and time availability

The AI never sends data externally. It reads your local task database and generates responses using a model running on your hardware.

### What Happens Without AI

All core functionality works without AI. Task creation falls back to rule-based parsing. The chat assistant simply doesn't appear in the UI.

### AI Availability & Detection

On startup, ZenTrack performs a non-blocking background check to detect:
Whether Ollama is running
Whether a compatible model is available
If Ollama is not detected:
The app continues normally
A subtle “Recheck AI” button is shown in the sidebar
Starting Ollama later enables AI features without restarting the app

- Compatible models include:

`llama3`,`qwen2.5`,`phi-3`, `mistral`, `gemma`, `deepseek-coder`

---

## Installation

Recommended (Prebuilt Installer)

Download the latest installer for your platform from the GitHub Releases page:

👉 https://github.com/Priyans00/zentrack/releases

Available formats:

Windows: .msi

⚠️ On first install, your OS may show a security warning because the app is unsigned.
This is expected for independent desktop apps. You can safely proceed.

### Developer Setup (From Source)

If you want to run or modify ZenTrack locally:

```bash
git clone https://github.com/Priyans00/zentrack.git
cd zentrack
npm install
npm run tauri dev
```

Build for production:
```bash
npm run tauri build
```

### Optional: Enable AI Features

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a compatible model:
   ```bash
   ollama pull llama3
   ```
3. Ensure Ollama is running (it starts automatically on most systems)
4. Launch or recheck ZenTrack

The AI Assistant button will appear in the sidebar when a model is detected.

---

## Privacy & Data Philosophy

- All data is stored in a local SQLite database
- No telemetry, tracking, or analytics
- No external API calls
- AI processing happens entirely on-device (if enabled)
- Data can be exported as JSON or CSV at any time
- No account creation or authentication

ZenTrack is designed for users who want control over their productivity data.

---

## Who This Is For

- Students managing coursework across multiple subjects
- Anyone who prefers offline-first tools
- Users who want AI assistance without sending data to third parties
- People who need structured time tracking without complexity

Not designed for:
- Team collaboration (no multi-user support)
- Cloud sync across devices
- Mobile platforms (desktop only)

---

## Roadmap

Near-term priorities:
- Recurring task support
- Improved calendar drag-and-drop
- Export templates for academic schedules
- Keyboard shortcuts for power users
- Idle time detection refinements

The project prioritizes stability and data integrity over feature velocity.

---

## Contributing

See [CONTRIBUTION.md](CONTRIBUTION.md) for guidelines.

---

## License

MIT License © 2025 Priyans00

