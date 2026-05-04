mod commands;
mod lsd_bundler;
mod pty;
mod settings;
mod shell;
mod util;

use commands::{
    fs_commands::{check_path_exists, get_home_dir, read_image_file},
    pty_commands::{create_session, kill_session, resize_pty, write_to_pty},
    settings_commands::{get_settings, set_settings},
};
use pty::manager::PtyManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(PtyManager::new())
        .setup(|app| {
            if let Err(e) = lsd_bundler::extract_lsd(app.handle()) {
                log::warn!("Failed to extract bundled lsd: {e}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_session,
            write_to_pty,
            resize_pty,
            kill_session,
            get_home_dir,
            get_settings,
            set_settings,
            read_image_file,
            check_path_exists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Glacier");
}
