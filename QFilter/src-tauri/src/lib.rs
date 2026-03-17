use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Pool, Row, Sqlite,
};
use std::{path::PathBuf, str::FromStr, sync::OnceLock};
use tauri::Manager;

static DB_POOL: OnceLock<Pool<Sqlite>> = OnceLock::new();
static APP_DATA_DIR: OnceLock<PathBuf> = OnceLock::new();

#[derive(Debug, Serialize, Deserialize)]
struct ModelConfig {
    api_url: String,
    model_name: String,
    api_key: String,
}

async fn init_db() -> Result<Pool<Sqlite>> {
    let app_dir = APP_DATA_DIR
        .get()
        .ok_or_else(|| anyhow!("app data dir not set"))?
        .clone();
    dbg!(&app_dir);

    let db_path = app_dir.join("qfilter.db");
    dbg!(&db_path);
    std::fs::create_dir_all(&app_dir)?;

    // sqlx 的 SQLite 连接串需要使用正斜杠
    let path_str = db_path.to_string_lossy().to_string().replace('\\', "/");
    dbg!(&path_str);

    // 绝对路径使用 sqlite:///C:/...，相对路径 sqlite://...
    let url = if db_path.is_absolute() {
        format!("sqlite:///{}", path_str)
    } else {
        format!("sqlite://{}", path_str)
    };
    dbg!(&url);

    // 使用 SqliteConnectOptions，确保文件不存在时自动创建
    let options = SqliteConnectOptions::from_str(&url)?.create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    // 自动执行 migrations 目录下的迁移脚本（相对于 src-tauri/src）
    sqlx::migrate!("../src-tauri/migrations").run(&pool).await?;

    Ok(pool)
}

async fn get_pool() -> Result<Pool<Sqlite>> {
    if let Some(pool) = DB_POOL.get() {
        return Ok(pool.clone());
    }
    let pool = init_db().await?;
    let _ = DB_POOL.set(pool.clone());
    Ok(pool)
}

#[tauri::command]
async fn save_model_config(config: ModelConfig) -> Result<(), String> {
    let pool = get_pool()
        .await
        .map_err(|e| format!("db init error: {}", e))?;

    sqlx::query::<Sqlite>(
        r#"
        INSERT INTO model_settings (id, api_url, model_name, api_key)
        VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            api_url = excluded.api_url,
            model_name = excluded.model_name,
            api_key = excluded.api_key;
        "#,
    )
    .bind(&config.api_url)
    .bind(&config.model_name)
    .bind(&config.api_key)
    .execute(&pool)
    .await
    .map_err(|e| format!("db write error: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn load_model_config() -> Result<Option<ModelConfig>, String> {
    let pool = get_pool()
        .await
        .map_err(|e| format!("db init error: {}", e))?;

    let row = sqlx::query(
        r#"
        SELECT api_url, model_name, api_key
        FROM model_settings
        WHERE id = 1
        "#,
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("db read error: {}", e))?;

    Ok(row.map(|r| ModelConfig {
        api_url: r.get("api_url"),
        model_name: r.get("model_name"),
        api_key: r.get("api_key"),
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Ok(dir) = app.path().app_data_dir() {
                let _ = std::fs::create_dir_all(&dir);
                let _ = APP_DATA_DIR.set(dir);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_model_config,
            load_model_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
