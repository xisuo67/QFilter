import i18n from "i18next";
import { initReactI18next } from "react-i18next";

void i18n
  .use(initReactI18next)
  .init({
    lng: "zh-CN",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    resources: {
      "zh-CN": {
        translation: {
          appName: "QFilter",
          menu: {
            dashboard: "仪表盘",
            settings: "设置",
          },
          dashboard: {
            title: "仪表盘",
            intro: "在这里你可以拖动二维码到指定位置进行识别过滤",
          },
          settings: {
            title: "设置",
            intro: "在这里配置你的应用偏好设置（示例占位内容，你可以按需替换为真实表单）。",
          },
        },
      },
      en: {
        translation: {
          appName: "QFilter",
          menu: {
            dashboard: "Dashboard",
            settings: "Settings",
          },
          dashboard: {
            title: "Dashboard",
          },
          settings: {
            title: "Settings",
            intro:
              "Configure your application preferences here (placeholder content, replace with real forms as needed).",
          },
        },
      },
    },
  });

export default i18n;

