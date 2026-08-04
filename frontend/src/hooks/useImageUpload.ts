import { useState, useEffect, useCallback, useRef } from "react";
import { isValidImageFile } from "../utils/file";
import { toast } from "sonner";

interface UseImageUploadReturn {
  file: File | null;
  previewUrl: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
  resetImage: (initialUrl?: string) => void;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string>>;
}

// Custom hook quản lý chọn ảnh preview và tự động thu hồi ObjectURL tránh rò rỉ bộ nhớ 
export function useImageUpload(initialUrl = ""): UseImageUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const createdObjectUrlRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const revokeObjectUrl = useCallback(() => {
    if (createdObjectUrlRef.current) {
      URL.revokeObjectURL(createdObjectUrlRef.current);
      createdObjectUrlRef.current = null;
    }
  }, []);

  // Tự động thu hồi ObjectURL khi unmount
  useEffect(() => {
    return () => {
      revokeObjectUrl();
    };
  }, [revokeObjectUrl]);

  // Đồng bộ lại previewUrl nếu initialUrl thay đổi và người dùng chưa chọn file mới
  useEffect(() => {
    if (!file) {
      setPreviewUrl(initialUrl);
    }
  }, [initialUrl, file]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const check = isValidImageFile(selectedFile);
      if (!check.valid) {
        toast.error(check.error || "Vui lòng chọn tệp ảnh hợp lệ");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      revokeObjectUrl();

      const objectUrl = URL.createObjectURL(selectedFile);
      createdObjectUrlRef.current = objectUrl;
      setFile(selectedFile);
      setPreviewUrl(objectUrl);
    },
    [revokeObjectUrl]
  );

  const handleRemoveImage = useCallback(() => {
    revokeObjectUrl();
    setFile(null);
    setPreviewUrl("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [revokeObjectUrl]);

  const resetImage = useCallback(
    (url = "") => {
      revokeObjectUrl();
      setFile(null);
      setPreviewUrl(url);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [revokeObjectUrl]
  );

  return {
    file,
    previewUrl,
    inputRef,
    handleImageUpload,
    handleRemoveImage,
    resetImage,
    setPreviewUrl,
  };
}
