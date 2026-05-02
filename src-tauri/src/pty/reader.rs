use base64::{engine::general_purpose::STANDARD as B64, Engine};
use std::io::Read;
use tauri::{AppHandle, Emitter};

use crate::util::osc::{OscEvent, OscParser, PromptMark};

/// Spawns a blocking read loop for a PTY reader. Emits Tauri events for output and OSC sequences.
pub fn spawn_reader(
    app: AppHandle,
    session_id: String,
    reader: Box<dyn Read + Send>,
) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let app_clone = app.clone();
        let sid = session_id.clone();
        let mut reader = reader;

        tokio::task::spawn_blocking(move || {
            let mut parser = OscParser::new();
            let mut buf = [0u8; 4096];

            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let (clean, events) = parser.process(&buf[..n]);

                        if !clean.is_empty() {
                            let encoded = B64.encode(&clean);
                            let _ = app_clone.emit(
                                &format!("pty://output/{}", sid),
                                serde_json::json!({ "data": encoded }),
                            );
                        }

                        for event in events {
                            log::debug!("PTY OSC event for {}: {:?}", sid, event);
                            emit_osc_event(&app_clone, &sid, event);
                        }
                    }
                    Err(e) => {
                        log::debug!("PTY read ended: {e}");
                        break;
                    }
                }
            }

            let _ = app_clone.emit(
                &format!("pty://exit/{}", sid),
                serde_json::json!({ "exitCode": 0 }),
            );
        })
        .await
        .ok();
    })
}

fn emit_osc_event(app: &AppHandle, session_id: &str, event: OscEvent) {
    match event {
        OscEvent::CwdChange(url) => {
            // Strip file://hostname prefix
            let path = url
                .strip_prefix("file://")
                .and_then(|s| s.find('/').map(|i| s[i..].to_string()))
                .unwrap_or(url);
            let _ = app.emit(
                &format!("pty://cwd_change/{}", session_id),
                serde_json::json!({ "cwd": path }),
            );
        }
        OscEvent::TitleChange(title) => {
            let _ = app.emit(
                &format!("pty://title_change/{}", session_id),
                serde_json::json!({ "title": title }),
            );
        }
        OscEvent::Suggestion(text) => {
            let _ = app.emit(
                &format!("pty://suggestion/{}", session_id),
                serde_json::json!({ "suggestion": text }),
            );
        }
        OscEvent::PromptMark(mark) => {
            let kind = match mark {
                PromptMark::PromptStart => "A",
                PromptMark::PromptEnd => "B",
                PromptMark::CommandStart => "C",
                PromptMark::CommandEnd(_) => "D",
            };
            let _ = app.emit(
                &format!("pty://prompt_mark/{}", session_id),
                serde_json::json!({ "mark": kind }),
            );
        }
    }
}
