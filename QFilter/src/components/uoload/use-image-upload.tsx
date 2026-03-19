import { useCallback, useRef, useState } from "react";

export interface UploadedImagePayload {
  file: File;
  localUrl: string;
}

interface UseImageUploadProps {
  onUpload?: (payload: UploadedImagePayload) => void;
}

export function useImageUpload({ onUpload }: UseImageUploadProps = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length === 0) {
        return;
      }

      files.forEach((file, index) => {
        const url = URL.createObjectURL(file);

        // 只用第一张图更新预览和文件名，其余只触发上传逻辑即可
        if (index === 0) {
          setFileName(file.name);
          setPreviewUrl(url);
        }

        onUpload?.({ file, localUrl: url });
      });
    },
    [onUpload],
  );

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  };
}