import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

/**
 * The badge upload route.
 *
 * The browser uploads straight to UploadThing using a presigned URL — the PNG
 * never passes through our own serverless function. That is not an
 * optimisation: Vercel caps a function request body at 4.5 MB, and a
 * pixelRatio-2 badge is ~3 MB before multipart/base64 overhead pushes it over,
 * so proxying the bytes fails with FUNCTION_PAYLOAD_TOO_LARGE before the
 * handler ever runs.
 *
 * Our server only signs the request and receives the completion callback, both
 * of which are tiny.
 */
export const uploadRouter = {
  cardImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
      // Cards are always PNG; anything else is not one of ours.
      acl: "public-read",
    },
  }).onUploadComplete(({ file }) => {
    // Returned to the client as the upload's server output.
    return { url: file.ufsUrl };
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
