import { invoke } from "@tauri-apps/api/core";

export type Reminder = {
  id: number;
  task_id: number;
  remind_at: string;
  triggered: boolean;
  created_at: string;
};

export async function createReminder(taskId: number, remindAt: string): Promise<void> {
  await invoke("create_reminder", { taskId, remindAt });
}

export async function getReminders(taskId: number): Promise<Reminder[]> {
  const res = await invoke<Reminder[]>("get_reminders_for_task", { taskId });
  return res;
}

export async function deleteReminder(reminderId: number): Promise<void> {
  await invoke("delete_reminder", { reminderId });
}
