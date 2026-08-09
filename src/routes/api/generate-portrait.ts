import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-portrait")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { prompt?: string };
        const prompt = (body.prompt ?? "").toString().slice(0, 600).trim();
        if (!prompt) return new Response("Missing prompt", { status: 400 });

        const key = process.env["AI_GATEWAY_API_KEY"];
        if (!key) return new Response("Missing AI_GATEWAY_API_KEY", { status: 500 });

        // Endpoint and model are configuration, not code — point them at any
        // OpenAI-compatible image gateway without touching this handler.
        const endpoint =
          process.env["AI_GATEWAY_URL"] ?? "https://ai.gateway.lovable.dev/v1/images/generations";
        const model = process.env["AI_IMAGE_MODEL"] ?? "google/gemini-3.1-flash-image";

        const upstream = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: `Vertical portrait photograph, 2:3 aspect ratio. ${prompt}. Golden hour on a Goa beach at sunset, cinematic color grading, soft warm rim light, premium fashion editorial photography, 85mm lens, shallow depth of field, subject looking sideways, palm trees and pink sunset sky softly blurred behind. Photorealistic, ultra detailed, no text, no watermark.`,
              },
            ],
            modalities: ["image", "text"],
            stream: true,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
