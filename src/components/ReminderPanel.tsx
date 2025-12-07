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
    <div className="rounded-xl border border-dark-600 bg-dark-700/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">Reminders</h3>
        </div>
        {loading && (
          <span className="text-xs text-dark-400 flex items-center gap-1">
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
            className="rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm font-medium text-dark-200 hover:bg-dark-600 hover:border-dark-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
          className="flex-1 rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white placeholder-dark-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        />
        <button
          type="button"
          onClick={handleCustomAdd}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
        >
          Add custom
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-400 mb-3 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
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
            <svg className="w-8 h-8 text-dark-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-dark-500">No reminders set</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 group hover:border-dark-500 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${reminder.triggered ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                  {reminder.triggered ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    {formatDate(reminder.remind_at)}
                  </span>
                  {reminder.triggered && (
                    <span className="text-xs text-emerald-400">Sent</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(reminder.id, taskId)}
                className="text-sm text-dark-400 hover:text-rose-400 font-medium transition-colors opacity-0 group-hover:opacity-100"
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
