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
            title: "作者：xisuo67",
            intro:
              "做这个软件的初衷是因为网上充斥着大量过期无效二维码，而我需要一个工具来快速筛选群二维码，但是市面上的工具要么太复杂，要么不免费，所以我就自己写了一个。QFilter它的前身事实上是一个golang做的api服务，它可以检测二维码是否过期，考虑到桌面应用的便捷性，现在我用Tauri把它做成了一个桌面应用，方便大家使用。如果你觉得项目还不错，对你有所帮助，可以通过以下方式支持我",
            checkUpdates: "检查更新",
            checkingUpdates: "正在检查更新…",
            upToDate: "当前已是最新版本",
            updating: "正在下载并安装更新…",
            updateFailed: "更新失败，请稍后重试。",
            listView: "列表",
            cardView: "卡片",
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
            title: "Author: xisuo67",
            intro:
              "I made this app because the web is full of expired or invalid QR codes, and I needed a way to quickly filter group QR codes—existing tools were either too complicated or not free, so I built my own. QFilter began as a Go API service that could tell whether a QR code had expired; for the convenience of a desktop experience, I’ve rebuilt it with Tauri as a desktop app for everyone to use.",
            checkUpdates: "Check for updates",
            checkingUpdates: "Checking for updates…",
            upToDate: "You are already on the latest version",
            updating: "Downloading and installing update…",
            updateFailed: "Update failed, please try again later.",
            listView: "List view",
            cardView: "Card view",
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

