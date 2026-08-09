import { createFileRoute } from "@tanstack/react-router";
import { UTApi, UTFile } from "uploadthing/server";

// Rendered badges are ~1–3 MB at pixelRatio 2. Anything much larger is not a
// card, so reject it before spending an upload.
const MAX_BYTES = 8 * 1024 * 1024;

export const Route = createFileRoute("/api/upload-card")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env["UPLOADTHING_TOKEN"]) {
          return new Response("Missing UPLOADTHING_TOKEN", { status: 500 });
        }

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
          return new Response("Missing file", { status: 400 });
        }
        if (file.type !== "image/png") {
          return new Response("Only PNG cards can be shared", { status: 415 });
        }
        if (file.size > MAX_BYTES) {
          return new Response("Card image is too large", { status: 413 });
        }

        // Trust the client for the name only — re-wrap the bytes ourselves so
        // the stored file always ends up a .png with a type we just validated.
        const rawName = String(form.get("name") ?? "").trim();
        const safeName =
          rawName.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48) || "hacker-house";

        const utapi = new UTApi();
        const { data, error } = await utapi.uploadFiles(
          new UTFile([await file.arrayBuffer()], `${safeName}-id-card.png`, {
            type: "image/png",
          }),
        );

        if (error || !data) {
          console.error("[upload-card]", error);
          return new Response("Upload failed", { status: 502 });
        }

        return Response.json({ url: data.ufsUrl });
      },
    },
  },
});
