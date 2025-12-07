import { create } from "zustand";
import { createReminder, deleteReminder, getReminders, Reminder } from "../lib/reminders";

interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  load: (taskId: number) => Promise<void>;
  add: (taskId: number, remindAt: string) => Promise<void>;
  remove: (id: number, taskId: number) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  loading: false,
  load: async (taskId: number) => {
    set({ loading: true });
    try {
      const list = await getReminders(taskId);
      set({ reminders: list });
    } catch (error) {
      console.error("Failed to load reminders", error);
    } finally {
      set({ loading: false });
    }
  },
  add: async (taskId: number, remindAt: string) => {
    try {
      await createReminder(taskId, remindAt);
      await get().load(taskId);
    } catch (error) {
      console.error("Failed to create reminder", error);
      throw error;
    }
  },
  remove: async (id: number, taskId: number) => {
    try {
      await deleteReminder(id);
      await get().load(taskId);
    } catch (error) {
      console.error("Failed to delete reminder", error);
    }
  },
}));
