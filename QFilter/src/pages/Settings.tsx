import { FormEvent, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

interface ModelConfig {
  api_url: string;
  model_name: string;
  api_key: string;
}

export function Settings() {
  const { t } = useTranslation();
  const [form, setForm] = useState<ModelConfig>({
    api_url: "",
    model_name: "",
    api_key: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const existing = (await invoke<ModelConfig | null>(
          "load_model_config",
        )) as ModelConfig | null;
        if (existing) {
          setForm(existing);
        }
      } catch (error) {
        console.error("load_model_config error", error);
      }
    })();
  }, []);

  const handleChange = (
    field: keyof ModelConfig,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await invoke("save_model_config", { config: form });
      setMessage(t("settings.saveSuccess", "已保存到本地"));
    } catch (error) {
      console.error("save_model_config error", error);
      setMessage(t("settings.saveError", "保存失败，请稍后重试"));
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
            {message && (
              <span className="text-xs text-neutral-600 dark:text-neutral-300">
                {message}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

