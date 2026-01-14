import { useAppStore } from '../state/appStore';

/**
 * ExamModeToggle - Switch to focused exam study mode
 * 
 * When enabled, hides non-essential features and focuses on study.
 * Auto-enables when exams are within 14 days.
 */
const ExamModeToggle = () => {
  const { examModeEnabled, examModeAutoEnabled, toggleExamMode } = useAppStore();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleExamMode}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
          ${examModeEnabled ? 'bg-orange-500' : 'bg-gray-600'}
        `}
        style={{
          backgroundColor: examModeEnabled ? 'var(--accent)' : 'var(--border-color)',
        }}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
            ${examModeEnabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <div className="flex items-center gap-2">
        <span 
          className="text-sm font-medium"
          style={{ color: examModeEnabled ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          Exam Mode
        </span>
        {examModeAutoEnabled && (
          <span 
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ 
              backgroundColor: 'var(--accent-dim)',
              color: 'var(--accent)',
            }}
          >
            Auto
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * ExamModeBanner - Shows when exam mode is active
 */
export const ExamModeBanner = () => {
  const { examModeEnabled, exams } = useAppStore();

  if (!examModeEnabled) return null;

  // Find the nearest exam
  const now = new Date();
  const upcomingExams = exams
    .filter(e => new Date(e.exam_date) > now)
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
  
  const nearestExam = upcomingExams[0];
  const daysUntil = nearestExam 
    ? Math.ceil((new Date(nearestExam.exam_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div 
      className="flex items-center justify-between px-4 py-2 rounded-lg mb-4"
      style={{ 
        backgroundColor: 'var(--accent-dim)',
        border: '1px solid rgba(255, 107, 53, 0.2)',
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            Exam Mode Active
          </p>
          {nearestExam && daysUntil !== null && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {nearestExam.title} in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span 
          className="badge badge-primary flex items-center gap-1"
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
          Focused
        </span>
      </div>
    </div>
  );
};

/**
 * OfflineReadyBadge - Shows that app works fully offline
 */
export const OfflineReadyBadge = () => {
  const { examModeEnabled } = useAppStore();

  if (!examModeEnabled) return null;

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{ 
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        color: 'var(--success)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
      }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      Offline Ready
    </div>
  );
};

export default ExamModeToggle;
