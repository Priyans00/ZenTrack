import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/calendar";
import TimeTracker from "./pages/TimeTracker";
import Spending from "./pages/Spending";
import About from "./pages/About";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
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
  );
}

export default App;
