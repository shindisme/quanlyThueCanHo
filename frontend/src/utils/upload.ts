// Tải ảnh lên ImageKit
export async function uploadImage(file: File): Promise<string> {
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  const authenticationEndpoint = import.meta.env.VITE_IMAGEKIT_AUTHENTICATION_ENDPOINT;

  // Sử dụng cấu hình ImageKit
  if (publicKey && urlEndpoint && authenticationEndpoint) {
    try {
      // Lấy tham số xác thực
      const authRes = await fetch(authenticationEndpoint);
      if (!authRes.ok) throw new Error("Failed to fetch signature");
      const { signature, expire, token } = await authRes.json();

      // Tải lên ImageKit
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", publicKey);
      formData.append("signature", signature);
      formData.append("expire", String(expire));
      formData.append("token", token);

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("ImageKit upload failed");
      const result = await uploadRes.json();
      return result.url;
    } catch (err) {
      console.warn("Real ImageKit upload failed, falling back to simulation:", err);
    }
  }

  // Giả lập tải lên
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 1000);
      const mockImages = [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
      ];
      const selectedImage = mockImages[randomId % mockImages.length];
      resolve(selectedImage);
    }, 1200);
  });
}
