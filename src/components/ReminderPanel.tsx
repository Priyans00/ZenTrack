import { useEffect, useMemo, useState } from "react";
import { useReminderStore } from "../state/reminderStore";

const presets = [
  { label: "5 min before", minutes: 5 },
  { label: "10 min before", minutes: 10 },
  { label: "30 min before", minutes: 30 },
  { label: "1 hour before", minutes: 60 },
];

type Props = {
  taskId: number;
  dueDate?: string;
};

function formatDate(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReminderPanel({ taskId, dueDate }: Props) {
  const { reminders, loading, load, add, remove } = useReminderStore();
  const [customInput, setCustomInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      load(taskId);
    }
  }, [taskId, load]);

  const canUsePresets = useMemo(() => {
    if (!dueDate) return false;
    const dt = new Date(dueDate);
    return !Number.isNaN(dt.getTime());
  }, [dueDate]);

  const handlePreset = async (minutes: number) => {
    setError(null);
    if (!canUsePresets || !dueDate) {
      setError("Set a due date to schedule reminders.");
      return;
    }
    const due = new Date(dueDate);
    const remindAt = new Date(due.getTime() - minutes * 60_000).toISOString();
    try {
      await add(taskId, remindAt);
    } catch (err: unknown) {
      setError(String(err));
    }
  };

  const handleCustomAdd = async () => {
    setError(null);
    if (!customInput) return;
    try {
      await add(taskId, customInput);
      setCustomInput("");
    } catch (err: unknown) {
      setError(String(err));
    }
  };

  return (
    <div 
      className="rounded-xl p-4"
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border)' 
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'rgba(255, 107, 53, 0.2)' }}
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--accent)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Reminders
          </h3>
        </div>
        {loading && (
          <span 
            className="text-xs flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading…
          </span>
        )}
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {presets.map((preset) => (
          <button
            key={preset.minutes}
            type="button"
            onClick={() => handlePreset(preset.minutes)}
            disabled={!canUsePresets}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom datetime input */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="datetime-local"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          className="input flex-1"
        />
        <button
          type="button"
          onClick={handleCustomAdd}
          className="btn-primary"
        >
          Add custom
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div 
          className="flex items-center gap-2 text-sm mb-3 rounded-lg px-3 py-2"
          style={{ 
            color: 'var(--danger)', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Reminders list */}
      <div className="space-y-2">
        {reminders.length === 0 ? (
          <div className="text-center py-4">
            <svg 
              className="w-8 h-8 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-muted)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              No reminders set
            </p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between rounded-lg px-4 py-3 group transition-all"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border)' 
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-1.5 rounded-lg"
                  style={{ 
                    backgroundColor: reminder.triggered 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(255, 107, 53, 0.2)' 
                  }}
                >
                  {reminder.triggered ? (
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--success)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--accent)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span 
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatDate(reminder.remind_at)}
                  </span>
                  {reminder.triggered && (
                    <span 
                      className="text-xs"
                      style={{ color: 'var(--success)' }}
                    >
                      Sent
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(reminder.id, taskId)}
                className="text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--danger)' }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
