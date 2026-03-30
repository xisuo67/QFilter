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

interface OfflineOcrModel {
  id: string;
  name: string;
  description: string;
  size_mb: number;
  download_url: string;
  archive_path: string;
  downloaded: boolean;
}

interface OfflineOcrSettings {
  enabled: boolean;
  selected_model_id: string | null;
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
   - 必须转换为 MM-DD 格式
   - 如果无法转换为 MM-DD，则 expire = null

5. 如果没有括号日期：
   expire = null

⚠️ expire 字段最终必须是 MM-DD 格式或 null
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
  const { success, error: toastError } = useToasts();
  const [activeMenu, setActiveMenu] = useState<"online" | "offline">("online");
  const [form, setForm] = useState<ModelConfig>({
    api_url: "",
    model_name: "",
    api_key: "",
    prompt: "",
  });
  const [saving, setSaving] = useState(false);
  const [offlineModels, setOfflineModels] = useState<OfflineOcrModel[]>([]);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [selectedOfflineModelId, setSelectedOfflineModelId] = useState<
    string | null
  >(null);
  const [offlineLoading, setOfflineLoading] = useState(true);
  const [offlineSaving, setOfflineSaving] = useState(false);
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void (async () => {
      try {
        const existing = (await invoke<ModelConfig | null>(
          "load_model_config",
        )) as ModelConfig | null;
        if (existing) {
          setForm(existing);
        }
      } catch (err: any) {
        console.error("load_model_config error", err);
        toastError(
          t("settings.loadError", "加载本地配置失败，请稍后重试。"),
        );
      }
    })();
  }, [t, toastError]);

  useEffect(() => {
    void (async () => {
      setOfflineLoading(true);
      try {
        const [models, settings] = await Promise.all([
          invoke<OfflineOcrModel[]>("list_offline_ocr_models"),
          invoke<OfflineOcrSettings>("load_offline_ocr_settings"),
        ]);
        setOfflineModels(models);
        setOfflineEnabled(settings.enabled);
        setSelectedOfflineModelId(settings.selected_model_id ?? null);
      } catch (err) {
        console.error("load offline ocr settings error", err);
        toastError(
          t("settings.offline.loadError", "加载离线 OCR 设置失败，请稍后重试。"),
        );
      } finally {
        setOfflineLoading(false);
      }
    })();
  }, [t, toastError]);

  const handleChange = (field: keyof ModelConfig, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await invoke("save_model_config", { config: form });
      success(t("settings.saveSuccess", "保存成功"));
    } catch (err: any) {
      console.error("save_model_config error", err);
      toastError(t("settings.saveError", "保存失败，请稍后重试"));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadModel = async (modelId: string) => {
    setDownloadingModelId(modelId);
    try {
      await invoke("download_offline_ocr_model", { modelId });
      const refreshed = await invoke<OfflineOcrModel[]>("list_offline_ocr_models");
      setOfflineModels(refreshed);
      success(t("settings.offline.downloadSuccess", "模型下载完成"));
    } catch (err) {
      console.error("download_offline_ocr_model error", err);
      toastError(
        t("settings.offline.downloadError", "模型下载失败，请稍后重试。"),
      );
    } finally {
      setDownloadingModelId(null);
    }
  };

  const handleSaveOfflineSettings = async () => {
    setOfflineSaving(true);
    try {
      await invoke("save_offline_ocr_settings", {
        enabled: offlineEnabled,
        selectedModelId: selectedOfflineModelId,
      });
      success(
        t("settings.offline.saveSuccess", "离线 OCR 设置已保存"),
      );
    } catch (err) {
      console.error("save_offline_ocr_settings error", err);
      toastError(
        t("settings.offline.saveError", "保存离线 OCR 设置失败，请稍后重试。"),
      );
    } finally {
      setOfflineSaving(false);
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMenu("online")}
            className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm ${
              activeMenu === "online"
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {t("settings.menu.online", "在线模型")}
          </button>
          <button
            type="button"
            onClick={() => setActiveMenu("offline")}
            className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm ${
              activeMenu === "offline"
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {t("settings.menu.offline", "离线 OCR")}
          </button>
        </div>

        {activeMenu === "online" ? (
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
        ) : (
          <div className="grid gap-4 max-w-3xl">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-200">
              {t(
                "settings.offline.hint",
                "下载模型后可启用离线 OCR。当前仅下载模型文件，后续可接入本地推理引擎。",
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-100">
              <input
                type="checkbox"
                checked={offlineEnabled}
                onChange={(e) => setOfflineEnabled(e.target.checked)}
              />
              {t("settings.offline.enable", "启用离线 OCR")}
            </label>

            {offlineLoading ? (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {t("settings.offline.loading", "正在加载模型列表…")}
              </div>
            ) : (
              <div className="grid gap-3">
                {offlineModels.map((model) => (
                  <div
                    key={model.id}
                    className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          {model.name}
                        </h3>
                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                          {model.description}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {t("settings.offline.size", "体积")} ~{model.size_mb}MB
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 break-all">
                          {model.archive_path}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={downloadingModelId === model.id}
                        onClick={() => void handleDownloadModel(model.id)}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-xs text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-700"
                      >
                        {downloadingModelId === model.id
                          ? t("settings.offline.downloading", "下载中…")
                          : model.downloaded
                            ? t("settings.offline.redownload", "重新下载")
                            : t("settings.offline.download", "下载")}
                      </button>
                    </div>

                    <label className="mt-3 inline-flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-200">
                      <input
                        type="radio"
                        name="offline-model"
                        disabled={!model.downloaded}
                        checked={selectedOfflineModelId === model.id}
                        onChange={() => setSelectedOfflineModelId(model.id)}
                      />
                      {model.downloaded
                        ? t("settings.offline.useModel", "使用该模型")
                        : t("settings.offline.downloadFirst", "请先下载后再选择")}
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={offlineSaving}
                onClick={() => void handleSaveOfflineSettings()}
                className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {offlineSaving
                  ? t("settings.saving", "保存中…")
                  : t("settings.save", "保存")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

