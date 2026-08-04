export function getApiErrorMessage(error: unknown, defaultMessage = "Thao tác thất bại"): string {
  const err = error as {
    response?: {
      status?: number;
      data?: {
        error?: string | { message?: string; details?: Array<{ field: string; message: string }> };
        message?: string;
      };
    };
  };

  const isGenericError = (text?: string): boolean => {
    if (!text) return true;
    const lower = text.toLowerCase();
    return (
      lower.includes("lỗi hệ thống") ||
      lower.includes("internal server error") ||
      lower.includes("unexpected error") ||
      lower.includes("something went wrong") ||
      lower.includes("failed to execute")
    );
  };

  const errData = err.response?.data?.error;
  if (typeof errData === "string") {
    if (isGenericError(errData)) return defaultMessage;
    return errData;
  }
  if (errData && typeof errData === "object" && "message" in errData) {
    let msg = errData.message;
    if (isGenericError(msg)) msg = defaultMessage;
    if (Array.isArray(errData.details) && errData.details.length > 0) {
      const detailsText = errData.details.map((d) => `${d.field}: ${d.message}`).join("; ");
      return `${msg} (${detailsText})`;
    }
    return msg || defaultMessage;
  }
  if (err.response?.data?.message) {
    const msg = err.response.data.message;
    if (isGenericError(msg)) return defaultMessage;
    return msg;
  }

  return defaultMessage;
}
