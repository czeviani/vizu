// Embeds an external image URL as a base64 data URL so slides stay stable
// (no dependency on a remote host) and the PPTX exporter can inline the image.
// Already-embedded sources (data:) or failed fetches (e.g. CORS) are returned as-is.
export async function embedImageAsDataUrl(src: string): Promise<string> {
  if (!src || src.startsWith('data:')) return src;

  try {
    const res = await fetch(src);
    if (!res.ok) return src;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return src;

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    // CORS-blocked or unreachable host — keep the external URL rather than fail the insert.
    return src;
  }
}
