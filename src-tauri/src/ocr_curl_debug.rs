//! OCR 请求失败时生成可在 Bash 下复现的 curl 片段（便于对接本地 Ollama `/v1/chat/completions` 等）。

/// Bash 单引号包裹（内部 `'` 写成 `'\''`），用于 `curl -d '...'`。
pub fn bash_single_quoted(s: &str) -> String {
    let mut out = String::from("'");
    for c in s.chars() {
        if c == '\'' {
            out.push_str("'\\''");
        } else {
            out.push(c);
        }
    }
    out.push('\'');
    out
}

pub fn ocr_error_curl_hint(api_url: &str, auth_header_value: &str, json_body: &str) -> String {
    format!(
        "curl -sS -X POST {} \\\n  -H {} \\\n  -H {} \\\n  -d {}",
        bash_single_quoted(api_url),
        bash_single_quoted(&format!("Authorization: {auth_header_value}")),
        bash_single_quoted("Content-Type: application/json"),
        bash_single_quoted(json_body),
    )
}
