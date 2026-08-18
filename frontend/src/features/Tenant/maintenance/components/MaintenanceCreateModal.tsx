import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Camera,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";

interface MaintenanceCreateModalProps {
  isOpen: boolean;
  saving: boolean;
  title: string;
  description: string;
  imageFile: File | null;
  imagePreviewUrl: string;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageChange: (file: File | null) => void;
  onSubmit: (event: FormEvent) => void;
}

export default function MaintenanceCreateModal(
  props: MaintenanceCreateModalProps
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    props.onImageChange(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  /**
   * Dừng hoàn toàn webcam.
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  };

  /**
   * Mở webcam của máy tính.
   */
  const openCamera = async () => {
    try {
      setCameraError("");
      setCameraLoading(true);
      setCameraOpen(true);

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error("CAMERA_NOT_SUPPORTED");
      }

      // Nếu camera cũ đang chạy thì tắt trước.
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;
      setCameraReady(true);
    } catch (error) {
      console.error("Không thể mở camera:", error);
      setCameraReady(false);

      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            setCameraError(
              "Bạn chưa cho phép website sử dụng camera. Hãy cấp quyền Camera cho trình duyệt rồi thử lại."
            );
            break;

          case "NotFoundError":
          case "DevicesNotFoundError":
            setCameraError(
              "Không tìm thấy camera trên thiết bị."
            );
            break;

          case "NotReadableError":
          case "TrackStartError":
            setCameraError(
              "Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đang dùng camera rồi thử lại."
            );
            break;

          default:
            setCameraError(
              "Không thể mở camera. Vui lòng kiểm tra quyền truy cập camera của trình duyệt."
            );
            break;
        }
      } else {
        setCameraError(
          "Trình duyệt không hỗ trợ truy cập camera hoặc camera hiện không khả dụng."
        );
      }
    } finally {
      setCameraLoading(false);
    }
  };

  /**
   * Đóng cửa sổ camera.
   */
  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCameraLoading(false);
    setCameraError("");
  };

  /**
   * Đóng modal tạo yêu cầu sửa chữa.
   */
  const handleClose = () => {
    closeCamera();
    props.onClose();
  };

  /**
   * Chụp frame hiện tại của webcam và chuyển thành File.
   */
  const capturePhoto = () => {
    const video = videoRef.current;

    if (!video) {
      setCameraError("Camera chưa sẵn sàng.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError(
        "Camera chưa tải xong hình ảnh. Vui lòng thử lại sau vài giây."
      );
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Không thể xử lý ảnh từ camera.");
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Không thể tạo ảnh từ camera.");
          return;
        }

        const file = new File(
          [blob],
          `maintenance-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        // Dùng lại logic xử lý ảnh hiện tại.
        props.onImageChange(file);

        // Sau khi chụp thành công thì tắt camera.
        closeCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  /**
   * Khi camera modal đã render và stream đã có,
   * gán stream vào thẻ video.
   */
  useEffect(() => {
    if (
      cameraOpen &&
      !cameraLoading &&
      streamRef.current &&
      videoRef.current
    ) {
      const video = videoRef.current;

      video.srcObject = streamRef.current;

      video.play().catch((error) => {
        console.error("Không thể phát camera:", error);

        setCameraError(
          "Không thể hiển thị hình ảnh từ camera."
        );
      });
    }
  }, [cameraOpen, cameraLoading]);

  /**
   * Nếu modal chính bị đóng từ bên ngoài,
   * đảm bảo webcam cũng được tắt.
   */
  useEffect(() => {
    if (!props.isOpen) {
      stopCamera();
      setCameraOpen(false);
      setCameraLoading(false);
      setCameraError("");
    }
  }, [props.isOpen]);

  /**
   * Tắt webcam khi component bị unmount.
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      <Modal
        isOpen={props.isOpen}
        onClose={handleClose}
        title="Gửi yêu cầu sửa chữa mới"
      >
        <form
          onSubmit={props.onSubmit}
          className="space-y-4 text-left"
        >
          <Input
            label="Tiêu đề yêu cầu *"
            value={props.title}
            onChange={(event) =>
              props.onTitleChange(event.target.value)
            }
            required
            disabled={props.saving}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">
              Mô tả chi tiết sự cố *
            </label>

            <textarea
              className="min-h-25 w-full rounded-lg border border-gray-300 p-3 text-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={props.description}
              onChange={(event) =>
                props.onDescriptionChange(event.target.value)
              }
              required
              disabled={props.saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">
              Ảnh chỗ hư hại
            </label>

            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-3">
              {props.imagePreviewUrl ? (
                <img
                  src={props.imagePreviewUrl}
                  alt="Ảnh chỗ hư hại"
                  className="h-44 w-full rounded-lg border border-gray-200 bg-white object-contain"
                />
              ) : (
                <div className="flex h-28 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
                  <ImageIcon size={28} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {/* Tải ảnh từ máy */}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  <Upload size={15} />
                  Tải ảnh

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={props.saving}
                    onChange={chooseImage}
                  />
                </label>

                {/* Mở webcam thật */}
                <button
                  type="button"
                  onClick={openCamera}
                  disabled={props.saving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Camera size={15} />
                  Chụp ảnh
                </button>

                {/* Xóa ảnh đã chọn/chụp */}
                {props.imageFile && (
                  <button
                    type="button"
                    onClick={() =>
                      props.onImageChange(null)
                    }
                    disabled={props.saving}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <X size={15} />
                    Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={props.saving}
            >
              Hủy bỏ
            </Button>

            <Button
              type="submit"
              isLoading={props.saving}
            >
              Gửi yêu cầu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal webcam */}
      <Modal
        isOpen={cameraOpen}
        onClose={closeCamera}
        title="Chụp ảnh"
      >
        <div className="space-y-4">
          <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-lg bg-black">
            {cameraLoading ? (
              <div className="p-6 text-center text-sm text-white">
                Đang mở camera...
              </div>
            ) : cameraError ? (
              <div className="p-6 text-center text-sm text-white">
                Không thể hiển thị camera
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-125 w-full object-contain"
              />
            )}
          </div>

          {cameraError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {cameraError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={closeCamera}
            >
              Đóng
            </Button>

            <Button
              type="button"
              onClick={capturePhoto}
              disabled={
                cameraLoading ||
                Boolean(cameraError) ||
                !cameraReady
              }
            >
              <span className="inline-flex items-center gap-2">
                <Camera size={16} />
                Chụp
              </span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}