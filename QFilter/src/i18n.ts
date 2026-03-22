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
            dashboard: "快筛",
            settings: "设置",
            about: "关于作者",
          },
          about: {
            title: "关于 QFilter",
            intro:
              "群聊二维码快速筛选工具：校验二维码、上传云端、识别有效期并管理结果。本页为关于与说明，可在文案中补充项目介绍、使用条款或联系方式。",
            versionLabel: "版本信息见应用发布说明。",
            credits: "感谢使用。",
          },
          dashboard: {
            title: "快筛",
            intro: "群二维码快速筛选器",
            name: "名称",
            qrType: "类型",
            qrImage: "二维码",
            expireAt: "有效期",
            expired: "是否过期",
          },
          settings: {
            title: "设置",
            intro:
              "在这里配置你的应用偏好设置（示例占位内容，你可以按需替换为真实表单）。",
          },
        },
      },
      en: {
        translation: {
          appName: "QFilter",
          menu: {
            dashboard: "Dashboard",
            settings: "Settings",
            about: "About Author",
          },
          about: {
            title: "About QFilter",
            intro:
              "A quick filter for group QR codes: validate, upload, OCR expiry, and manage results. Use this page for app info, terms, or contact details.",
            versionLabel: "See release notes for version details.",
            credits: "Thanks for using QFilter.",
          },
          dashboard: {
            title: "Dashboard",
            intro: "Group QR code quick filter",
            name: "Name",
            qrType: "Type",
            qrImage: "QR Code",
            expireAt: "Expiration",
            expired: "Expired",
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

