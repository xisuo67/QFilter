import { useState, useCallback } from "react";
import type React from "react";
import { ImagePlus } from "lucide-react";
import { Input } from "@/components/uoload/input";
import { useImageUpload } from "@/components/uoload/use-image-upload";
import { cn } from "@/lib/utils";

interface QrUploadPanelProps {
  onUploaded: () => void;
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
      onUpload: () => {
        onUploaded();
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
      if (file && file.type.startsWith("image/")) {
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

