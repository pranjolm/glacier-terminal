use std::env;
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;

use anyhow::Result;
use tauri::AppHandle;

/// Return the path to a bundled resource by walking up from the current
/// executable (works for both dev and release builds on macOS).
fn resource_path(name: &str) -> Option<PathBuf> {
    let exe = env::current_exe().ok()?;
    let exe_dir = exe.parent()?;

    // Release: Glacier.app/Contents/MacOS/glacier → ../Resources/...
    let app_resources = exe_dir.parent()?.join("Resources").join(name);
    if app_resources.exists() {
        return Some(app_resources);
    }

    // Dev fallback: src-tauri/resources/ relative to project root
    // Walk up from exe until we find src-tauri/resources
    let mut dir = exe_dir.to_path_buf();
    for _ in 0..6 {
        let candidate = dir.join("src-tauri").join("resources").join(name);
        if candidate.exists() {
            return Some(candidate);
        }
        dir = dir.parent()?.to_path_buf();
    }

    None
}

/// Extract the bundled lsd binary matching the current architecture into the
/// app's support directory so it can be used by shell integration scripts.
pub fn extract_lsd(_app: &AppHandle) -> Result<PathBuf> {
    let arch = std::env::consts::ARCH;
    let bundled_name = match arch {
        "aarch64" => "lsd-aarch64-apple-darwin",
        "x86_64" => "lsd-x86_64-apple-darwin",
        other => anyhow::bail!("Unsupported architecture: {other}"),
    };

    let src = resource_path(&format!("lsd/{bundled_name}"))
        .ok_or_else(|| anyhow::anyhow!("Failed to locate bundled lsd resource"))?;

    let bin_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("~/.config"))
        .join("com.glacier.app")
        .join("bin");

    fs::create_dir_all(&bin_dir)?;

    let dest = bin_dir.join("lsd");

    // Skip if already extracted and same size (cheap idempotency check)
    if let (Ok(src_meta), Ok(dest_meta)) = (fs::metadata(&src), fs::metadata(&dest)) {
        if src_meta.len() == dest_meta.len() {
            return Ok(dest);
        }
    }

    fs::copy(&src, &dest)?;
    let mut perms = fs::metadata(&dest)?.permissions();
    perms.set_mode(0o755);
    fs::set_permissions(&dest, perms)?;

    Ok(dest)
}

/// Return the path to the extracted lsd binary, or None if not yet extracted.
pub fn lsd_path(_app: &AppHandle) -> Option<PathBuf> {
    dirs::data_dir()
        .map(|d| d.join("com.glacier.app").join("bin").join("lsd"))
        .filter(|p| p.exists())
}
