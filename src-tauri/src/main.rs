// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{State, Manager};
use rusqlite::{Connection, OptionalExtension, Result as SqliteResult};

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
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TimeEntry {
    pub id: i64,
    pub task: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration: i64,
    pub category: String,
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

    reminders::init_reminders_table(&conn)?;
    
    Ok(conn)
}

fn load_tasks(conn: &Connection) -> SqliteResult<Vec<Task>> {
    let mut stmt = conn.prepare("SELECT id, title, description, due_date, tags, priority, status FROM tasks")?;
    
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
        "INSERT INTO tasks (title, description, due_date, tags, priority, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            &task.title,
            &task.description,
            &due_date,
            &tags_json,
            &task.priority,
            &task.status
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
        "UPDATE tasks SET title = ?1, description = ?2, due_date = ?3, tags = ?4, priority = ?5, status = ?6 WHERE id = ?7",
        rusqlite::params![
            &task.title,
            &task.description,
            &due_date,
            &tags_json,
            &task.priority,
            &task.status,
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
        .prepare("SELECT id, task, start_time, end_time, duration, category FROM time_entries ORDER BY start_time DESC")
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
            })
        })
        .map_err(|e| e.to_string())?;

    entries.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_time_entry(state: State<'_, DatabaseConnection>, entry: TimeEntry) -> Result<Vec<TimeEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO time_entries (task, start_time, end_time, duration, category) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            &entry.task,
            &entry.start_time,
            &entry.end_time,
            entry.duration,
            &entry.category
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, task, start_time, end_time, duration, category FROM time_entries ORDER BY start_time DESC")
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
            })
        })
        .map_err(|e| e.to_string())?;

    entries.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_time_entry(state: State<'_, DatabaseConnection>, entry: TimeEntry) -> Result<Vec<TimeEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE time_entries SET task = ?1, start_time = ?2, end_time = ?3, duration = ?4, category = ?5 WHERE id = ?6",
        rusqlite::params![
            &entry.task,
            &entry.start_time,
            &entry.end_time,
            entry.duration,
            &entry.category,
            entry.id
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, task, start_time, end_time, duration, category FROM time_entries ORDER BY start_time DESC")
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
        .prepare("SELECT id, task, start_time, end_time, duration, category FROM time_entries ORDER BY start_time DESC")
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
            delete_expense
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
