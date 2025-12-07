use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use std::thread;
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

use crate::DatabaseConnection;

const CHECK_INTERVAL_SECS: u64 = 30;

#[derive(Serialize, Deserialize, Clone)]
pub struct Reminder {
    pub id: i64,
    pub task_id: i64,
    pub remind_at: String,
    pub triggered: bool,
    pub created_at: String,
}

#[derive(Debug)]
struct PendingReminderRow {
    id: i64,
    task_id: i64,
    remind_at: String,
    title: String,
    due_date: Option<String>,
    priority: String,
    tags: String,
}

pub fn init_reminders_table(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            remind_at DATETIME NOT NULL,
            triggered BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_unique ON reminders(task_id, remind_at)",
        [],
    )?;

    Ok(())
}

pub fn create_reminder(conn: &Connection, task_id: i64, remind_at: String) -> Result<(), String> {
    let normalized = normalize_datetime(&remind_at)
        .map(|dt| dt.to_rfc3339())
        .ok_or_else(|| "Invalid reminder time".to_string())?;

    conn
        .execute(
            "INSERT INTO reminders (task_id, remind_at) VALUES (?1, ?2)",
            params![task_id, normalized],
        )
        .map_err(|e| match e {
            rusqlite::Error::SqliteFailure(_, _) => "A reminder already exists for this time".to_string(),
            other => other.to_string(),
        })?;

    Ok(())
}

pub fn get_reminders_for_task(conn: &Connection, task_id: i64) -> Result<Vec<Reminder>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, task_id, remind_at, triggered, created_at FROM reminders WHERE task_id = ?1 ORDER BY remind_at",
        )
        .map_err(|e| e.to_string())?;

    let reminders = stmt
        .query_map(params![task_id], |row| {
            Ok(Reminder {
                id: row.get(0)?,
                task_id: row.get(1)?,
                remind_at: row.get(2)?,
                triggered: row.get::<_, i64>(3)? != 0,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut collection = Vec::new();
    for reminder in reminders {
        collection.push(reminder.map_err(|e| e.to_string())?);
    }

    Ok(collection)
}

pub fn delete_reminder(conn: &Connection, reminder_id: i64) -> Result<(), String> {
    conn
        .execute("DELETE FROM reminders WHERE id = ?1", params![reminder_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn recalculate_reminders_for_task(
    conn: &Connection,
    task_id: i64,
    previous_due_date: Option<&str>,
    new_due_date: Option<&str>,
) -> Result<(), rusqlite::Error> {
    let prev_dt = previous_due_date.and_then(|d| normalize_datetime(d));
    let new_dt = new_due_date.and_then(|d| normalize_datetime(d));

    if prev_dt.is_none() || new_dt.is_none() {
        return Ok(());
    }

    let prev_dt = prev_dt.unwrap();
    let new_dt = new_dt.unwrap();

    let mut stmt = conn.prepare("SELECT id, remind_at FROM reminders WHERE task_id = ?1")?;
    let reminder_rows = stmt.query_map(params![task_id], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
    })?;

    for row in reminder_rows {
        if let Ok((id, remind_at_str)) = row {
            if let Some(rem_dt) = normalize_datetime(&remind_at_str) {
                let offset = prev_dt.signed_duration_since(rem_dt);
                let new_rem_at = new_dt - offset;
                let normalized = new_rem_at.to_rfc3339();
                if let Err(err) = conn.execute(
                    "UPDATE reminders SET remind_at = ?1, triggered = 0 WHERE id = ?2",
                    params![normalized, id],
                ) {
                    if !is_unique_violation(&err) {
                        return Err(err);
                    }
                }
            }
        }
    }

    Ok(())
}

pub fn start_reminder_worker(app_handle: AppHandle, db: DatabaseConnection) {
    thread::spawn(move || {
        if let Err(err) = check_and_fire(&app_handle, &db) {
            eprintln!("reminder check failed: {}", err);
        }

        loop {
            thread::sleep(Duration::from_secs(CHECK_INTERVAL_SECS));
            if let Err(err) = check_and_fire(&app_handle, &db) {
                eprintln!("reminder check failed: {}", err);
            }
        }
    });
}

fn check_and_fire(app_handle: &AppHandle, db: &DatabaseConnection) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now();

    let mut stmt = conn
        .prepare(
            "SELECT r.id, r.task_id, r.remind_at, t.title, t.due_date, t.priority, t.tags
             FROM reminders r
             INNER JOIN tasks t ON t.id = r.task_id
             WHERE r.triggered = 0",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(PendingReminderRow {
                id: row.get(0)?,
                task_id: row.get(1)?,
                remind_at: row.get(2)?,
                title: row.get(3)?,
                due_date: row.get(4).ok(),
                priority: row.get(5).unwrap_or_default(),
                tags: row.get(6).unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?;

    for row in rows {
        let reminder = row.map_err(|e| e.to_string())?;
        let remind_at_dt = match normalize_datetime(&reminder.remind_at) {
            Some(dt) => dt,
            None => {
                conn.execute("UPDATE reminders SET triggered = 1 WHERE id = ?1", params![reminder.id])
                    .map_err(|e| e.to_string())?;
                continue;
            }
        };

        if remind_at_dt > now {
            continue;
        }

        let due_dt = reminder.due_date.as_deref().and_then(normalize_datetime);
        let late = due_dt.map(|d| d < now).unwrap_or(false);

        send_notification(app_handle, &reminder, due_dt, late)?;

        conn.execute(
            "UPDATE reminders SET triggered = 1 WHERE id = ?1",
            params![reminder.id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn send_notification(
    app_handle: &AppHandle,
    reminder: &PendingReminderRow,
    due_dt: Option<DateTime<Utc>>,
    late: bool,
) -> Result<(), String> {
    let mut body_parts: Vec<String> = Vec::new();

    if let Some(due) = due_dt {
        let local_due = due.with_timezone(&Local);
        body_parts.push(format!("Task due at {}", local_due.format("%H:%M")));
    }

    if !reminder.priority.is_empty() {
        body_parts.push(format!("Priority: {}", reminder.priority));
    }

    if let Ok(tags) = serde_json::from_str::<Vec<String>>(&reminder.tags) {
        if let Some(category) = tags.first() {
            body_parts.push(format!("Category: {}", category));
        }
    }

    if late {
        body_parts.push("Late reminder".to_string());
    }

    let body = if body_parts.is_empty() {
        "Task reminder".to_string()
    } else {
        body_parts.join(" • ")
    };

    app_handle
        .notification()
        .builder()
        .title(reminder.title.clone())
        .body(body)
        .show()
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn normalize_datetime(raw: &str) -> Option<DateTime<Utc>> {
    if let Ok(dt) = DateTime::parse_from_rfc3339(raw) {
        return Some(dt.with_timezone(&Utc));
    }

    if let Ok(dt) = NaiveDateTime::parse_from_str(raw, "%Y-%m-%dT%H:%M") {
        if let Some(local_dt) = Local.from_local_datetime(&dt).single() {
            return Some(local_dt.with_timezone(&Utc));
        }
    }

    if let Ok(dt) = NaiveDateTime::parse_from_str(raw, "%Y-%m-%d %H:%M:%S") {
        if let Some(local_dt) = Local.from_local_datetime(&dt).single() {
            return Some(local_dt.with_timezone(&Utc));
        }
    }

    None
}

fn is_unique_violation(err: &rusqlite::Error) -> bool {
    matches!(
        err,
        rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error {
                code: rusqlite::ErrorCode::ConstraintViolation,
                ..
            },
            _,
        )
    ) || err.to_string().to_lowercase().contains("unique")
}
