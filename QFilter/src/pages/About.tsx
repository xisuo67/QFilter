import { useTranslation } from "react-i18next";
import { LayoutSwitcher } from "@/components/layout-switcher";

export function About() {
  const { t } = useTranslation();

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

        <div className="w-full flex justify-center border-t border-border/60">
          <LayoutSwitcher />
        </div>
      </div>
    </div>
  );
}
