
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;

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

struct DatabaseConnection(Mutex<Connection>);

fn get_db_path() -> PathBuf {
    // Use app data directory for better cross-platform support
    let mut path = tauri::api::path::app_data_dir(&tauri::Config::default())
        .unwrap_or_else(|| std::env::current_dir().unwrap());
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
    
    conn.execute(
        "INSERT INTO tasks (title, description, due_date, tags, priority, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        &[&task.title, &task.description, &task.due_date.as_ref().map(|s| s.as_str()).unwrap_or(""), &tags_json, &task.priority, &task.status],
    ).map_err(|e| e.to_string())?;
    
    load_tasks(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_task(state: State<'_, DatabaseConnection>, task: Task) -> Result<Vec<Task>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    
    let tags_json = serde_json::to_string(&task.tags).map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE tasks SET title = ?1, description = ?2, due_date = ?3, tags = ?4, priority = ?5, status = ?6 WHERE id = ?7",
        &[&task.title, &task.description, &task.due_date.as_ref().map(|s| s.as_str()).unwrap_or(""), &tags_json, &task.priority, &task.status, &task.id.to_string()],
    ).map_err(|e| e.to_string())?;
    
    load_tasks(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_task(state: State<'_, DatabaseConnection>, id: u64) -> Result<Vec<Task>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM tasks WHERE id = ?1", &[&id.to_string()])
        .map_err(|e| e.to_string())?;
    
    load_tasks(&conn).map_err(|e| e.to_string())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = init_database().expect("Failed to initialize database");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DatabaseConnection(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            get_tasks,
            add_task,
            update_task,
            delete_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
