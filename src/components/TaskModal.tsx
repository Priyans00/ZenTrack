import ReminderPanel from "./ReminderPanel";

export type Task = {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  tags: string[];
  priority: string;
  status: string;
};

type Props = {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: number, status: string) => void;
};

const statusOptions = ["Pending", "In Progress", "Done"];

export default function TaskModal({ task, open, onClose, onStatusChange }: Props) {
  if (!open || !task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return 'var(--danger)';
      case "Medium": return 'var(--warning)';
      case "Low": return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusStyle = (status: string, isActive: boolean) => {
    if (isActive) {
      switch (status) {
        case "Pending": return { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.5)' };
        case "In Progress": return { backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' };
        case "Done": return { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', border: '1px solid rgba(34, 197, 94, 0.5)' };
        default: return { backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' };
      }
    }
    return { backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' };
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div 
        className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative animate-fade-in"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-color)' 
        }}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 transition-colors"
          style={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-5">
          {/* Header */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Task Details</p>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{task.title}</h2>
          </div>

          {/* Description */}
          {task.description && (
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}
            >
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
            </div>
          )}

          {/* Task info grid */}
          <div className="grid grid-cols-2 gap-5">
            {/* Due Date */}
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Due Date</p>
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {task.due_date ? new Date(task.due_date).toLocaleString() : "Not set"}
              </p>
            </div>

            {/* Priority */}
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4" style={{ color: 'var(--warning)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Priority</p>
              </div>
              <p className="font-semibold" style={{ color: getPriorityColor(task.priority) }}>
                {task.priority}
              </p>
            </div>

            {/* Status */}
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange?.(task.id, status)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                    style={getStatusStyle(status, task.status === status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags?.length ? (
                  task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge badge-neutral"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags</span>
                )}
              </div>
            </div>
          </div>

          {/* Reminder Panel */}
          <ReminderPanel taskId={task.id} dueDate={task.due_date} />
        </div>
      </div>
    </div>
  );
}
