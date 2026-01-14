import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";

// ============================================================================
// Types
// ============================================================================

export type Subject = {
  id: number;
  name: string;
  color: string;
  semester: string;
  credits?: number;
};

export type Exam = {
  id: number;
  subject_id: number;
  title: string;
  exam_date: string;
  weight?: number; // percentage of grade
  notes?: string;
};

export type Task = {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  tags: string[];
  priority: string;
  status: string;
  subject_id?: number;
  estimated_minutes?: number;
  actual_minutes?: number;
};

export type TimeEntry = {
  id: number;
  task: string;
  start_time: string;
  end_time?: string;
  duration: number;
  category: string;
  subject_id?: number;
};

export type StudyStreak = {
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  paused: boolean;
  grace_days_used: number;
};

export type FocusRecommendation = {
  task: Task | null;
  subject: Subject | null;
  reason: string;
  urgency: "low" | "medium" | "high" | "critical";
  suggested_duration_minutes: number;
};

export type WeeklyStats = {
  planned_minutes: number;
  actual_minutes: number;
  completion_rate: number;
  on_track: boolean;
  pace_warning?: string;
};

export type StressLevel = "low" | "moderate" | "high" | "overwhelming";

// Pending session to start when navigating to TimeTracker
export type PendingSession = {
  taskName: string;
  category: string;
  subjectId?: number;
  autoStart: boolean;
} | null;

// ============================================================================
// App State
// ============================================================================

interface AppState {
  // Core data
  tasks: Task[];
  subjects: Subject[];
  exams: Exam[];
  timeEntries: TimeEntry[];
  
  // UI State
  examModeEnabled: boolean;
  examModeAutoEnabled: boolean;
  stressLevel: StressLevel;
  setupCompleted: boolean;
  showSetupWizard: boolean;
  
  // Pending session for TimeTracker auto-start
  pendingSession: PendingSession;
  
  // Streaks
  streak: StudyStreak;
  
  // Computed / Derived
  focusRecommendation: FocusRecommendation | null;
  weeklyStats: WeeklyStats | null;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  loadAllData: () => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  setSubjects: (subjects: Subject[]) => void;
  setExams: (exams: Exam[]) => void;
  setTimeEntries: (entries: TimeEntry[]) => void;
  
  toggleExamMode: () => void;
  setSetupCompleted: (completed: boolean) => void;
  setShowSetupWizard: (show: boolean) => void;
  
  // Pending session actions
  setPendingSession: (session: PendingSession) => void;
  clearPendingSession: () => void;
  
  updateStreak: (studiedToday: boolean) => void;
  pauseStreak: () => void;
  
  computeFocusRecommendation: () => void;
  computeWeeklyStats: () => void;
  computeStressLevel: () => void;
  
  // Check if exam mode should auto-enable
  checkExamProximity: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const EXAM_MODE_THRESHOLD_DAYS = 14;
const GRACE_DAYS_ALLOWED = 2;

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getPriorityScore(priority: string): number {
  switch (priority) {
    case "High": return 3;
    case "Medium": return 2;
    case "Low": return 1;
    default: return 1;
  }
}

function getUrgencyFromDays(days: number): "low" | "medium" | "high" | "critical" {
  if (days <= 1) return "critical";
  if (days <= 3) return "high";
  if (days <= 7) return "medium";
  return "low";
}

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      subjects: [],
      exams: [],
      timeEntries: [],
      
      examModeEnabled: false,
      examModeAutoEnabled: false,
      stressLevel: "low",
      setupCompleted: false,
      showSetupWizard: false,
      
      // Pending session for auto-start
      pendingSession: null,
      
      streak: {
        current_streak: 0,
        longest_streak: 0,
        last_study_date: null,
        paused: false,
        grace_days_used: 0,
      },
      
      focusRecommendation: null,
      weeklyStats: null,
      isLoading: false,

      // ======================================================================
      // Data Loading
      // ======================================================================
      
