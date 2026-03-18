import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/data-table/table";

export interface Project {
  id: string;
  name: string;
  qrTypeLabel: string;
  qrImage: string;
  qrImageRemote?: string;
  expireAt: string;
  expired: boolean | null;
}

interface ProjectDataTableProps {
  projects: Project[];
  visibleColumns: Set<keyof Project>;
  headers: { key: keyof Project; label: string }[];
  expiredSort: "none" | "asc" | "desc";
  onToggleExpiredSort: () => void;
  toolbar?: React.ReactNode;
}

export const ProjectDataTable = ({
  projects,
  visibleColumns,
  headers,
  expiredSort,
  onToggleExpiredSort,
  toolbar,
}: ProjectDataTableProps) => {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  // Animation variants for table rows
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeInOut",
      },
    }),
  };

  // Esc 关闭二维码预览弹窗
  useEffect(() => {
    if (!previewSrc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewSrc(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewSrc]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {toolbar && (
        <div className="flex items-center justify-end px-4 pt-3 pb-1">
          {toolbar}
        </div>
      )}
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers
                .filter((header) => visibleColumns.has(header.key))
                .map((header) => {
                  if (header.key !== "expired") {
                    return (
                      <TableHead key={header.key}>{header.label}</TableHead>
                    );
                  }

                  return (
                    <TableHead
                      key={header.key}
                      className="cursor-pointer select-none"
                      onClick={onToggleExpiredSort}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.label}
                        <span className="text-[10px] text-muted-foreground">
                          {expiredSort === "none"
                            ? "↕"
                            : expiredSort === "asc"
                              ? "↑"
                              : "↓"}
                        </span>
                      </span>
                    </TableHead>
                  );
                })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <motion.tr
                  key={project.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={rowVariants}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {visibleColumns.has("name") && (
                    <TableCell className="font-medium max-w-xs truncate">
                      {project.name}
                    </TableCell>
                  )}

                  {visibleColumns.has("qrTypeLabel") && (
                    <TableCell>{project.qrTypeLabel}</TableCell>
                  )}

                  {visibleColumns.has("qrImage") && (
                    <TableCell>
                      <button
                        type="button"
                        className="text-xs text-primary underline underline-offset-4 hover:text-primary/80"
                        onClick={() => {
                          const src = project.qrImage || project.qrImageRemote;
                          if (!src) return;
                          setPreviewSrc(src);
                        }}
                      >
                        查看二维码
                      </button>
                    </TableCell>
                  )}

                  {visibleColumns.has("expireAt") && (
                    <TableCell>{project.expireAt}</TableCell>
                  )}

                  {visibleColumns.has("expired") && (
                    <TableCell>
                      {project.expired === null ? (
                        <span className="text-neutral-400 dark:text-neutral-500">
                          -
                        </span>
                      ) : (
                        <span
                          className={
                            project.expired
                              ? "text-red-500 font-medium"
                              : "text-emerald-500 font-medium"
                          }
                        >
                          {project.expired ? "已过期" : "未过期"}
                        </span>
                      )}
                    </TableCell>
                  )}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.size} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {previewSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewSrc(null)}
        >
          <div
            className="max-w-lg w-full mx-4 rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-2xl border border-border/70 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                二维码预览
              </span>
              <button
                type="button"
                className="h-7 w-7 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
                onClick={() => setPreviewSrc(null)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="flex items-center justify-center">
              <img
                src={previewSrc}
                alt="二维码预览"
                className="max-h-[360px] rounded-lg border object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};