import api from "../lib/api";

export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const res = await api.post<{ data: { urls: string[] } }>(
    "/uploads/upload-multiple",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data.data.urls;
}
