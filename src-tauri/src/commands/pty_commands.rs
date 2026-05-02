use tauri::State;

use crate::pty::manager::PtyManager;

#[tauri::command]
pub async fn create_session(
    app: tauri::AppHandle,
    manager: State<'_, PtyManager>,
    cwd: Option<String>,
    shell: Option<String>,
    cols: u16,
    rows: u16,
) -> Result<String, String> {
    manager
        .create_session(app, cwd, shell, cols, rows)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_to_pty(
    manager: State<'_, PtyManager>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    manager.write(&session_id, &data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resize_pty(
    manager: State<'_, PtyManager>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    manager.resize(&session_id, cols, rows).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn kill_session(
    manager: State<'_, PtyManager>,
    session_id: String,
) -> Result<(), String> {
    manager.kill(&session_id).map_err(|e| e.to_string())
}
