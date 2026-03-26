import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useTranslation } from "react-i18next";
import { LayoutSwitcher } from "@/components/layout-switcher";
import { useToasts } from "@/components/ui/toast";

export function About() {
  const { t } = useTranslation();
  const { success, error } = useToasts();
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="p-4 md:p-8 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-6 flex-1 w-full min-h-0 overflow-y-auto">
        <div className="space-y-3 shrink-0">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            {t("about.title")}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {t("about.intro")}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              try {
                const update = await check();
                if (!update) {
                  success(t("about.upToDate"));
                  return;
                }

                await update.downloadAndInstall();
                success(t("about.updating"));
                await relaunch();
              } catch (e) {
                console.error(e);
                error(t("about.updateFailed"));
              } finally {
                setBusy(false);
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {busy ? t("about.checkingUpdates") : t("about.checkUpdates")}
          </button>
        </div>

        <div className="w-full flex justify-center border-t border-border/60 pt-6">
          <LayoutSwitcher />
        </div>
      </div>
    </div>
  );
}
