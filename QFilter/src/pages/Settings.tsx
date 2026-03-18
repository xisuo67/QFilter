import { FormEvent, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { useToasts } from "@/components/ui/toast";

interface ModelConfig {
  api_url: string;
  model_name: string;
  api_key: string;
  prompt: string;
}

const DEFAULT_PROMPT = `你是二维码页面信息结构化提取助手。

必须严格按步骤执行。

--------------------------------
第一步：提取有效期

有效期通常位于二维码下方,图片底部的灰色小字区域。

请重点检查二维码下方,图片底部的灰色小字区域的文字。

1. 读取图片全部文字（包括灰色小字）。
2. 查找包含“7天内”“七天内”“有效”“前”“截止”等关键词的句子。
3. 在该句中查找括号日期，格式可能为：
   (X月X日前)
   （X月X日前）
   (X月X日)
   （X月X日）

4. 如果存在括号日期：
   - 提取 X月X日
   - 去除“前”
   - 默认年份为今年
   - 必须转换为 YYYY-MM-DD 格式
   - 如果无法转换为 YYYY-MM-DD，则 expire = null

5. 如果没有括号日期：
   expire = null

⚠️ expire 字段最终必须是 YYYY-MM-DD 格式或 null
⚠️ 不允许输出 “3月9日前” 这种格式
⚠️ 不允许根据7天自行推算

--------------------------------
第二步：提取名称

1. 识别二维码上方最大字号标题文本。
2. 如果标题包含以下前缀，必须删除前缀后再输出：
   - 群聊:
   - 群聊：
3. 输出的 name 字段不得包含：
   - “群聊”
   - 冒号 “:” 或 “：” 开头形式
4. 只输出真实名称本身。
5. 不得包含任何前缀或说明性文字。

--------------------------------
仅返回 JSON：

{
  "name": "",
  "expire": ""
}`;

export function Settings() {
  const { t } = useTranslation();
  const { success, error } = useToasts();
  const [form, setForm] = useState<ModelConfig>({
    api_url: "",
    model_name: "",
    api_key: "",
    prompt: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const existing = (await invoke<ModelConfig | null>(
          "load_model_config",
        )) as ModelConfig | null;
        if (existing) {
          setForm(existing);
        }
      } catch (error: any) {
        console.error("load_model_config error", error);
        error(
          t("settings.loadError", "加载本地配置失败，请稍后重试。"),
        );
      }
    })();
  }, [t, success, error]);

  const handleChange = (field: keyof ModelConfig, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await invoke("save_model_config", { config: form });
      success(t("settings.saveSuccess", "保存成功"));
    } catch (error: any) {
      console.error("save_model_config error", error);
      error(t("settings.saveError", "保存失败，请稍后重试"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1">
      <div className="p-4 md:p-8 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1 w-full h-full">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {t("settings.intro")}
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-700 dark:text-neutral-200">
              {t("settings.apiUrlLabel", "模型接口地址")}
            </span>
            <input
              type="text"
              className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
              value={form.api_url}
              onChange={(e) => handleChange("api_url", e.target.value)}
              placeholder={t(
                "settings.apiUrlPlaceholder",
                "例如：https://api.openai.com/v1/chat/completions",
              )}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-700 dark:text-neutral-200">
              {t("settings.modelNameLabel", "模型名称")}
            </span>
            <input
              type="text"
              className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
              value={form.model_name}
              onChange={(e) => handleChange("model_name", e.target.value)}
              placeholder={t(
                "settings.modelNamePlaceholder",
                "例如：gpt-4.1-mini",
              )}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-700 dark:text-neutral-200">
              {t("settings.apiKeyLabel", "API Key")}
            </span>
            <input
              type="password"
              className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
              value={form.api_key}
              onChange={(e) => handleChange("api_key", e.target.value)}
              placeholder={t(
                "settings.apiKeyPlaceholder",
                "粘贴你的密钥",
              )}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-neutral-700 dark:text-neutral-200">
                {t("settings.promptLabel", "提示词设置")}
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, prompt: DEFAULT_PROMPT }))
                }
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
              >
                {t("settings.useDefaultPrompt", "使用默认提示词")}
              </button>
            </div>
            <textarea
              className="mt-1 min-h-[140px] rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
              value={form.prompt}
              onChange={(e) => handleChange("prompt", e.target.value)}
              placeholder={t(
                "settings.promptPlaceholder",
                "在这里输入用于解析二维码页面的提示词……",
              )}
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {saving
                ? t("settings.saving", "保存中…")
                : t("settings.save", "保存")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

