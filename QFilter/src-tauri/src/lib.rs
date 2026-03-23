use anyhow::{anyhow, Result};
use chrono::{Datelike, Duration, NaiveDate, Utc};
use image::DynamicImage;
use rxing::helpers;
use serde::{Deserialize, Serialize};
use serde_json::Value;
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
    ("weixin.com", "work_weixin"),
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
    let dyn_img: DynamicImage = image::load_from_memory(&image).map_err(|e| {
        eprintln!("[validate_qr] image decode error: {e}");
        format!("image decode error: {e}")
    })?;
    if let Err(e) = dyn_img.save(&tmp_path) {
        eprintln!("[validate_qr] image save error at {:?}: {e}", &tmp_path);
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
            });
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
        eprintln!("[validate_qr] QR URL not in whitelist: {}", content);
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

#[derive(Debug, Serialize)]
struct OcrResult {
    success: bool,
    message: Option<String>,
    name: Option<String>,
    expire: Option<String>,
}

#[tauri::command]
async fn ocr_qr(image_url: String) -> Result<OcrResult, String> {
    let pool = get_pool()
        .await
        .map_err(|e| format!("db init error: {}", e))?;

    // 读取模型配置
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

    let config = if let Some(r) = row {
        ModelConfig {
            api_url: r.get("api_url"),
            model_name: r.get("model_name"),
            api_key: r.get("api_key"),
            prompt: r.get("prompt"),
        }
    } else {
        return Err("OCR 配置未设置，请先在设置页填写并保存。".to_string());
    };

    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "model": config.model_name,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url,
                            "min_pixels": 3072,
                            "max_pixels": 8_388_608
                        }
                    },
                    {
                        "type": "text",
                        "text": config.prompt
                    }
                ]
            }
        ]
    });

    let resp = client
        .post(&config.api_url)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("调用 OCR 接口失败: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("OCR 服务返回错误状态码: {}", resp.status()));
    }

    // DashScope 兼容 OpenAI，假设 content 里是模型输出的 JSON 字符串
    let resp_json: Value = resp
        .json()
        .await
        .map_err(|e| format!("解析 OCR 响应 JSON 失败: {e}"))?;

    let content_text = resp_json
        .get("choices")
        .and_then(|v| v.get(0))
        .and_then(|v| v.get("message"))
        .and_then(|v| v.get("content"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "OCR 响应中缺少 message.content 字段".to_string())?;

    // content_text 应该是一个 JSON 字符串（但有些模型会返回 ```json ... ``` 代码块）
    // 这里先剔除代码块围栏，再解析 JSON。
    let mut content_clean = content_text.trim().to_string();
    if content_clean.starts_with("```") {
        // 去掉首行 ```json / ```（以及首行之后的换行）
        if let Some(first_newline) = content_clean.find('\n') {
            content_clean = content_clean[first_newline + 1..].trim().to_string();
        }
        // 去掉末尾 ```（若存在）
        if let Some(last_fence) = content_clean.rfind("```") {
            content_clean = content_clean[..last_fence].trim().to_string();
        }
    }

    let parsed: Value = serde_json::from_str(&content_clean)
        .map_err(|e| format!("解析 OCR 内容为 JSON 失败: {e}, content: {content_text}"))?;

    let name = parsed
        .get("name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let expire = parsed
        .get("expire")
        .and_then(|v| v.as_str())
        .and_then(|raw| {
            let s = raw.trim();
            if s.is_empty() || s.eq_ignore_ascii_case("null") {
                return None;
            }

            // Helper: parse leading integer from a string segment.
            fn leading_int(seg: &str) -> Option<u32> {
                let mut started = false;
                let mut val: u32 = 0;
                for c in seg.chars() {
                    if c.is_ascii_digit() {
                        started = true;
                        val = val * 10 + (c as u32 - '0' as u32);
                    } else if started {
                        break;
                    }
                }
                if started {
                    Some(val)
                } else {
                    None
                }
            }

            // Case 1: YYYY-MM-DD
            if s.contains('-') {
                let parts: Vec<&str> = s.split('-').collect();
                if parts.len() == 3 {
                    if let (Some(y), Some(m), Some(d)) = (
                        leading_int(parts[0]),
                        leading_int(parts[1]),
                        leading_int(parts[2]),
                    ) {
                        return Some(format!("{:04}-{:02}-{:02}", y, m, d));
                    }
                }

                // Case 2: M-D / MM-DD（例如 03-09、3-9 或带“日前”等后缀）
                // 规则：
                // 1. 先假定年份为今年，得到 candidate = YYYY-MM-DD
                // 2. 如果 candidate 距离今天超过 7 天且在未来（例如今天 3 月而日期是 11 月），
                //    则视为“去年”的这个日期（二维码一般 7 天有效，不可能指向今年很久以后的日期）
                if parts.len() == 2 {
                    if let (Some(m), Some(d)) = (leading_int(parts[0]), leading_int(parts[1])) {
                        let today = Utc::now().date_naive();
                        let mut year = today.year();
                        if let Some(mut candidate) = NaiveDate::from_ymd_opt(year, m, d) {
                            // 如果解析出的日期距离今天超过 7 天且在未来，认为是去年同一天
                            if candidate > today + Duration::days(7) {
                                year -= 1;
                                if let Some(prev) = NaiveDate::from_ymd_opt(year, m, d) {
                                    candidate = prev;
                                }
                            }
                            return Some(format!(
                                "{:04}-{:02}-{:02}",
                                candidate.year(),
                                candidate.month(),
                                candidate.day()
                            ));
                        }
                    }
                }
            }

            // Case 3: M月D日 / MM月DD日（例如 3月9日、03月09日前）
            // 处理逻辑与 Case 2 相同：
            // - 先按今年拼出 YYYY-MM-DD
            // - 如果比“今天 + 7 天”还晚，则回退 1 年，认为是去年的该日期
            if s.contains('月') && s.contains('日') {
                let month_part = s.split('月').next().unwrap_or("");
                let after_month = s.split('月').nth(1).unwrap_or("");
                let day_part = after_month.split('日').next().unwrap_or("");
                if let (Some(m), Some(d)) = (leading_int(month_part), leading_int(day_part)) {
                    let today = Utc::now().date_naive();
                    let mut year = today.year();
                    if let Some(mut candidate) = NaiveDate::from_ymd_opt(year, m, d) {
                        if candidate > today + Duration::days(7) {
                            year -= 1;
                            if let Some(prev) = NaiveDate::from_ymd_opt(year, m, d) {
                                candidate = prev;
                            }
                        }
                        return Some(format!(
                            "{:04}-{:02}-{:02}",
                            candidate.year(),
                            candidate.month(),
                            candidate.day()
                        ));
                    }
                }
            }

            None
        });

    Ok(OcrResult {
        success: true,
        message: None,
        name,
        expire,
    })
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
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
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
            validate_qr,
            ocr_qr
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
