import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage = "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.";
  let errorStatus: number | string = "Lỗi Hệ Thống";

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full p-4 bg-gray-50/50 font-sans">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl transition-all duration-300 md:p-12">
        <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-red-400/10 blur-3xl" />
        <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 animate-pulse mb-6">
            <AlertTriangle size={32} />
          </div>

          {/* Status code  */}
          <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-500/10 mb-3">
            Mã lỗi: {errorStatus}
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl mb-3">
            Rất tiếc, đã có lỗi xảy ra!
          </h2>

          <p className="text-sm leading-relaxed text-gray-500 max-w-sm mb-8">
            Hệ thống không thể tải trang này do một lỗi không mong muốn trong mã nguồn hoặc kết nối.
          </p>

          {/* Error Message Box */}
          <div className="w-full text-left bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-8 max-h-40 overflow-y-auto">
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Chi tiết kỹ thuật
            </span>
            <code className="text-xs font-mono text-red-600 wrap-break-word block whitespace-pre-wrap leading-relaxed">
              {errorMessage}
            </code>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 hover:shadow-lg active:scale-98 transition-all duration-150"
            >
              <RefreshCw size={16} />
              Tải lại trang
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:scale-98 transition-all duration-150"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
