// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{State, Manager};
use rusqlite::{Connection, OptionalExtension, Result as SqliteResult};
use chrono::{Local, NaiveDateTime, NaiveDate, TimeZone, Datelike};

mod reminders;

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub due_date: Option<String>,
    pub tags: Vec<String>,
    pub priority: String, // e.g., "Low", "Medium", "High"
    pub status: String,   // e.g., "Pending", "In Progress", "Done"
    #[serde(default)]
    pub subject_id: Option<i64>,
    #[serde(default)]
    pub estimated_minutes: Option<i64>,
    #[serde(default)]
    pub actual_minutes: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Subject {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub semester: String,
    #[serde(default)]
    pub credits: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Exam {
    pub id: i64,
    pub subject_id: i64,
    pub title: String,
    pub exam_date: String,
    #[serde(default)]
    pub weight: Option<f64>,
    #[serde(default)]
    pub notes: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FocusItem {
    pub task: Option<Task>,
    pub subject: Option<Subject>,
    pub reason: String,
    pub urgency: String,
    pub suggested_duration_minutes: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WeeklySummary {
    pub planned_minutes: i64,
    pub actual_minutes: i64,
    pub completion_rate: f64,
    pub on_track: bool,
    pub pace_warning: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TimeEntry {
    pub id: i64,
    pub task: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration: i64,
    pub category: String,
    #[serde(default)]
    pub subject_id: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Expense {
    pub id: i64,
    pub amount: f64,
    pub description: String,
    pub category: String,
    pub date: String,
    pub expense_type: String, // "expense" or "income"
}

#[derive(Clone)]
struct DatabaseConnection(Arc<Mutex<Connection>>);

fn get_db_path() -> PathBuf {
    // Use app data directory for better cross-platform support
    let mut path = dirs::data_local_dir()
        .unwrap_or_else(|| std::env::current_dir().unwrap());
    path.push("zentrack");
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&path).ok();
    path.push("zentrack.db");
    path
}

fn init_database() -> SqliteResult<Connection> {
    let db_path = get_db_path();
    
    // Create parent directory if it doesn't exist
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).ok();
    }
    
    let conn = Connection::open(db_path)?;

    conn.execute("PRAGMA foreign_keys = ON;", [])?;
    
    // Create tasks table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            due_date TEXT,
            tags TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL
        )",
        [],
    )?;

    // Create time_entries table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration INTEGER NOT NULL,
            category TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create expenses table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            expense_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create subjects table for student-specific tracking
    conn.execute(
        "CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#ff6b35',
            semester TEXT NOT NULL DEFAULT 'current',
            credits INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create exams table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            exam_date TEXT NOT NULL,
            weight REAL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Add subject_id and estimated_minutes columns to tasks if not exist (safe migration)
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN subject_id INTEGER", []);
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN estimated_minutes INTEGER DEFAULT 60", []);
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN actual_minutes INTEGER DEFAULT 0", []);
    
    // Add subject_id to time_entries for subject-based tracking
    let _ = conn.execute("ALTER TABLE time_entries ADD COLUMN subject_id INTEGER", []);

    // Create study_streaks table for guilt-free streaks
    conn.execute(
        "CREATE TABLE IF NOT EXISTS study_streaks (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            current_streak INTEGER NOT NULL DEFAULT 0,
            longest_streak INTEGER NOT NULL DEFAULT 0,
            last_study_date TEXT,
            paused INTEGER NOT NULL DEFAULT 0,
            grace_days_used INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    
    // Insert default streak row if not exists
    conn.execute(
        "INSERT OR IGNORE INTO study_streaks (id, current_streak, longest_streak) VALUES (1, 0, 0)",
        [],
    )?;

    // Create app_settings table for semester setup and preferences
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    reminders::init_reminders_table(&conn)?;
    
    Ok(conn)
}

fn load_tasks(conn: &Connection) -> SqliteResult<Vec<Task>> {
    let mut stmt = conn.prepare("SELECT id, title, description, due_date, tags, priority, status, subject_id, estimated_minutes, actual_minutes FROM tasks")?;
    
    let tasks = stmt.query_map([], |row| {
        let tags_str: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
        
        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            due_date: row.get(3)?,
            tags,
            priority: row.get(5)?,
            status: row.get(6)?,
            subject_id: row.get(7)?,
            estimated_minutes: row.get(8)?,
            actual_minutes: row.get(9)?,
        })
    })?;
    
    tasks.collect()
}

