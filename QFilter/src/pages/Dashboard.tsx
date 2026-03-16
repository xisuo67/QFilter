import { useTranslation } from "react-i18next";

export function Dashboard() {
  const { t } = useTranslation();

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
          {[...new Array(4)].map((_, i) => (
            <div
              key={`card-${i}`}
              className="h-20 w-full rounded-lg bg-gray-100 dark:bg-neutral-800"
            />
          ))}
        </div>
        <div className="flex gap-3 flex-1">
          {[...new Array(2)].map((_, i) => (
            <div
              key={`chart-${i}`}
              className="h-full w-full rounded-lg bg-gray-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

