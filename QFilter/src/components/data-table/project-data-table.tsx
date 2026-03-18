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
  qrImage: string;
  expireAt: string;
  expired: boolean;
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
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                  )}

                  {visibleColumns.has("qrImage") && (
                    <TableCell>
                      <img
                        src={project.qrImage}
                        alt={project.name}
                        className="h-14 w-14 rounded-md border object-cover"
                      />
                    </TableCell>
                  )}

                  {visibleColumns.has("expireAt") && (
                    <TableCell>{project.expireAt}</TableCell>
                  )}

                  {visibleColumns.has("expired") && (
                    <TableCell>
                      <span
                        className={
                          project.expired
                            ? "text-red-500 font-medium"
                            : "text-emerald-500 font-medium"
                        }
                      >
                        {project.expired ? "已过期" : "未过期"}
                      </span>
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
    </div>
  );
};