#[tauri::command]
fn get_tasks(state: State<'_, DatabaseConnection>) -> Result<Vec<Task>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    load_tasks(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_task(state: State<'_, DatabaseConnection>, task: Task) -> Result<Vec<Task>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let tags_json = serde_json::to_string(&task.tags).map_err(|e| e.to_string())?;
    let due_date = task.due_date.clone().unwrap_or_default();

    conn.execute(
        "INSERT INTO tasks (title, description, due_date, tags, priority, status, subject_id, estimated_minutes, actual_minutes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            &task.title,
            &task.description,
            &due_date,
            &tags_json,
            &task.priority,
            &task.status,
            task.subject_id,
            task.estimated_minutes.unwrap_or(60),
            task.actual_minutes.unwrap_or(0)
        ],
    ).map_err(|e| e.to_string())?;

    load_tasks(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_task(state: State<'_, DatabaseConnection>, task: Task) -> Result<Vec<Task>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let tags_json = serde_json::to_string(&task.tags).map_err(|e| e.to_string())?;
    let due_date = task.due_date.clone().unwrap_or_default();

    let previous_due_date: Option<String> = conn
        .query_row(
            "SELECT due_date FROM tasks WHERE id = ?1",
            rusqlite::params![task.id as i64],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE tasks SET title = ?1, description = ?2, due_date = ?3, tags = ?4, priority = ?5, status = ?6, subject_id = ?7, estimated_minutes = ?8, actual_minutes = ?9 WHERE id = ?10",
        rusqlite::params![
            &task.title,
            &task.description,
            &due_date,
            &tags_json,
            &task.priority,
            &task.status,
            task.subject_id,
            task.estimated_minutes.unwrap_or(60),
            task.actual_minutes.unwrap_or(0),
            task.id as i64
        ],
    ).map_err(|e| e.to_string())?;

    reminders::recalculate_reminders_for_task(
        &conn,
        task.id as i64,
        previous_due_date.as_deref(),
        task.due_date.as_deref(),
    )
    .map_err(|e| e.to_string())?;

    load_tasks(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_task(state: State<'_, DatabaseConnection>, id: u64) -> Result<Vec<Task>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM tasks WHERE id = ?1",
        rusqlite::params![id as i64]
    ).map_err(|e| e.to_string())?;

    load_tasks(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_reminder(state: State<'_, DatabaseConnection>, task_id: i64, remind_at: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    reminders::create_reminder(&conn, task_id, remind_at)
}

#[tauri::command]
fn get_reminders_for_task(state: State<'_, DatabaseConnection>, task_id: i64) -> Result<Vec<reminders::Reminder>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    reminders::get_reminders_for_task(&conn, task_id)
}

#[tauri::command]
fn delete_reminder(state: State<'_, DatabaseConnection>, reminder_id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    reminders::delete_reminder(&conn, reminder_id)
}

// TimeTracker Commands
#[tauri::command]
fn get_time_entries(state: State<'_, DatabaseConnection>) -> Result<Vec<TimeEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, task, start_time, end_time, duration, category, subject_id FROM time_entries ORDER BY start_time DESC")
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map([], |row| {
            Ok(TimeEntry {
                id: row.get(0)?,
                task: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                duration: row.get(4)?,
                category: row.get(5)?,
                subject_id: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    entries.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_time_entry(state: State<'_, DatabaseConnection>, entry: TimeEntry) -> Result<Vec<TimeEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO time_entries (task, start_time, end_time, duration, category, subject_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            &entry.task,
            &entry.start_time,
            &entry.end_time,
            entry.duration,
            &entry.category,
            entry.subject_id
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, task, start_time, end_time, duration, category, subject_id FROM time_entries ORDER BY start_time DESC")
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map([], |row| {
            Ok(TimeEntry {
                id: row.get(0)?,
                task: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                duration: row.get(4)?,
                category: row.get(5)?,
                subject_id: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    entries.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_time_entry(state: State<'_, DatabaseConnection>, entry: TimeEntry) -> Result<Vec<TimeEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE time_entries SET task = ?1, start_time = ?2, end_time = ?3, duration = ?4, category = ?5, subject_id = ?6 WHERE id = ?7",
        rusqlite::params![
            &entry.task,
            &entry.start_time,
            &entry.end_time,
            entry.duration,
            &entry.category,
            entry.subject_id,
            entry.id
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, task, start_time, end_time, duration, category, subject_id FROM time_entries ORDER BY start_time DESC")
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map([], |row| {
            Ok(TimeEntry {
                id: row.get(0)?,
                task: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                duration: row.get(4)?,
                category: row.get(5)?,
                subject_id: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    entries.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_time_entry(state: State<'_, DatabaseConnection>, id: i64) -> Result<Vec<TimeEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM time_entries WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, task, start_time, end_time, duration, category, subject_id FROM time_entries ORDER BY start_time DESC")
        .map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map([], |row| {
            Ok(TimeEntry {
                id: row.get(0)?,
                task: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                duration: row.get(4)?,
                category: row.get(5)?,
                subject_id: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    entries.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// Spending Commands
#[tauri::command]
fn get_expenses(state: State<'_, DatabaseConnection>) -> Result<Vec<Expense>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, amount, description, category, date, expense_type FROM expenses ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map([], |row| {
            Ok(Expense {
                id: row.get(0)?,
                amount: row.get(1)?,
                description: row.get(2)?,
                category: row.get(3)?,
                date: row.get(4)?,
                expense_type: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    expenses.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_expense(state: State<'_, DatabaseConnection>, expense: Expense) -> Result<Vec<Expense>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO expenses (amount, description, category, date, expense_type) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            expense.amount,
            &expense.description,
            &expense.category,
            &expense.date,
            &expense.expense_type
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, amount, description, category, date, expense_type FROM expenses ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map([], |row| {
            Ok(Expense {
                id: row.get(0)?,
                amount: row.get(1)?,
                description: row.get(2)?,
                category: row.get(3)?,
                date: row.get(4)?,
                expense_type: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    expenses.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_expense(state: State<'_, DatabaseConnection>, expense: Expense) -> Result<Vec<Expense>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE expenses SET amount = ?1, description = ?2, category = ?3, date = ?4, expense_type = ?5 WHERE id = ?6",
        rusqlite::params![
            expense.amount,
            &expense.description,
            &expense.category,
            &expense.date,
            &expense.expense_type,
            expense.id
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, amount, description, category, date, expense_type FROM expenses ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map([], |row| {
            Ok(Expense {
                id: row.get(0)?,
                amount: row.get(1)?,
                description: row.get(2)?,
                category: row.get(3)?,
                date: row.get(4)?,
                expense_type: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    expenses.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_expense(state: State<'_, DatabaseConnection>, id: i64) -> Result<Vec<Expense>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM expenses WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, amount, description, category, date, expense_type FROM expenses ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map([], |row| {
            Ok(Expense {
                id: row.get(0)?,
                amount: row.get(1)?,
                description: row.get(2)?,
                category: row.get(3)?,
                date: row.get(4)?,
                expense_type: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    expenses.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ============================================================================
// Subject Commands
// ============================================================================

#[tauri::command]
fn get_subjects(state: State<'_, DatabaseConnection>) -> Result<Vec<Subject>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, color, semester, credits FROM subjects ORDER BY name")
        .map_err(|e| e.to_string())?;

    let subjects = stmt
        .query_map([], |row| {
            Ok(Subject {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                semester: row.get(3)?,
                credits: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    subjects.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_subject(state: State<'_, DatabaseConnection>, subject: Subject) -> Result<Vec<Subject>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO subjects (name, color, semester, credits) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![&subject.name, &subject.color, &subject.semester, subject.credits],
    )
    .map_err(|e| e.to_string())?;

    drop(conn);
    let state_clone = state.clone();
    get_subjects(state_clone)
}

#[tauri::command]
fn update_subject(state: State<'_, DatabaseConnection>, subject: Subject) -> Result<Vec<Subject>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE subjects SET name = ?1, color = ?2, semester = ?3, credits = ?4 WHERE id = ?5",
        rusqlite::params![&subject.name, &subject.color, &subject.semester, subject.credits, subject.id],
    )
    .map_err(|e| e.to_string())?;

    drop(conn);
    get_subjects(state)
}

#[tauri::command]
fn delete_subject(state: State<'_, DatabaseConnection>, id: i64) -> Result<Vec<Subject>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM subjects WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;

    drop(conn);
    get_subjects(state)
}

// ============================================================================
// Exam Commands
// ============================================================================

#[tauri::command]
fn get_exams(state: State<'_, DatabaseConnection>) -> Result<Vec<Exam>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, subject_id, title, exam_date, weight, notes FROM exams ORDER BY exam_date")
        .map_err(|e| e.to_string())?;

    let exams = stmt
        .query_map([], |row| {
            Ok(Exam {
                id: row.get(0)?,
                subject_id: row.get(1)?,
                title: row.get(2)?,
                exam_date: row.get(3)?,
                weight: row.get(4)?,
                notes: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    exams.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_exam(state: State<'_, DatabaseConnection>, exam: Exam) -> Result<Vec<Exam>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO exams (subject_id, title, exam_date, weight, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![exam.subject_id, &exam.title, &exam.exam_date, exam.weight, &exam.notes],
    )
    .map_err(|e| e.to_string())?;

    drop(conn);
    get_exams(state)
}

#[tauri::command]
fn update_exam(state: State<'_, DatabaseConnection>, exam: Exam) -> Result<Vec<Exam>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE exams SET subject_id = ?1, title = ?2, exam_date = ?3, weight = ?4, notes = ?5 WHERE id = ?6",
        rusqlite::params![exam.subject_id, &exam.title, &exam.exam_date, exam.weight, &exam.notes, exam.id],
    )
    .map_err(|e| e.to_string())?;

    drop(conn);
    get_exams(state)
}

#[tauri::command]
fn delete_exam(state: State<'_, DatabaseConnection>, id: i64) -> Result<Vec<Exam>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM exams WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;

    drop(conn);
    get_exams(state)
}

// ============================================================================
// Focus Recommendation Engine (Backend computation for complex scenarios)
// ============================================================================

#[tauri::command]
fn get_next_focus_item(state: State<'_, DatabaseConnection>) -> Result<FocusItem, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    
    // Load active tasks with subject info
    let tasks = load_tasks(&conn).map_err(|e| e.to_string())?;
    let active_tasks: Vec<_> = tasks.into_iter().filter(|t| t.status != "Done").collect();
    
    if active_tasks.is_empty() {
        return Ok(FocusItem {
            task: None,
            subject: None,
            reason: "All caught up! No pending tasks.".to_string(),
            urgency: "low".to_string(),
            suggested_duration_minutes: 0,
        });
    }
    
    // Load exams for proximity check
    let mut exam_stmt = conn
        .prepare("SELECT id, subject_id, title, exam_date, weight, notes FROM exams")
        .map_err(|e| e.to_string())?;
    let exams: Vec<Exam> = exam_stmt
        .query_map([], |row| {
            Ok(Exam {
                id: row.get(0)?,
                subject_id: row.get(1)?,
                title: row.get(2)?,
                exam_date: row.get(3)?,
                weight: row.get(4)?,
                notes: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    // Load time entries for effort calculation
    let mut time_stmt = conn
        .prepare("SELECT task, SUM(duration) as total FROM time_entries GROUP BY task")
        .map_err(|e| e.to_string())?;
    let time_by_task: std::collections::HashMap<String, i64> = time_stmt
        .query_map([], |row| {
            let task: String = row.get(0)?;
            let total: i64 = row.get(1)?;
            Ok((task, total))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    let now = Local::now();
    
    // Score each task
    let mut scored_tasks: Vec<(Task, i64, Vec<String>)> = active_tasks
        .into_iter()
        .map(|task| {
            let mut score: i64 = 0;
            let mut reasons: Vec<String> = Vec::new();
            
            // Priority score (0-30)
            let priority_score = match task.priority.as_str() {
                "High" => 30,
                "Medium" => 20,
                "Low" => 10,
                _ => 10,
            };
            score += priority_score;
            
            // Deadline proximity (0-50)
            if let Some(ref due_date) = task.due_date {
                if let Ok(due) = NaiveDateTime::parse_from_str(due_date, "%Y-%m-%dT%H:%M") {
                    let due_local = Local.from_local_datetime(&due).single();
                    if let Some(due_dt) = due_local {
                        let days_until = (due_dt.signed_duration_since(now)).num_days();
                        if days_until < 0 {
                            score += 50;
                            reasons.push("Overdue".to_string());
                        } else if days_until <= 1 {
                            score += 45;
                            reasons.push("Due today/tomorrow".to_string());
                        } else if days_until <= 3 {
                            score += 35;
                            reasons.push(format!("Due in {} days", days_until));
                        } else if days_until <= 7 {
                            score += 20;
                            reasons.push(format!("Due in {} days", days_until));
                        }
                    }
                }
            }
            
            // Exam proximity boost (0-40)
            if let Some(subject_id) = task.subject_id {
                for exam in &exams {
                    if exam.subject_id == subject_id {
                        if let Ok(exam_date) = NaiveDate::parse_from_str(&exam.exam_date, "%Y-%m-%d") {
                            let days_until_exam = (exam_date - now.date_naive()).num_days();
                            if days_until_exam > 0 && days_until_exam <= 7 {
                                score += 40;
                                reasons.push(format!("Exam in {} days", days_until_exam));
                            } else if days_until_exam > 0 && days_until_exam <= 14 {
                                score += 25;
                                reasons.push(format!("Exam in {} days", days_until_exam));
                            }
                        }
                    }
                }
            }
            
            // Time effort consideration
            let time_spent = time_by_task.get(&task.title).copied().unwrap_or(0) / 60; // to minutes
            let estimated = task.estimated_minutes.unwrap_or(60);
            let completion_ratio = if estimated > 0 { (time_spent * 100) / estimated } else { 0 };
            
            if completion_ratio < 50 {
                score += 15;
                reasons.push(format!("Only {}% time invested", completion_ratio));
            }
            
            // In Progress boost
            if task.status == "In Progress" {
                score += 5;
            }
            
            (task, score, reasons)
        })
        .collect();
    
    // Sort by score descending
    scored_tasks.sort_by(|a, b| b.1.cmp(&a.1));
    
    let (top_task, score, reasons) = scored_tasks.into_iter().next().unwrap();
    
    // Get subject if any
    let subject = if let Some(subject_id) = top_task.subject_id {
        conn.query_row(
            "SELECT id, name, color, semester, credits FROM subjects WHERE id = ?1",
            rusqlite::params![subject_id],
            |row| {
                Ok(Subject {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    semester: row.get(3)?,
                    credits: row.get(4)?,
                })
            },
        )
        .ok()
    } else {
        None
    };
    
    // Determine urgency
    let urgency = if score >= 70 {
        "critical"
    } else if score >= 50 {
        "high"
    } else if score >= 30 {
        "medium"
    } else {
        "low"
    };
    
    // Calculate suggested duration
    let time_spent = time_by_task.get(&top_task.title).copied().unwrap_or(0) / 60;
    let estimated = top_task.estimated_minutes.unwrap_or(60);
    let remaining = std::cmp::max(25, estimated - time_spent);
    let suggested = std::cmp::min(remaining, 90);
    
    let reason = if reasons.is_empty() {
        "This task needs your attention.".to_string()
    } else {
        reasons.join(". ") + "."
    };
    
    Ok(FocusItem {
        task: Some(top_task),
        subject,
        reason,
        urgency: urgency.to_string(),
        suggested_duration_minutes: suggested,
    })
}

// ============================================================================
// Weekly Summary (Time Reality Check)
// ============================================================================

#[tauri::command]
fn get_weekly_summary(state: State<'_, DatabaseConnection>) -> Result<WeeklySummary, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    
    let now = Local::now();
    let days_since_monday = now.weekday().num_days_from_monday() as i64;
    let week_start = now - chrono::Duration::days(days_since_monday);
    let week_start_str = week_start.format("%Y-%m-%d").to_string();
    
    // Get planned minutes from tasks due this week
    let planned_minutes: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(COALESCE(estimated_minutes, 60)), 0) FROM tasks 
             WHERE status != 'Done' AND due_date >= ?1 AND due_date <= date('now', '+7 days')",
            rusqlite::params![&week_start_str],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    // Get actual minutes tracked this week
    let actual_minutes: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(duration), 0) / 60 FROM time_entries WHERE start_time >= ?1",
            rusqlite::params![&week_start_str],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    let completion_rate = if planned_minutes > 0 {
        ((actual_minutes as f64) / (planned_minutes as f64) * 100.0).min(100.0)
    } else {
        100.0
    };
    
    let days_into_week = days_since_monday + 1;
    let expected_progress = (days_into_week as f64 / 7.0) * 100.0;
    let on_track = completion_rate >= expected_progress * 0.8;
    
    let pace_warning = if planned_minutes > 0 && completion_rate < 50.0 && days_into_week >= 3 {
        let remaining = planned_minutes - actual_minutes;
        let days_left = 7 - days_into_week;
        if days_left > 0 {
            Some(format!("At this pace, you need {} min/day to catch up.", remaining / days_left))
        } else {
            None
        }
    } else {
        None
    };
    
    Ok(WeeklySummary {
        planned_minutes,
        actual_minutes,
        completion_rate,
        on_track,
        pace_warning,
    })
}

// ============================================================================
// App Settings
// ============================================================================

#[tauri::command]
fn get_app_setting(state: State<'_, DatabaseConnection>, key: String) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    
    let result: Option<String> = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            rusqlite::params![&key],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    
    Ok(result)
}

#[tauri::command]
fn set_app_setting(state: State<'_, DatabaseConnection>, key: String, value: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))",
        rusqlite::params![&key, &value],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

fn main() {
    let conn = init_database().expect("Failed to initialize database");
    let db_state = DatabaseConnection(Arc::new(Mutex::new(conn)));
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(db_state.clone())
        .setup(|app| {
            let app_handle = app.handle();
            let db = app.state::<DatabaseConnection>().inner().clone();
            reminders::start_reminder_worker(app_handle.clone(), db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_tasks,
            add_task,
            update_task,
            delete_task,
            create_reminder,
            get_reminders_for_task,
            delete_reminder,
            get_time_entries,
            add_time_entry,
            update_time_entry,
            delete_time_entry,
            get_expenses,
            add_expense,
            update_expense,
            delete_expense,
            // New student-focused commands
            get_subjects,
            add_subject,
            update_subject,
            delete_subject,
            get_exams,
            add_exam,
            update_exam,
            delete_exam,
            get_next_focus_item,
            get_weekly_summary,
            get_app_setting,
            set_app_setting
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
