import { useState, useCallback, useEffect } from "react";
import type React from "react";
import { ImagePlus } from "lucide-react";
import { Input } from "@/components/uoload/input";
import {
  useImageUpload,
  type UploadedImagePayload,
} from "@/components/uoload/use-image-upload";
import { cn } from "@/lib/utils";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { readFile } from "@tauri-apps/plugin-fs";

/** 仅在 Tauri WebView 内为 true；纯浏览器打开 Vite 开发页时为 false */
function isTauriWebview(): boolean {
  if (typeof window === "undefined") return false;
  const internals = (
    window as unknown as {
      __TAURI_INTERNALS__?: { metadata?: { currentWebview?: { label?: string } } };
    }
  ).__TAURI_INTERNALS__;
  return Boolean(internals?.metadata?.currentWebview?.label);
}

interface QrUploadPanelProps {
  onUploaded?: (payload: UploadedImagePayload) => void;
  className?: string;
  /** 在弹窗中使用内部虚线边框；在页面大容器中可以关掉内部虚线，仅用外层虚线 */
  useInnerDashed?: boolean;
}

export function QrUploadPanel({
  onUploaded,
  className,
  useInnerDashed = true,
}: QrUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);

  const { fileInputRef, handleThumbnailClick, handleFileChange } =
    useImageUpload({
      onUpload: (payload) => {
        onUploaded?.(payload);
      },
    });

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      // 有些从系统拖拽进来的文件可能没有正确的 MIME type，这里同时按扩展名兜底判断
      const isImageFile =
        file &&
        (file.type.startsWith("image/") ||
          /\.(png|jpe?g|gif|bmp|webp)$/i.test(file.name));

      if (file && isImageFile) {
        const fakeEvent = {
          target: {
            files: [file],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(fakeEvent);
      }
    },
    [handleFileChange],
  );

  // 使用 Tauri WebviewWindow 的拖拽事件，支持从系统窗口直接拖拽到应用中任意位置
  useEffect(() => {
    if (!isTauriWebview()) {
      return;
    }

    let appWindow: ReturnType<typeof getCurrentWebviewWindow>;
    try {
      appWindow = getCurrentWebviewWindow();
    } catch {
      return;
    }

    const unlistenPromise = appWindow.onDragDropEvent(async (event) => {
      const payload = event.payload as {
        type: "enter" | "over" | "drop" | "leave" | "cancel";
        paths: string[];
      };

      if (payload.type === "enter" || payload.type === "over") {
        setIsDragging(true);
        return;
      }

      if (payload.type === "leave" || payload.type === "cancel") {
        setIsDragging(false);
        return;
      }

      if (payload.type === "drop") {
        setIsDragging(false);
        const paths = payload.paths || [];
        if (!Array.isArray(paths) || paths.length === 0) return;

        const imageFiles: File[] = [];

        for (const path of paths) {
          if (!/\.(png|jpe?g|gif|bmp|webp)$/i.test(path)) continue;

          try {
            const bytes = await readFile(path);
            const blob = new Blob([bytes], { type: "image/*" });
            const name = path.split(/[/\\]/).pop() || "image.png";
            const file = new File([blob], name, { type: "image/*" });
            imageFiles.push(file);
          } catch (e) {
            console.error("读取拖拽文件失败", e);
          }
        }

        if (imageFiles.length === 0) return;

        const fakeEvent = {
          target: {
            files: imageFiles,
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(fakeEvent);
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [handleFileChange]);

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center text-center text-foreground",
        className,
      )}
    >
      <Input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
      />

      <div
        onClick={handleThumbnailClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg bg-card shadow-sm transition-colors hover:bg-card/90",
          useInnerDashed && "border-2 border-dashed border-primary/70",
          isDragging && "bg-primary/5",
        )}
      >
        <div className="rounded-full bg-primary/10 p-3 shadow-sm">
          <ImagePlus className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">点击或拖拽图片到此处</p>
          <p className="mt-1 text-xs text-muted-foreground">
            支持 JPG、PNG、GIF 格式，可批量上传
          </p>
        </div>
      </div>
    </div>
  );
}

