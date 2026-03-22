import { useTranslation } from "react-i18next";

export function About() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1">
      <div className="p-4 md:p-8 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1 w-full h-full">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {t("about.title")}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-2xl">
          {t("about.intro")}
        </p>
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
          <p>{t("about.versionLabel")}</p>
          <p>{t("about.credits")}</p>
        </div>
      </div>
    </div>
  );
}
