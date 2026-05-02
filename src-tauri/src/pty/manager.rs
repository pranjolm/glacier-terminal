use std::collections::HashMap;
use std::sync::Mutex;

use anyhow::{Context, Result};
use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use tauri::AppHandle;
use uuid::Uuid;

use crate::lsd_bundler;
use crate::pty::reader::spawn_reader;
use crate::pty::session::{PtySession, ShellKind};
use crate::shell::detect::detect_shell;
use crate::shell::integration::build_shell_command;

pub type SessionId = String;

pub struct PtyManager {
    pub sessions: Mutex<HashMap<SessionId, PtySession>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self { sessions: Mutex::new(HashMap::new()) }
    }

    pub fn create_session(
        &self,
        app: AppHandle,
        cwd: Option<String>,
        shell_override: Option<String>,
        cols: u16,
        rows: u16,
    ) -> Result<SessionId> {
        let shell_path = shell_override.unwrap_or_else(detect_shell);
        let shell_kind = ShellKind::from_path(&shell_path);
        let cwd = cwd.unwrap_or_else(|| {
            dirs::home_dir()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|| "/".to_string())
        });

        let pty_system = NativePtySystem::default();
        let pair = pty_system
            .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
            .context("Failed to open PTY")?;

        let bin_dir = lsd_bundler::lsd_path(&app)
            .and_then(|p| p.parent().map(|p| p.to_string_lossy().to_string()));
        let cmd: CommandBuilder = build_shell_command(&shell_path, &shell_kind, &cwd, bin_dir.as_deref());

        let child = pair.slave.spawn_command(cmd).context("Failed to spawn shell")?;
        drop(pair.slave);

        let writer = pair.master.take_writer().context("Failed to get PTY writer")?;
        let pty_reader = pair.master.try_clone_reader().context("Failed to clone PTY reader")?;

        let session_id = Uuid::new_v4().to_string();
        let reader_handle = spawn_reader(app, session_id.clone(), pty_reader);

        let session = PtySession {
            master: pair.master,
            writer: Mutex::new(writer),
            child,
            reader_handle,
            cwd,
            title: String::new(),
            shell_kind,
        };

        self.sessions.lock().unwrap().insert(session_id.clone(), session);
        Ok(session_id)
    }

    pub fn write(&self, session_id: &str, data: &str) -> Result<()> {
        let sessions = self.sessions.lock().unwrap();
        let session = sessions.get(session_id).context("Session not found")?;
        session.write_data(data.as_bytes())
    }

    pub fn resize(&self, session_id: &str, cols: u16, rows: u16) -> Result<()> {
        let sessions = self.sessions.lock().unwrap();
        let session = sessions.get(session_id).context("Session not found")?;
        session.resize(cols, rows)
    }

    pub fn kill(&self, session_id: &str) -> Result<()> {
        let mut sessions = self.sessions.lock().unwrap();
        if let Some(session) = sessions.remove(session_id) {
            session.reader_handle.abort();
            drop(session.child);
        }
        Ok(())
    }

    #[allow(dead_code)]
    pub fn update_cwd(&self, session_id: &str, cwd: String) {
        if let Ok(mut sessions) = self.sessions.lock() {
            if let Some(session) = sessions.get_mut(session_id) {
                session.cwd = cwd;
            }
        }
    }
}