      loadAllData: async () => {
        set({ isLoading: true });
        try {
          const [tasks, subjects, exams, timeEntries] = await Promise.all([
            invoke<Task[]>("get_tasks"),
            invoke<Subject[]>("get_subjects").catch(() => []),
            invoke<Exam[]>("get_exams").catch(() => []),
            invoke<TimeEntry[]>("get_time_entries").catch(() => []),
          ]);
          
          set({ tasks, subjects, exams, timeEntries });
          
          // Compute derived state
          get().computeFocusRecommendation();
          get().computeWeeklyStats();
          get().computeStressLevel();
          get().checkExamProximity();
          
        } catch (error) {
          console.error("Failed to load data:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      setTasks: (tasks) => {
        set({ tasks });
        get().computeFocusRecommendation();
        get().computeStressLevel();
      },
      
      setSubjects: (subjects) => set({ subjects }),
      setExams: (exams) => {
        set({ exams });
        get().checkExamProximity();
        get().computeFocusRecommendation();
      },
      setTimeEntries: (entries) => {
        set({ timeEntries: entries });
        get().computeWeeklyStats();
      },

      // ======================================================================
      // Exam Mode
      // ======================================================================
      
      toggleExamMode: () => {
        const current = get().examModeEnabled;
        set({ examModeEnabled: !current, examModeAutoEnabled: false });
      },
      
      checkExamProximity: () => {
        const { exams, examModeEnabled, examModeAutoEnabled } = get();
        const now = new Date();
        
        const hasUpcomingExam = exams.some(exam => {
          const examDate = new Date(exam.exam_date);
          const daysUntilExam = Math.ceil(
            (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntilExam > 0 && daysUntilExam <= EXAM_MODE_THRESHOLD_DAYS;
        });
        
        // Auto-enable if not manually disabled and exam is near
        if (hasUpcomingExam && !examModeEnabled && !examModeAutoEnabled) {
          set({ examModeEnabled: true, examModeAutoEnabled: true });
        }
        // Auto-disable if no exams are near and was auto-enabled
        else if (!hasUpcomingExam && examModeAutoEnabled) {
          set({ examModeEnabled: false, examModeAutoEnabled: false });
        }
      },

      // ======================================================================
      // Setup Wizard
      // ======================================================================
      
      setSetupCompleted: (completed) => set({ setupCompleted: completed }),
      setShowSetupWizard: (show) => set({ showSetupWizard: show }),

      // ======================================================================
      // Pending Session (for auto-starting from Focus Card)
      // ======================================================================
      
      setPendingSession: (session) => set({ pendingSession: session }),
      clearPendingSession: () => set({ pendingSession: null }),

      // ======================================================================
      // Guilt-Free Streaks
      // ======================================================================
      
      updateStreak: (studiedToday: boolean) => {
        const { streak } = get();
        const today = new Date().toDateString();
        
        if (studiedToday) {
          const isNewDay = streak.last_study_date !== today;
          
          if (isNewDay) {
            const newStreak = streak.paused 
              ? streak.current_streak + 1 
              : streak.current_streak + 1;
            
            set({
              streak: {
                current_streak: newStreak,
                longest_streak: Math.max(newStreak, streak.longest_streak),
                last_study_date: today,
                paused: false,
                grace_days_used: 0,
              }
            });
          }
        } else {
          // Check if we need to pause (not break) the streak
          if (streak.last_study_date) {
            const lastStudy = new Date(streak.last_study_date);
            const daysSinceLastStudy = Math.floor(
              (new Date().getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // Allow grace days without breaking streak
            if (daysSinceLastStudy > 1 && daysSinceLastStudy <= GRACE_DAYS_ALLOWED + 1) {
              set({
                streak: {
                  ...streak,
                  paused: true,
                  grace_days_used: daysSinceLastStudy - 1,
                }
              });
            } else if (daysSinceLastStudy > GRACE_DAYS_ALLOWED + 1) {
              // Only reset after grace period exceeded
              set({
                streak: {
                  current_streak: 0,
                  longest_streak: streak.longest_streak,
                  last_study_date: null,
                  paused: false,
                  grace_days_used: 0,
                }
              });
            }
          }
        }
      },
      
      pauseStreak: () => {
        set(state => ({
          streak: { ...state.streak, paused: true }
        }));
      },

      // ======================================================================
      // Focus Recommendation Engine
      // ======================================================================
      
      computeFocusRecommendation: () => {
        const { tasks, subjects, exams, timeEntries } = get();
        
        // Filter to actionable tasks (not done)
        const activeTasks = tasks.filter(t => t.status !== "Done");
        
        if (activeTasks.length === 0) {
          set({ 
            focusRecommendation: {
              task: null,
              subject: null,
              reason: "All caught up! No pending tasks.",
              urgency: "low",
              suggested_duration_minutes: 0,
            }
          });
          return;
        }
        
        // Calculate score for each task
        const scoredTasks = activeTasks.map(task => {
          let score = 0;
          let reasons: string[] = [];
          
          // Priority weight (0-30 points)
          const priorityScore = getPriorityScore(task.priority) * 10;
          score += priorityScore;
          
          // Deadline proximity (0-50 points)
          if (task.due_date) {
            const days = daysUntil(task.due_date);
            if (days <= 0) {
              score += 50;
              reasons.push("Overdue");
            } else if (days <= 1) {
              score += 45;
              reasons.push("Due today/tomorrow");
            } else if (days <= 3) {
              score += 35;
              reasons.push(`Due in ${days} days`);
            } else if (days <= 7) {
              score += 20;
              reasons.push(`Due in ${days} days`);
            }
          }
          
          // Exam proximity boost (0-40 points)
          if (task.subject_id) {
            const relatedExam = exams.find(e => e.subject_id === task.subject_id);
            if (relatedExam) {
              const examDays = daysUntil(relatedExam.exam_date);
              if (examDays > 0 && examDays <= 7) {
                score += 40;
                reasons.push(`Exam in ${examDays} days`);
              } else if (examDays > 0 && examDays <= 14) {
                score += 25;
                reasons.push(`Exam in ${examDays} days`);
              }
            }
          }
          
          // Time invested penalty - prefer tasks with less actual time
          // to avoid over-focusing on one thing
          const timeOnTask = timeEntries
            .filter(e => e.task === task.title)
            .reduce((sum, e) => sum + e.duration, 0);
          
          const estimatedSeconds = (task.estimated_minutes || 60) * 60;
          const completionRatio = timeOnTask / estimatedSeconds;
          
          if (completionRatio < 0.5) {
            score += 15;
            reasons.push(`Only ${Math.round(completionRatio * 100)}% time spent`);
          }
          
          // Status boost - in progress tasks get slight preference
          if (task.status === "In Progress") {
            score += 5;
          }
          
          return { task, score, reasons };
        });
        
        // Sort by score descending
        scoredTasks.sort((a, b) => b.score - a.score);
        
        const topTask = scoredTasks[0];
        if (!topTask) {
          set({ focusRecommendation: null });
          return;
        }
        
        // Get related subject if any
        const relatedSubject = subjects.find(s => s.id === topTask.task.subject_id);
        
        // Calculate urgency
        let urgency: "low" | "medium" | "high" | "critical" = "low";
        if (topTask.task.due_date) {
          urgency = getUrgencyFromDays(daysUntil(topTask.task.due_date));
        }
        if (topTask.score >= 70) urgency = "critical";
        else if (topTask.score >= 50) urgency = "high";
        else if (topTask.score >= 30) urgency = "medium";
        
        // Build reason string
        const reasonStr = topTask.reasons.length > 0 
          ? topTask.reasons.join(". ") + "."
          : "This task needs your attention.";
        
        // Suggest duration based on estimated time remaining
        const timeSpent = timeEntries
          .filter(e => e.task === topTask.task.title)
          .reduce((sum, e) => sum + e.duration, 0) / 60; // convert to minutes
        
        const estimatedTotal = topTask.task.estimated_minutes || 60;
        const remaining = Math.max(25, estimatedTotal - timeSpent); // minimum 25 min session
        const suggestedDuration = Math.min(remaining, 90); // cap at 90 min
        
        set({
          focusRecommendation: {
            task: topTask.task,
            subject: relatedSubject || null,
            reason: reasonStr,
            urgency,
            suggested_duration_minutes: Math.round(suggestedDuration),
          }
        });
      },

      // ======================================================================
      // Weekly Stats (Time Reality Check)
      // ======================================================================
      
      computeWeeklyStats: () => {
        const { tasks, timeEntries } = get();
        
        // Get start of current week (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + mondayOffset);
        weekStart.setHours(0, 0, 0, 0);
        
        // Calculate planned minutes from tasks due this week
        const plannedMinutes = tasks
          .filter(t => {
            if (!t.due_date) return false;
            const dueDate = new Date(t.due_date);
            return dueDate >= weekStart && dueDate <= now && t.status !== "Done";
          })
          .reduce((sum, t) => sum + (t.estimated_minutes || 60), 0);
        
        // Calculate actual minutes tracked this week
        const actualMinutes = timeEntries
          .filter(e => new Date(e.start_time) >= weekStart)
          .reduce((sum, e) => sum + Math.round(e.duration / 60), 0);
        
        // Completion rate
        const completionRate = plannedMinutes > 0 
          ? Math.round((actualMinutes / plannedMinutes) * 100) 
          : 100;
        
        // Determine if on track
        const daysIntWeek = Math.max(1, Math.ceil((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
        const expectedProgress = (daysIntWeek / 7) * 100;
        const onTrack = completionRate >= expectedProgress * 0.8;
        
        // Generate pace warning if needed
        let paceWarning: string | undefined;
        if (plannedMinutes > 0 && completionRate < 50 && daysIntWeek >= 3) {
          const remaining = plannedMinutes - actualMinutes;
          const daysLeft = 7 - daysIntWeek;
          if (daysLeft > 0) {
            const dailyNeeded = Math.round(remaining / daysLeft);
            paceWarning = `At this pace, you need ${dailyNeeded} min/day to catch up.`;
          }
        }
        
        set({
          weeklyStats: {
            planned_minutes: plannedMinutes,
            actual_minutes: actualMinutes,
            completion_rate: Math.min(100, completionRate),
            on_track: onTrack,
            pace_warning: paceWarning,
          }
        });
      },

      // ======================================================================
      // Stress Level Computation
      // ======================================================================
      
      computeStressLevel: () => {
        const { tasks, exams } = get();
        
        let stressScore = 0;
        
        // Count overdue tasks
        const overdueTasks = tasks.filter(t => {
          if (t.status === "Done" || !t.due_date) return false;
          return daysUntil(t.due_date) < 0;
        });
        stressScore += overdueTasks.length * 15;
        
        // Count urgent tasks (due in 3 days)
        const urgentTasks = tasks.filter(t => {
          if (t.status === "Done" || !t.due_date) return false;
          const days = daysUntil(t.due_date);
          return days >= 0 && days <= 3;
        });
        stressScore += urgentTasks.length * 10;
        
        // Count upcoming exams
        const upcomingExams = exams.filter(e => {
          const days = daysUntil(e.exam_date);
          return days >= 0 && days <= 7;
        });
        stressScore += upcomingExams.length * 20;
        
        // High priority pending tasks
        const highPriorityPending = tasks.filter(
          t => t.priority === "High" && t.status !== "Done"
        );
        stressScore += highPriorityPending.length * 5;
        
        // Determine stress level
        let level: StressLevel = "low";
        if (stressScore >= 80) level = "overwhelming";
        else if (stressScore >= 50) level = "high";
        else if (stressScore >= 25) level = "moderate";
        
        set({ stressLevel: level });
      },
    }),
    {
      name: "zentrack-app-store",
      partialize: (state) => ({
        examModeEnabled: state.examModeEnabled,
        setupCompleted: state.setupCompleted,
        streak: state.streak,
      }),
    }
  )
);
