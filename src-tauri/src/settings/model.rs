use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default = "default_theme")]
    pub theme: String,
    pub custom_theme_path: Option<String>,
    #[serde(default = "default_font_family")]
    pub font_family: String,
    #[serde(default = "default_font_size")]
    pub font_size: u32,
    pub background_image: Option<String>,
    #[serde(default = "default_background_opacity")]
    pub background_opacity: f32,
    #[serde(default = "default_cursor_style")]
    pub cursor_style: String,
    #[serde(default = "default_true")]
    pub cursor_blink: bool,
    pub shell: Option<String>,
    #[serde(default = "default_scrollback")]
    pub scrollback: u32,
    #[serde(default = "default_true")]
    pub ligatures: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            custom_theme_path: None,
            font_family: default_font_family(),
            font_size: default_font_size(),
            background_image: None,
            background_opacity: default_background_opacity(),
            cursor_style: default_cursor_style(),
            cursor_blink: true,
            shell: None,
            scrollback: default_scrollback(),
            ligatures: true,
        }
    }
}

fn default_theme() -> String { "tokyo-night".to_string() }
fn default_font_family() -> String { "JetBrains Mono".to_string() }
fn default_font_size() -> u32 { 14 }
fn default_background_opacity() -> f32 { 1.0 }
fn default_cursor_style() -> String { "block".to_string() }
fn default_scrollback() -> u32 { 10000 }
fn default_true() -> bool { true }
