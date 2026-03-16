import { useTranslation } from "react-i18next";

export function Settings() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1">
      <div className="p-4 md:p-8 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1 w-full h-full">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {t("settings.intro")}
        </p>
        <div className="grid gap-3">
          <div className="h-10 rounded-lg bg-gray-100 dark:bg-neutral-800" />
          <div className="h-10 rounded-lg bg-gray-100 dark:bg-neutral-800" />
          <div className="h-10 rounded-lg bg-gray-100 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

