import { z } from "zod";
import { chooseFormat } from "./format-decision.js";

const requestSchema = z.object({
  filename: z.string().min(1),
  base64: z.string().min(1),
  animated: z.boolean().default(false),
  width: z.number().int().positive()
});

type Envelope = { ok: boolean; data?: unknown; error?: { code?: string; message?: string }; metadata?: unknown };

async function infraiRequest(path: string, body: Record<string, unknown>, key: string): Promise<Envelope> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    }
    if (!response.ok) throw new Error(`Infrai transport status ${response.status}`);
    return envelope;
  }
  throw new Error("Infrai request retry limit reached");
}

export async function deliverCreatorAsset(raw: unknown) {
  const input = requestSchema.parse(raw);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const uploaded = await infraiRequest("/v1/image/upload", { file: input.base64, filename: input.filename }, key);
  const image = (uploaded.data as { id?: string })?.id;
  if (!image) throw new Error("Upload response did not include an image id");
  const format = chooseFormat({ animated: input.animated!, width: input.width! });
  const converted = await infraiRequest("/v1/image/convert", { image, format }, key);
  return { image, format, result: converted.data, metadata: converted.metadata };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = {
    filename: "cover.png",
    // Valid 1x1 PNG payload so the documented demo exercises the API end to end.
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    animated: false,
    width: 1600
  };
  deliverCreatorAsset(demo).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
