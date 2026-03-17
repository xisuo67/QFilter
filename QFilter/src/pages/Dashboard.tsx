import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QrUploadPanel } from "@/components/qr-upload-panel";
import {
  Project,
  ProjectDataTable,
} from "@/components/project-data-table";
import { Button } from "@/components/uoload/button";

const sampleProjects: Project[] = [
  {
    id: "1",
    name: "ShadCN Clone",
    repository: "https://github.com/ruixenui/ruixen-buttons",
    team: "UI Guild",
    tech: "Next.js",
    createdAt: "2024-06-01",
    contributors: [
      {
        src: "https://avatars.githubusercontent.com/u/1?v=4",
        alt: "Contributor 1",
        fallback: "C1",
      },
      {
        src: "https://avatars.githubusercontent.com/u/2?v=4",
        alt: "Contributor 2",
        fallback: "C2",
      },
    ],
    status: {
      text: "Active",
      variant: "active",
    },
  },
  {
    id: "2",
    name: "RUIXEN Components",
    repository: "https://github.com/ruixenui/ruixen-buttons",
    team: "Component Devs",
    tech: "React",
    createdAt: "2024-05-22",
    contributors: [
      {
        src: "https://avatars.githubusercontent.com/u/3?v=4",
        alt: "Contributor 3",
        fallback: "C3",
      },
      {
        src: "https://avatars.githubusercontent.com/u/4?v=4",
        alt: "Contributor 4",
        fallback: "C4",
      },
    ],
    status: {
      text: "In Progress",
      variant: "inProgress",
    },
  },
];

export function Dashboard() {
  const { t } = useTranslation();
  const [hasImages, setHasImages] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const visibleColumns = useMemo(
    () =>
      new Set<keyof Project>([
        "name",
        "repository",
        "team",
        "tech",
        "createdAt",
        "contributors",
        "status",
      ]),
    [],
  );

  const handleUploaded = () => {
    setHasImages(true);
    if (projects.length === 0) {
      setProjects(sampleProjects);
    }
    setShowUploadDialog(false);
  };

  const handleClear = () => {
    setHasImages(false);
    setProjects([]);
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
              {hasImages ? projects.length : 0}
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-gray-100 dark:bg-neutral-800 px-4 py-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              含二维码
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {hasImages ? projects.length : 0}
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
              {hasImages ? projects.length : 0}
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    上传
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                  >
                    清空
                  </Button>
                </div>
              </div>
              <ProjectDataTable
                projects={projects}
                visibleColumns={visibleColumns}
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
            className="w-full max-w-4xl rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-border/70 text-neutral-900 dark:text-neutral-50"
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
            <QrUploadPanel onUploaded={handleUploaded} useInnerDashed />
          </div>
        </div>
      )}
    </div>
  );
}

