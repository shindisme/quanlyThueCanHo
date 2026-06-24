import { cn } from "../../lib/utils";
import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // MB
  previews?: string[];
  onRemovePreview?: (index: number) => void;
  className?: string;
}

export default function FileUpload({
  onFilesSelected,
  accept = "image/*",
  multiple = true,
  maxSize = 10,
  previews = [],
  onRemovePreview,
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);

    // Kiem tra kich thuoc file
    const validFiles = files.filter((f) => f.size <= maxSize * 1024 * 1024);
    if (validFiles.length < files.length) {
      alert(`Mot so file vuot qua ${maxSize}MB va da bi bo qua.`);
    }

    onFilesSelected(validFiles);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <Upload size={32} className="mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-600 mb-1">
          Keo tha file vao day hoac{" "}
          <span className="text-primary-600 font-medium">chon file</span>
        </p>
        <p className="text-xs text-gray-400">
          {accept === "image/*" ? "PNG, JPG, GIF" : accept} - Toi da {maxSize}MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {previews.map((url, index) => (
            <div key={index} className="relative group w-20 h-20">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              {onRemovePreview && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemovePreview(index); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
