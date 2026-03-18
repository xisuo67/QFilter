use anyhow::{anyhow, Result};
use image::DynamicImage;
use rxing::helpers;
use serde::{Deserialize, Serialize};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Pool, Row, Sqlite,
};
use std::{
    path::PathBuf,
    str::FromStr,
    sync::OnceLock,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;
use url::Url;

static DB_POOL: OnceLock<Pool<Sqlite>> = OnceLock::new();
static APP_DATA_DIR: OnceLock<PathBuf> = OnceLock::new();

#[derive(Debug, Serialize, Deserialize)]
struct ModelConfig {
    api_url: String,
    model_name: String,
    api_key: String,
    prompt: String,
}

#[derive(Debug, Serialize)]
struct ValidateQrResult {
    valid: bool,
    url: Option<String>,
    qr_type: Option<String>,
    message: Option<String>,
}

const ALLOWED_QR_HOST_SUFFIXES: &[(&str, &str)] = &[
    ("work.weixin.qq.com", "work_weixin"),
    ("weixin.qq.com", "weixin"),
    ("u.wechat.com", "wechat"),
    ("dingtalk.com", "dingtalk"),
    ("feishu.cn", "feishu"),
];

fn parse_qr_url_type(raw_url: &str) -> Option<String> {
    let trimmed = raw_url.trim();
    let parsed = Url::parse(trimmed).ok()?;
    let mut host = parsed.host_str()?.to_lowercase();

    if let Some(idx) = host.find(':') {
        host = host[..idx].to_string();
    }

    for (suffix, typ) in ALLOWED_QR_HOST_SUFFIXES {
        if host == *suffix || host.ends_with(&format!(".{suffix}")) {
            return Some((*typ).to_string());
        }
    }

    None
}

#[tauri::command]
async fn validate_qr(image: Vec<u8>) -> Result<ValidateQrResult, String> {
    // 先把内存中的图片写入临时文件，交给 rxing 按文件路径识别
    let app_dir = APP_DATA_DIR
        .get()
        .ok_or_else(|| "app data dir not set".to_string())?
        .clone();

    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("time error: {e}"))?
        .as_nanos();
    let tmp_path = app_dir.join(format!("qf_tmp_qr_{nanos}.png"));

    // 解码再用 image 保存成 png，保证格式稳定
    let dyn_img: DynamicImage = image::load_from_memory(&image)
        .map_err(|e| {
            eprintln!("[validate_qr] image decode error: {e}");
            format!("image decode error: {e}")
        })?;
    if let Err(e) = dyn_img.save(&tmp_path) {
        eprintln!(
            "[validate_qr] image save error at {:?}: {e}",
            &tmp_path
        );
        return Err(format!("image save error: {e}"));
    }

    // 使用 rxing helpers 按文件识别二维码
    let results = helpers::detect_multiple_in_file(
        tmp_path
            .to_str()
            .ok_or_else(|| "invalid temp path".to_string())?,
    )
    .map_err(|e| {
        eprintln!(
            "[validate_qr] rxing decode error on file {:?}: {e}",
            &tmp_path
        );
        format!("rxing decode error: {e}")
    })?;

    // 用完即删
    let _ = std::fs::remove_file(&tmp_path);

    let first = match results.first() {
        Some(r) => r,
        None => {
            eprintln!("[validate_qr] no QR code detected from {:?}", &tmp_path);
            return Ok(ValidateQrResult {
                valid: false,
                url: None,
                qr_type: None,
                message: Some("未识别到二维码".to_string()),
            })
        }
    };

    let content = first.getText();
    println!(
        "[validate_qr] decoded QR content: {} (format: {:?})",
        content,
        first.getBarcodeFormat()
    );

    if let Some(qr_type) = parse_qr_url_type(&content) {
        println!(
            "[validate_qr] QR URL passed whitelist: type = {}, url = {}",
            qr_type, content
        );
        Ok(ValidateQrResult {
            valid: true,
            url: Some(content.to_string()),
            qr_type: Some(qr_type),
            message: None,
        })
    } else {
        eprintln!(
            "[validate_qr] QR URL not in whitelist: {}",
            content
        );
        Ok(ValidateQrResult {
            valid: false,
            url: Some(content.to_string()),
            qr_type: None,
            message: Some("二维码链接不在允许的范围内".to_string()),
        })
    }
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
        INSERT INTO model_settings (id, api_url, model_name, api_key, prompt)
        VALUES (1, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            api_url = excluded.api_url,
            model_name = excluded.model_name,
            api_key = excluded.api_key,
            prompt = excluded.prompt;
        "#,
    )
    .bind(&config.api_url)
    .bind(&config.model_name)
    .bind(&config.api_key)
    .bind(&config.prompt)
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
        SELECT api_url, model_name, api_key, prompt
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
        prompt: r.get("prompt"),
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
            load_model_config,
            validate_qr
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
