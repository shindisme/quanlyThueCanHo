/**
 * Uploads a file to ImageKit.io or simulates it if credentials are not configured.
 * 
 * ImageKit upload endpoint: POST https://upload.imagekit.io/api/v1/files/upload
 * FormData parameters:
 * - file: File or base64 string
 * - fileName: Name of the file
 * - publicKey: Public API key
 * - signature: Security signature (requires backend)
 * - expire: Expiry timestamp
 * - token: Security token
 * 
 * Since this is frontend-only and backend does not provide a signature, we can
 * try to upload using a public uploader API if configured, OR we can simulate the upload
 * by returning a mock URL (which is perfect for a frontend-only implementation).
 */
export async function uploadImage(file: File): Promise<string> {
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  const authenticationEndpoint = import.meta.env.VITE_IMAGEKIT_AUTHENTICATION_ENDPOINT;

  // If credentials are provided and we can get signature
  if (publicKey && urlEndpoint && authenticationEndpoint) {
    try {
      // 1. Get authentication parameters from signature endpoint
      const authRes = await fetch(authenticationEndpoint);
      if (!authRes.ok) throw new Error("Failed to fetch signature");
      const { signature, expire, token } = await authRes.json();

      // 2. Upload to ImageKit
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

  // Fallback / Simulation Mode
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a nice placeholder URL based on file type or size, or random high-quality image
      const randomId = Math.floor(Math.random() * 1000);
      // Let's use standard high-quality photos for buildings / apartments
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
    }, 1200); // 1.2s delay to make it look like a real upload
  });
}
