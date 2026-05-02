use tauri_plugin_store::StoreExt;

use crate::settings::model::AppSettings;

const SETTINGS_KEY: &str = "settings";

#[tauri::command]
pub async fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let settings = store
        .get(SETTINGS_KEY)
        .and_then(|v| {
            let s = serde_json::from_value::<AppSettings>(v.clone());
            if let Err(ref e) = s {
                println!("Failed to deserialize settings: {e}. Value: {v:?}");
            }
            s.ok()
        })
        .unwrap_or_default();
    println!("Loaded settings: {:?}", settings);
    Ok(settings)
}

#[tauri::command]
pub async fn set_settings(
    app: tauri::AppHandle,
    settings: AppSettings,
) -> Result<(), String> {
    println!("Saving settings: {:?}", settings);
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set(SETTINGS_KEY, serde_json::to_value(&settings).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
