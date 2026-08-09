import { genUploader } from "uploadthing/client";
import type { UploadRouter } from "./uploadthing-router";

const { uploadFiles } = genUploader<UploadRouter>({
  url: "/api/uploadthing",
});

/**
 * Uploads the rendered badge and resolves to its CDN URL.
 *
 * Goes browser → UploadThing directly via a presigned URL, so the PNG never
 * hits our serverless function and Vercel's 4.5 MB request cap is irrelevant.
 */
export async function uploadCardImage(file: File): Promise<string> {
  const [uploaded] = await uploadFiles("cardImage", { files: [file] });
  const url = uploaded?.serverData?.url ?? uploaded?.ufsUrl;
  if (!url) throw new Error("Upload succeeded but returned no URL");
  return url;
}
