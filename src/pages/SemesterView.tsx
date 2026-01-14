import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../state/appStore';

/**
 * SemesterView - Academic Load Map
 * 
 * Shows all exams, assignments, and deadlines across the semester
 * in a clean, week-by-week view. Read-only, no calendar clutter.
 */

type WeekData = {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  items: Array<{
    id: number;
    type: 'exam' | 'task';
    title: string;
    date: Date;
    subject?: string;
    subjectColor?: string;
    priority?: string;
  }>;
};

const SemesterView = () => {
  const { tasks, exams, subjects, loadAllData, isLoading } = useAppStore();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([getCurrentWeekNumber()]));

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Generate weeks for the semester (current semester ~16 weeks)
  const weeksData = useMemo((): WeekData[] => {
    const weeks: WeekData[] = [];
    const now = new Date();
    
    // Start from the beginning of the current month, go 4 months ahead
    const semesterStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const semesterEnd = new Date(now.getFullYear(), now.getMonth() + 4, 0);
    
    let currentWeekStart = new Date(semesterStart);
    // Adjust to Monday
    const dayOfWeek = currentWeekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentWeekStart.setDate(currentWeekStart.getDate() + mondayOffset);
    
    let weekNumber = 1;
    
    while (currentWeekStart < semesterEnd) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Find items in this week
      const weekItems: WeekData['items'] = [];
      
      // Add tasks
      tasks.forEach(task => {
        if (!task.due_date) return;
        const dueDate = new Date(task.due_date);
        if (dueDate >= currentWeekStart && dueDate <= weekEnd) {
          const subject = task.subject_id 
            ? subjects.find(s => s.id === task.subject_id)
            : undefined;
          weekItems.push({
            id: task.id,
            type: 'task',
            title: task.title,
            date: dueDate,
            subject: subject?.name,
            subjectColor: subject?.color,
            priority: task.priority,
          });
        }
      });
      
      // Add exams
      exams.forEach(exam => {
        const examDate = new Date(exam.exam_date);
        if (examDate >= currentWeekStart && examDate <= weekEnd) {
          const subject = subjects.find(s => s.id === exam.subject_id);
          weekItems.push({
            id: exam.id,
            type: 'exam',
            title: exam.title,
            date: examDate,
            subject: subject?.name,
            subjectColor: subject?.color,
          });
        }
      });
      
      // Sort items by date
      weekItems.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      weeks.push({
        weekNumber,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd),
        items: weekItems,
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }
    
    return weeks;
  }, [tasks, exams, subjects]);

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekNumber)) {
        next.delete(weekNumber);
      } else {
        next.add(weekNumber);
      }
      return next;
    });
  };

  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const isCurrentWeek = (start: Date, end: Date) => {
    const now = new Date();
    return now >= start && now <= end;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 md:pt-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-20 md:pt-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Semester Overview
            </h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm sm:text-base">
              Your academic load at a glance
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                {exams.length}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Exams</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {tasks.filter(t => t.status !== 'Done').length}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weeks List */}
      <div className="space-y-3">
        {weeksData.map(week => {
          const isCurrent = isCurrentWeek(week.startDate, week.endDate);
          const hasExams = week.items.some(i => i.type === 'exam');
          const isExpanded = expandedWeeks.has(week.weekNumber);
          
          return (
            <div 
              key={week.weekNumber}
              className="panel transition-all duration-200"
              style={{
                borderColor: isCurrent ? 'var(--accent)' : 'var(--border-color)',
                boxShadow: isCurrent ? '0 0 20px var(--accent-glow)' : 'none',
              }}
            >
              {/* Week Header */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleWeek(week.weekNumber)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                    style={{ 
                      backgroundColor: isCurrent ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: isCurrent ? '#000' : 'var(--text-secondary)',
                    }}
                  >
                    {week.weekNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatDateRange(week.startDate, week.endDate)}
                      </p>
                      {isCurrent && (
                        <span className="badge badge-primary text-xs">Current</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {week.items.length === 0 
                        ? 'No deadlines' 
                        : `${week.items.length} item${week.items.length !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Exam indicator */}
                  {hasExams && (
                    <div 
                      className="flex items-center gap-1 px-2 py-1 rounded-md"
                      style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-xs font-medium">Exam</span>
                    </div>
                  )}
                  
                  {/* Expand/Collapse */}
                  <svg 
                    className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && week.items.length > 0 && (
                <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {week.items.map((item, idx) => (
                    <div 
                      key={`${item.type}-${item.id}-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      {/* Type Icon */}
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: item.type === 'exam' 
                            ? 'rgba(239, 68, 68, 0.1)' 
                            : 'var(--accent-dim)',
                        }}
                      >
                        {item.type === 'exam' ? (
                          <svg className="w-4 h-4" style={{ color: 'var(--danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>
                            {item.date.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                            })}
                          </span>
                          {item.subject && (
                            <>
                              <span>•</span>
                              <span 
                                className="flex items-center gap-1"
                                style={{ color: item.subjectColor || 'var(--text-muted)' }}
                              >
                                <span 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: item.subjectColor || 'var(--text-muted)' }}
                                ></span>
                                {item.subject}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Priority Badge for Tasks */}
                      {item.type === 'task' && item.priority && (
                        <span className={`badge badge-${getPriorityBadge(item.priority)}`}>
                          {item.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {isExpanded && week.items.length === 0 && (
                <div 
                  className="mt-4 pt-4 text-center py-4"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No deadlines this week
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfWeek = startOfMonth.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfMonth.setDate(startOfMonth.getDate() + mondayOffset);
  
  const diffDays = Math.floor((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

function getPriorityBadge(priority: string): string {
  switch (priority) {
    case 'High': return 'danger';
    case 'Medium': return 'warning';
    case 'Low': return 'success';
    default: return 'neutral';
  }
}

export default SemesterView;
