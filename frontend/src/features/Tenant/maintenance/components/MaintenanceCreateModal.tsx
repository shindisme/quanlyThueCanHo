import type { FormEvent } from "react";
import { Camera, Image as ImageIcon, Upload, X } from "lucide-react";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";
import { PRIORITY_OPTIONS, type Priority } from "../../../../constants";

interface MaintenanceCreateModalProps {
  isOpen: boolean;
  saving: boolean;
  title: string;
  description: string;
  priority: Priority;
  imageFile: File | null;
  imagePreviewUrl: string;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: Priority) => void;
  onImageChange: (file: File | null) => void;
  onSubmit: (event: FormEvent) => void;
}

export default function MaintenanceCreateModal(props: MaintenanceCreateModalProps) {
  const chooseImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onImageChange(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Gửi yêu cầu sửa chữa mới">
      <form onSubmit={props.onSubmit} className="space-y-4 text-left">
        <Input
          label="Tiêu đề yêu cầu *"
          value={props.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          required
          disabled={props.saving}
        />
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600">Mô tả chi tiết sự cố *</label>
          <textarea
            className="min-h-25 w-full rounded-lg border border-gray-300 p-3 text-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={props.description}
            onChange={(event) => props.onDescriptionChange(event.target.value)}
            required
            disabled={props.saving}
          />
        </div>
        <Combobox
          label="Độ ưu tiên *"
          options={PRIORITY_OPTIONS}
          value={props.priority}
          onChange={(value) => props.onPriorityChange(value as Priority)}
          searchable={false}
          clearable={false}
          disabled={props.saving}
        />
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">Ảnh chỗ hư hại</label>
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-3">
            {props.imagePreviewUrl ? (
              <img src={props.imagePreviewUrl} alt="Ảnh chỗ hư hại" className="h-44 w-full rounded-lg border border-gray-200 bg-white object-contain" />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
                <ImageIcon size={28} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                <Upload size={15} /> Tải ảnh
                <input type="file" accept="image/*" className="hidden" disabled={props.saving} onChange={chooseImage} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                <Camera size={15} /> Chụp ảnh
                <input type="file" accept="image/*" capture="environment" className="hidden" disabled={props.saving} onChange={chooseImage} />
              </label>
              {props.imageFile && (
                <button type="button" onClick={() => props.onImageChange(null)} disabled={props.saving} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                  <X size={15} /> Xóa ảnh
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <Button variant="outline" type="button" onClick={props.onClose} disabled={props.saving}>Hủy bỏ</Button>
          <Button type="submit" isLoading={props.saving}>Gửi yêu cầu</Button>
        </div>
      </form>
    </Modal>
  );
}
