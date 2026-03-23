import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Settings as SettingsIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { Settings } from "@/pages/Settings";
import { About } from "@/pages/About";

type TabId = "dashboard" | "settings" | "about";
type Theme = "light" | "dark";

function App() {
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("qfilter-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = prefersDark ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("qfilter-theme", next);
      return next;
    });
  };

  const links = [
    {
      label: t("menu.dashboard"),
      id: "dashboard" as const,
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: t("menu.settings"),
      id: "settings" as const,
      icon: (
        <SettingsIcon className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
      <div className="flex h-full max-w-7xl mx-auto">
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          activeId={activeTab}
          setActiveId={(id) => setActiveTab(id as TabId)}
        >
          <SidebarBody className="justify-between gap-8">
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <div className="flex items-center gap-2 px-1 py-1">
                <span className="text-sm font-semibold">{t("appName")}</span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-100"
                    onClick={() => void i18n.changeLanguage("zh-CN")}
                  >
                    中
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-100"
                    onClick={() => void i18n.changeLanguage("en")}
                  >
                    EN
                  </button>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-1">
                {links.map((link) => (
                  <SidebarLink key={link.id} item={link} />
                ))}
              </div>
            </div>
            <div className="mt-auto shrink-0 border-t border-neutral-200/80 pt-3 dark:border-neutral-600/80">
              <SidebarLink
                item={{
                  id: "about",
                  label: t("menu.about"),
                  noActiveStyle: true,
                  centerWhenCollapsed: true,
                  icon: (
                    <span
                      className="inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-300 dark:ring-neutral-600"
                      aria-hidden
                    >
                      <img
                        src="https://cdnqiniu.xisuo67.website/1771816659132"
                        alt=""
                        className="block h-full w-full object-cover"
                        width={28}
                        height={28}
                        decoding="async"
                      />
                    </span>
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
        <main className="flex-1 flex">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "settings" && <Settings />}
          {activeTab === "about" && <About />}
        </main>
      </div>
    </div>
  );
}

export default App;
