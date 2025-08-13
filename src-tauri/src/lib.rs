
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::State;

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

type TaskList = Vec<Task>;

struct TaskStore(Mutex<TaskList>);

fn tasks_file() -> PathBuf {
    let mut path = std::env::current_dir().unwrap();
    path.push("tasks.json");
    path
}

fn load_tasks() -> TaskList {
    let path = tasks_file();
    if path.exists() {
        let data = fs::read_to_string(path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        vec![]
    }
}

fn save_tasks(tasks: &TaskList) -> Result<(), String> {
    let path = tasks_file();
    let data = serde_json::to_string_pretty(tasks)
        .map_err(|e| e.to_string())?;
    fs::write(path, data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_tasks(state: State<'_, TaskStore>) -> Vec<Task> {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
fn add_task(state: State<'_, TaskStore>, task: Task) -> Result<Vec<Task>, String> {
    let mut tasks = state.0.lock()
        .map_err(|e| e.to_string())?;
    let mut new_task = task.clone();
    new_task.id = tasks.iter().map(|t| t.id).max().unwrap_or(0) + 1;
    tasks.push(new_task);
    save_tasks(&tasks)?;
    Ok(tasks.clone())
}

#[tauri::command]
fn update_task(state: State<'_, TaskStore>, task: Task) -> Result<Vec<Task>, String> {
    let mut tasks = state.0.lock()
        .map_err(|e| e.to_string())?;
    if let Some(pos) = tasks.iter().position(|t| t.id == task.id) {
        tasks[pos] = task;
        save_tasks(&tasks)?;
    }
    Ok(tasks.clone())
}

#[tauri::command]
fn delete_task(state: State<'_, TaskStore>, id: u64) -> Result<Vec<Task>, String> {
    let mut tasks = state.0.lock()
        .map_err(|e| e.to_string())?;
    tasks.retain(|t| t.id != id);
    save_tasks(&tasks)?;
    Ok(tasks.clone())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tasks = load_tasks();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(TaskStore(Mutex::new(tasks)))
        .invoke_handler(tauri::generate_handler![
            get_tasks,
            add_task,
            update_task,
            delete_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
