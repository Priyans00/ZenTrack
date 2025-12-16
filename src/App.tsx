import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/calendar";
import TimeTracker from "./pages/TimeTracker";
import Spending from "./pages/Spending";
import About from "./pages/About";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
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
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
