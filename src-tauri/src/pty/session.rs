use std::io::Write;
use std::sync::Mutex;

use anyhow::Result;
use portable_pty::{Child, MasterPty, PtySize};
use tokio::task::JoinHandle;

pub struct PtySession {
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Mutex<Box<dyn Write + Send>>,
    pub child: Box<dyn Child + Send + Sync>,
    pub reader_handle: JoinHandle<()>,
    #[allow(dead_code)]
    pub cwd: String,
    #[allow(dead_code)]
    pub title: String,
    #[allow(dead_code)]
    pub shell_kind: ShellKind,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ShellKind {
    Fish,
    Zsh,
    Bash,
    Unknown(String),
}

impl ShellKind {
    pub fn from_path(path: &str) -> Self {
        let name = std::path::Path::new(path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");
        match name {
            "fish" => ShellKind::Fish,
            "zsh" => ShellKind::Zsh,
            "bash" => ShellKind::Bash,
            other => ShellKind::Unknown(other.to_string()),
        }
    }
}

impl PtySession {
    pub fn resize(&self, cols: u16, rows: u16) -> Result<()> {
        self.master.resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })?;
        Ok(())
    }

    pub fn write_data(&self, data: &[u8]) -> Result<()> {
        let mut writer = self.writer.lock().unwrap();
        writer.write_all(data)?;
        Ok(())
    }
}
