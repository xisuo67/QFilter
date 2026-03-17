import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QrUploadPanel } from "@/components/qr-upload-panel";
import {
  Project,
  ProjectDataTable,
} from "@/components/data-table/project-data-table";
import { Input as DataTableInput } from "@/components/data-table/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/data-table/drop";
import { Button as UploadButton } from "@/components/uoload/button";
import { Button as DataTableButton } from "@/components/data-table/button";
import { ListFilter, Columns } from "lucide-react";

const mockProjects: Project[] = [
  {
    id: "proj-01",
    name: "ShadCN Clone",
    repository: "https://github.com/ruixenui/ruixen-buttons",
    team: "UI Guild",
    tech: "Next.js",
    createdAt: "2024-06-01",
    contributors: [
      {
        src: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        alt: "User 1",
        fallback: "U1",
      },
      {
        src: "https://i.pravatar.cc/150?u=a042581f4e29026705d",
        alt: "User 2",
        fallback: "U2",
      },
    ],
    status: { text: "Active", variant: "active" },
  },
  {
    id: "proj-02",
    name: "RUIXEN Components",
    repository: "https://github.com/ruixenui/ruixen-buttons",
    team: "Component Devs",
    tech: "React",
    createdAt: "2024-05-22",
    contributors: [
      {
        src: "https://i.pravatar.cc/150?u=a042581f4e29026706d",
        alt: "User 3",
        fallback: "U3",
      },
      {
        src: "https://i.pravatar.cc/150?u=a042581f4e29026707d",
        alt: "User 4",
        fallback: "U4",
      },
      {
        src: "https://i.pravatar.cc/150?u=a042581f4e29026708d",
        alt: "User 5",
        fallback: "U5",
      },
    ],
    status: { text: "Progress", variant: "inProgress" },
  },
];

const allColumns: (keyof Project)[] = [
  "name",
  "repository",
  "team",
  "tech",
  "createdAt",
  "contributors",
  "status",
];

export function Dashboard() {
  const { t } = useTranslation();
  const [hasImages, setHasImages] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [techFilter, setTechFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Project>>(
    () => new Set(allColumns),
  );

  const filteredProjects = useMemo(() => {
    return mockProjects.filter((project) => {
      const techMatch =
        techFilter === "" ||
        project.tech.toLowerCase().includes(techFilter.toLowerCase());
      const statusMatch =
        statusFilter === "all" || project.status.variant === statusFilter;
      return techMatch && statusMatch;
    });
  }, [techFilter, statusFilter]);

  const toggleColumn = (column: keyof Project) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
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
                <div className="flex gap-2">
                  <UploadButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    上传
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

              <div className="mt-4 flex flex-col gap-4 mb-2 sm:flex-row sm:items-center">
                <div className="flex flex-1 gap-4">
                  <DataTableInput
                    placeholder="Filter by technology..."
                    value={techFilter}
                    onChange={(e) => setTechFilter(e.target.value)}
                    className="max-w-xs"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <DataTableButton
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ListFilter className="h-4 w-4" />
                        <span>Status</span>
                      </DataTableButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={statusFilter === "all"}
                        onCheckedChange={() => setStatusFilter("all")}
                      >
                        All
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={statusFilter === "active"}
                        onCheckedChange={() => setStatusFilter("active")}
                      >
                        Active
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={statusFilter === "inProgress"}
                        onCheckedChange={() => setStatusFilter("inProgress")}
                      >
                        In Progress
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={statusFilter === "onHold"}
                        onCheckedChange={() => setStatusFilter("onHold")}
                      >
                        On Hold
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DataTableButton
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Columns className="h-4 w-4" />
                      <span>Columns</span>
                    </DataTableButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allColumns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column}
                        className="capitalize"
                        checked={visibleColumns.has(column)}
                        onCheckedChange={() => toggleColumn(column)}
                      >
                        {column}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <ProjectDataTable
                projects={filteredProjects}
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

