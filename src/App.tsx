import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/calendar";
import TimeTracker from "./pages/TimeTracker";
import Spending from "./pages/Spending";
import About from "./pages/About";
import SemesterView from "./pages/SemesterView";
import { ThemeProvider } from "./context/ThemeContext";
import { useAppStore } from "./state/appStore";
import SemesterSetupWizard from "./components/SemesterSetupWizard";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const { 
    loadAllData, 
    examModeEnabled, 
    stressLevel, 
    setupCompleted,
    showSetupWizard,
    setSetupCompleted,
    setShowSetupWizard,
  } = useAppStore();

  // Load data on mount
  useEffect(() => {
    loadAllData();
    
    // Check if setup was completed
    invoke<string | null>('get_app_setting', { key: 'setup_completed' })
      .then(value => {
        if (value === 'true') {
          setSetupCompleted(true);
        } else {
          // Show wizard for first-time users
          setShowSetupWizard(true);
        }
      })
      .catch(() => {
        // If error, assume not completed
        setShowSetupWizard(true);
      });
  }, [loadAllData, setSetupCompleted, setShowSetupWizard]);

  // Apply stress-aware and exam mode classes to HTML element
  useEffect(() => {
    const html = document.documentElement;
    
    // Remove all stress classes
    html.classList.remove('stress-high', 'stress-overwhelming');
    
    // Apply current stress level
    if (stressLevel === 'high') {
      html.classList.add('stress-high');
    } else if (stressLevel === 'overwhelming') {
      html.classList.add('stress-overwhelming');
    }
    
    // Apply exam mode
    if (examModeEnabled) {
      html.classList.add('exam-mode');
    } else {
      html.classList.remove('exam-mode');
    }
  }, [stressLevel, examModeEnabled]);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Navbar />
        <main className="flex-1 ml-0 md:ml-64 min-h-screen overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/time" element={<TimeTracker />} />
            <Route path="/spend" element={<Spending />} />
            <Route path="/semester" element={<SemesterView />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        
        {/* Semester Setup Wizard */}
        {showSetupWizard && !setupCompleted && <SemesterSetupWizard />}
      </div>
    </ThemeProvider>
  );
}

export default App;
