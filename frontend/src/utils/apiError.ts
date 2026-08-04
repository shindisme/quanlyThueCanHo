
export function getApiErrorMessage(error: unknown, defaultMessage = "Thao tác thất bại"): string {
  const err = error as {
    response?: {
      data?: {
        error?: string | { message?: string; details?: Array<{ field: string; message: string }> };
        message?: string;
      };
    };
  };

  const errData = err.response?.data?.error;
  if (typeof errData === "string") {
    return errData;
  }
  if (errData && typeof errData === "object" && "message" in errData) {
    let msg = errData.message || defaultMessage;
    if (Array.isArray(errData.details) && errData.details.length > 0) {
      const detailsText = errData.details.map((d) => `${d.field}: ${d.message}`).join("; ");
      msg += ` (${detailsText})`;
    }
    return msg;
  }
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  return defaultMessage;
}
