import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QrUploadPanel } from "@/components/qr-upload-panel";
import {
  Project,
  ProjectDataTable,
} from "@/components/data-table/project-data-table";
import { Button as UploadButton } from "@/components/uoload/button";

const mockProjects: Project[] = [
  {
    id: "proj-01",
    name: "微信群 1",
    qrImage: "https://images.pexels.com/photos/1051075/pexels-photo-1051075.jpeg",
    expireAt: "2025-12-31 23:59",
    expired: false,
  },
  {
    id: "proj-02",
    name: "微信群 2",
    qrImage: "https://images.pexels.com/photos/1308746/pexels-photo-1308746.jpeg",
    expireAt: "2024-12-31 23:59",
    expired: true,
  },
];

const allColumns: (keyof Project)[] = [
  "name",
  "qrImage",
  "expireAt",
  "expired",
];

export function Dashboard() {
  const { t } = useTranslation();
  const [hasImages, setHasImages] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [visibleColumns] = useState<Set<keyof Project>>(
    () => new Set(allColumns),
  );
  const [expiredFilter, setExpiredFilter] = useState<"all" | "expired" | "active">("all");
  const [expiredSort, setExpiredSort] = useState<"none" | "asc" | "desc">("none");

  const tableHeaders: { key: keyof Project; label: string }[] = [
    { key: "name", label: t("dashboard.name", "名称") },
    { key: "qrImage", label: t("dashboard.qrImage", "二维码") },
    { key: "expireAt", label: t("dashboard.expireAt", "有效期") },
    { key: "expired", label: t("dashboard.expired", "是否过期") },
  ];

  const filteredProjects = useMemo(() => {
    let list = [...mockProjects];

    if (expiredFilter !== "all") {
      list = list.filter((p) =>
        expiredFilter === "expired" ? p.expired : !p.expired,
      );
    }

    if (expiredSort !== "none") {
      const dir = expiredSort === "asc" ? 1 : -1;
      list = list.slice().sort((a, b) => {
        return (Number(a.expired) - Number(b.expired)) * dir;
      });
    }

    return list;
  }, [expiredFilter, expiredSort]);

  const handleExportCsv = () => {
    const rows = filteredProjects.map((p) => ({
      name: p.name,
      qrImage: p.qrImage,
      expireAt: p.expireAt,
      expired: p.expired ? "true" : "false",
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

  const handleUploaded = () => {
    setHasImages(true);
    setShowUploadDialog(false);
  };

  const handleClear = () => {
    setHasImages(false);
  };

  return (
    <div className="flex flex-1">
      <div className="p-4 md:p-8 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1 w-full h-full">
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
              {hasImages ? mockProjects.length : 0}
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-gray-100 dark:bg-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              含二维码
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {hasImages ? mockProjects.length : 0}
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-gray-100 dark:bg-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              无效图片
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              0
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-gray-100 dark:bg-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              未过期
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {hasImages ? mockProjects.length : 0}
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1 flex flex-col">
          {!hasImages ? (
            <div className="flex flex-1">
              <QrUploadPanel
                onUploaded={handleUploaded}
                className="h-84 rounded-xl border-2 border-dashed border-border bg-muted/40"
                useInnerDashed={false}
              />
            </div>
          ) : (
              <div className="flex-1 flex flex-col gap-4">
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
                        e.target.value as "all" | "expired" | "active",
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

