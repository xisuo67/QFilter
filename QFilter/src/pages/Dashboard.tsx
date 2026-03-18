import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QrUploadPanel } from "@/components/qr-upload-panel";
import {
  Project,
  ProjectDataTable,
} from "@/components/data-table/project-data-table";
import { Button as UploadButton } from "@/components/uoload/button";
import type { UploadedImagePayload } from "@/components/uoload/use-image-upload";
import { invoke } from "@tauri-apps/api/core";

type QrRecord = Project & {
  qrImageRemote: string;
  validQr: boolean;
  ocrStatus: "pending" | "done" | "failed";
  qrUrl?: string | null;
  qrType?: string | null;
};

const allColumns: (keyof Project)[] = [
  "name",
  "qrTypeLabel",
  "qrImage",
  "expireAt",
  "expired",
];

export function Dashboard() {
  const { t } = useTranslation();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [visibleColumns] = useState<Set<keyof Project>>(
    () => new Set(allColumns),
  );
  const [records, setRecords] = useState<QrRecord[]>([]);
  const [expiredFilter, setExpiredFilter] = useState<
    "all" | "expired" | "active" | "unknown"
  >("all");
  const [expiredSort, setExpiredSort] = useState<"none" | "asc" | "desc">("none");

  const tableHeaders: { key: keyof Project; label: string }[] = [
    { key: "name", label: t("dashboard.name", "名称") },
    { key: "qrTypeLabel", label: t("dashboard.qrType", "类型") },
    { key: "qrImage", label: t("dashboard.qrImage", "二维码") },
    { key: "expireAt", label: t("dashboard.expireAt", "有效期") },
    { key: "expired", label: t("dashboard.expired", "是否过期") },
  ];

  const filteredProjects = useMemo(() => {
    let list = records.filter((p) => p.validQr);

    if (expiredFilter !== "all") {
      list = list.filter((p) => {
        if (expiredFilter === "expired") return p.expired === true;
        if (expiredFilter === "active") return p.expired === false;
        if (expiredFilter === "unknown") return p.expired === null;
        return true;
      });
    }

    if (expiredSort !== "none") {
      const dir = expiredSort === "asc" ? 1 : -1;
      list = list.slice().sort((a, b) => {
        const rank = (v: boolean | null) =>
          v === true ? 2 : v === false ? 1 : 0;
        return (rank(a.expired) - rank(b.expired)) * dir;
      });
    }

    return list;
  }, [records, expiredFilter, expiredSort]);

  const handleExportCsv = () => {
    const rows = filteredProjects.map((p) => ({
      name: p.name,
      qrImage: p.qrImage,
      expireAt: p.expireAt,
      expired:
        p.expired === null ? "" : p.expired ? "true" : "false",
    }));

    const header = ["name", "qrImage", "expireAt", "expired"];
    const csv = [
      header.join(","),
      ...rows.map((row) =>
        header
          .map((key) => {
            const value = row[key as keyof typeof row] ?? "";
            const str = String(value).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(","),
      ),
    ].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "qfilter-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploaded = async ({ file, localUrl }: UploadedImagePayload) => {
    setShowUploadDialog(false);

    try {
      // 1. 先把本地文件读成字节数组，发给后端 Rust 用 rxing 识别二维码并校验域名
      const arrayBuffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      const qrCheck = await invoke<{
        valid: boolean;
        url: string | null;
        qr_type: string | null;
        message: string | null;
      }>("validate_qr", { image: bytes });

      if (!qrCheck.valid) {
        // 本地二维码解析失败或不在白名单域名内，只计入无效图片
        setRecords((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: qrCheck.message || "无效二维码",
            qrTypeLabel: "",
            qrImage: localUrl,
            qrImageRemote: "",
            expireAt: "",
            expired: null,
            validQr: false,
            ocrStatus: "failed",
            qrUrl: qrCheck.url,
            qrType: qrCheck.qr_type,
          } as QrRecord,
        ]);
        return;
      }

      // 2. 先把符合规范的二维码直接放入列表，标记为 pending（名称暂用 URL 或“识别中…”）
      const recordId = crypto.randomUUID();
      setRecords((prev) => [
        ...prev,
        {
          id: recordId,
          name: qrCheck.url || "识别中…",
          qrTypeLabel:
            qrCheck.qr_type === "work_weixin"
              ? "企业微信"
              : qrCheck.qr_type === "weixin"
                ? "微信群"
                : qrCheck.qr_type === "wechat"
                  ? "个人微信"
                  : qrCheck.qr_type === "dingtalk"
                    ? "钉钉"
                    : qrCheck.qr_type === "feishu"
                      ? "飞书"
                      : "未知",
          qrImage: localUrl,
          qrImageRemote: "",
          expireAt: "",
          expired: null,
          validQr: true,
          ocrStatus: "pending",
          qrUrl: qrCheck.url,
          qrType: qrCheck.qr_type,
        } as QrRecord,
      ]);

      // 3. 异步执行 OSS 上传 + OCR，完成后更新这条记录
      try {
        // TODO: 替换为你实际的 OSS 上传接口
        const ossUrl = await (async () => {
          // const formData = new FormData();
          // formData.append("file", file);
          // const res = await fetch("/api/upload", { method: "POST", body: formData });
          // const data = await res.json();
          // return data.url as string;
          return Promise.resolve(
            "https://your-oss-url.example.com/path/to/image.jpg",
          );
        })();

        // TODO: 替换为你实际的 OCR 服务
        const res = await fetch("http://localhost:8080/api/v1/ocr/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: ossUrl }),
        });

        if (!res.ok) {
          throw new Error(`识别服务错误: ${res.status}`);
        }

        const data = (await res.json()) as {
          success: boolean;
          message?: string;
          type?: string;
          name?: string;
          expire?: string;
          qrcode_url?: string;
        };

        const today = new Date();

        if (!data.success || !data.type) {
          // OCR 失败：只更新状态和远程地址，保留原占位名称
          setRecords((prev) =>
            prev.map((r) =>
              r.id === recordId
                ? {
                    ...r,
                    qrImageRemote: ossUrl,
                    ocrStatus: "failed",
                  }
                : r,
            ),
          );
          return;
        }

        let expireAt = data.expire || "";
        let expired: boolean | null = null;

        if (expireAt) {
          const d = new Date(expireAt);
          if (!Number.isNaN(d.getTime())) {
            const todayZero = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
            );
            expired = d.getTime() < todayZero.getTime();
          } else {
            expireAt = "";
            expired = null;
          }
        }

        // OCR 成功：更新这条记录的名称/有效期/过期状态/远程地址/状态
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  name: data.name || r.name,
                  qrImageRemote: ossUrl,
                  expireAt,
                  expired,
                  ocrStatus: "done",
                }
              : r,
          ),
        );
      } catch (err) {
        console.error("OCR flow error", err);
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId ? { ...r, ocrStatus: "failed" } : r,
          ),
        );
      }
    } catch (e) {
      console.error("handleUploaded error", e);
      setRecords((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: "识别失败",
          qrTypeLabel: "",
          qrImage: localUrl,
          qrImageRemote: "",
          expireAt: "",
          expired: false,
          validQr: false,
          ocrStatus: "failed",
        } as QrRecord,
      ]);
    }
  };

  const handleClear = () => {
    // 释放所有本地 blob 图片 URL，避免内存泄漏
    records.forEach((r) => {
      if (r.qrImage && r.qrImage.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(r.qrImage);
        } catch {
          // ignore
        }
      }
    });

    setRecords([]);
  };

  const totalImages = records.length;
  const totalValid = records.filter((r) => r.validQr).length;
  const totalInvalid = totalImages - totalValid;
  const totalNotExpired = records.filter(
    (r) => r.validQr && r.expired === false,
  ).length;

  const hasImages = records.length > 0;

  // Esc 关闭上传弹窗
  useEffect(() => {
    if (!showUploadDialog) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowUploadDialog(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showUploadDialog]);

  return (
    <div className="flex flex-1 min-h-0">
      <div className="p-4 md:p-8 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1 w-full h-full min-h-0 overflow-hidden">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {t("dashboard.intro")}
        </p>

        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-gray-100 dark:bg-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              总图片
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {totalImages}
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-gray-100 dark:bg-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              含二维码
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {totalValid}
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-gray-100 dark:bg-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              无效图片
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {totalInvalid}
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-gray-100 dark:bg-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              未过期
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {totalNotExpired}
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1 flex flex-col min-h-0">
          {!hasImages ? (
            <div className="flex flex-1">
              <QrUploadPanel
                onUploaded={handleUploaded}
                className="h-84 rounded-xl border-2 border-dashed border-border bg-muted/40"
                useInnerDashed={false}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                    {t("dashboard.tableTitle", "识别结果")}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t(
                      "dashboard.tableSubtitle",
                      "上传的图片会在下方以列表形式展示，便于筛选和管理。",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                  <span>{t("dashboard.expiredFilterLabel", "是否过期")}</span>
                  <select
                    className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
                    value={expiredFilter}
                    onChange={(e) =>
                        setExpiredFilter(
                          e.target.value as
                            | "all"
                            | "expired"
                            | "active"
                            | "unknown",
                        )
                    }
                  >
                    <option value="all">
                      {t("dashboard.expiredFilter.all", "全部")}
                    </option>
                    <option value="expired">
                      {t("dashboard.expiredFilter.expired", "已过期")}
                    </option>
                    <option value="active">
                      {t("dashboard.expiredFilter.active", "未过期")}
                    </option>
                    <option value="unknown">
                      {t("dashboard.expiredFilter.unknown", "未识别")}
                    </option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <UploadButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    上传
                  </UploadButton>
                  <UploadButton
                    variant="outline"
                    size="sm"
                    onClick={handleExportCsv}
                  >
                    导出 CSV
                  </UploadButton>
                  <UploadButton
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                  >
                    清空
                  </UploadButton>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                <ProjectDataTable
                  projects={filteredProjects}
                  visibleColumns={visibleColumns}
                  headers={tableHeaders}
                  expiredSort={expiredSort}
                  onToggleExpiredSort={() =>
                    setExpiredSort((prev) =>
                      prev === "none" ? "asc" : prev === "asc" ? "desc" : "none",
                    )
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showUploadDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowUploadDialog(false)}
        >
          <div
            className="w-full max-w-5xl rounded-2xl bg-white dark:bg-neutral-900 px-8 py-6 shadow-2xl border border-border/70 text-neutral-900 dark:text-neutral-50 max-h-[520px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                上传二维码图片
              </h3>
              <button
                type="button"
                className="h-7 w-7 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
                onClick={() => setShowUploadDialog(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center py-4">
              <QrUploadPanel
                onUploaded={handleUploaded}
                useInnerDashed
                className="h-80 mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

