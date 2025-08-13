


# ⏳ ZenTrack — Advanced Time Management & Productivity Tool

ZenTrack is a **Rust + Tauri + React (Next.js)** powered desktop app designed for **students, professionals, and productivity enthusiasts**.  
It combines **task management**, **Pomodoro timers**, **calendar scheduling**, and **activity tracking** into one sleek and efficient package.

---

## 🚀 Tech Stack
- **Backend:** Rust (Tauri), SQLite (via rusqlite)
- **Frontend:** React (Next.js), TailwindCSS
- **Build Tool:** Tauri bundler (creates cross-platform desktop apps)
- **Charts & UI:** Recharts, Headless UI

---

## 📅 Development Roadmap

### 🛠️ PHASE 1: Core Time Management
✅ 1. **Task Manager**
- Add/edit/delete tasks  
- Due date & time  
- Tags (Work, Study, Personal, etc.)  
- Priority levels  
- Status: Pending, In Progress, Done  

✅ 2. **Pomodoro Timer**
- Start/stop timer  
- Work & break intervals (configurable)  
- Desktop notification on session end  
- Optional auto-start next session  

✅ 3. **Local Storage**
- SQLite via rusqlite in Rust  
- Persist tasks, timer sessions, user preferences  

---

### 📅 PHASE 2: Interactive Calendar View
✅ 4. **Calendar Integration**
- Month, week, and day views  
- Show tasks/events on correct dates  
- Click to view/edit tasks/events  
- Drag-and-drop rescheduling  

✅ 5. **Task/Event Reminders**
- Schedule notifications 5/10 min before due time  
- Option to repeat daily/weekly/monthly  

---

### 💻 PHASE 3: Activity Monitoring
✅ 6. **App Usage Tracker**
- Monitor active window (via Rust APIs)  
- Log time spent per app with timestamps  
- Ignore idle/system time  

✅ 7. **Idle Detection**
- Detect user inactivity  
- Auto-pause timer if idle > X minutes  

---

### 📊 PHASE 4: Insights & Analytics
✅ 8. **Analytics Dashboard**
- Daily/weekly/monthly reports  
- Time spent on tasks, categories, apps  
- Pomodoro stats: sessions completed, break ratio  
- Charts: bar, pie, timeline  

---

### 🎨 PHASE 5: UX Polish & Personalization
✅ 9. **UI/UX Enhancements**
- Light/Dark mode  
- Theme selector (custom accent colors)  
- Tray icon with quick actions  

✅ 10. **Natural Language Input**
- Example:  
  `Submit report tomorrow 4pm #Work`  

---

### 🔄 PHASE 6: Optional Extras
✅ 11. **Sync & Export**
- Export tasks/history to CSV/JSON  
- Later: Google Calendar / iCal sync  

✅ 12. **Daily Planner Mode**
- Suggest task times based on past activity  

✅ 13. **Keyboard Shortcuts**
- Speed up task/timer actions  

---

## 📦 Installation
### 1. Clone the repo
```bash
git clone https://github.com/Priyans00/zentrack.git
cd zentrack
````

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development mode

```bash
npm run tauri dev
```

### 4. Build for production

```bash
npm run tauri build
```

---

## 🤝 Contributing

We welcome contributions!
See [CONTRIBUTION.md](CONTRIBUTION.md) for guidelines.

---

## 📜 License

MIT License © 2025 Priyans00

