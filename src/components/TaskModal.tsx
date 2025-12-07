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

const priorityColors: Record<string, string> = {
  High: "text-rose-400",
  Medium: "text-amber-400",
  Low: "text-emerald-400",
};

const statusColors: Record<string, { active: string; inactive: string }> = {
  Pending: {
    active: "border-amber-500/50 bg-amber-500/20 text-amber-300",
    inactive: "border-dark-600 bg-dark-700 text-dark-400 hover:border-amber-500/30",
  },
  "In Progress": {
    active: "border-blue-500/50 bg-blue-500/20 text-blue-300",
    inactive: "border-dark-600 bg-dark-700 text-dark-400 hover:border-blue-500/30",
  },
  Done: {
    active: "border-emerald-500/50 bg-emerald-500/20 text-emerald-300",
    inactive: "border-dark-600 bg-dark-700 text-dark-400 hover:border-emerald-500/30",
  },
};

export default function TaskModal({ task, open, onClose, onStatusChange }: Props) {
  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-dark-800 border border-dark-700 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-dark-700 p-2 text-dark-400 hover:bg-dark-600 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-5">
          {/* Header */}
          <div>
            <p className="text-xs uppercase tracking-wider text-dark-400 mb-1">Task Details</p>
            <h2 className="text-2xl font-bold text-white">{task.title}</h2>
          </div>

          {/* Description */}
          {task.description && (
            <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600">
              <p className="text-dark-200 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Task info grid */}
          <div className="grid grid-cols-2 gap-5">
            {/* Due Date */}
            <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs uppercase tracking-wider text-dark-400">Due Date</p>
              </div>
              <p className="font-semibold text-white">
                {task.due_date ? new Date(task.due_date).toLocaleString() : "Not set"}
              </p>
            </div>

            {/* Priority */}
            <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <p className="text-xs uppercase tracking-wider text-dark-400">Priority</p>
              </div>
              <p className={`font-semibold ${priorityColors[task.priority] || "text-dark-300"}`}>
                {task.priority}
              </p>
            </div>

            {/* Status */}
            <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs uppercase tracking-wider text-dark-400">Status</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => {
                  const colors = statusColors[status] || statusColors.Pending;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onStatusChange?.(task.id, status)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                        task.status === status ? colors.active : colors.inactive
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-dark-700/30 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-xs uppercase tracking-wider text-dark-400">Tags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags?.length ? (
                  task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-dark-600 border border-dark-500 px-2.5 py-1 text-xs font-medium text-dark-200"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-dark-500 text-sm">No tags</span>
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
