import { createFileRoute } from "@tanstack/react-router";
import { createRouteHandler } from "uploadthing/server";
import { uploadRouter } from "@/lib/uploadthing-router";

const handlers = createRouteHandler({ router: uploadRouter });

export const Route = createFileRoute("/api/uploadthing")({
  server: {
    handlers: {
      GET: ({ request }) => handlers(request),
      POST: ({ request }) => handlers(request),
    },
  },
});
