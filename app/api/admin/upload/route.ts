import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/*
  Only these can be written to disk. Anything else is rejected outright.

  SVG is deliberately absent: an SVG is a document, not just an image, so one
  containing a <script> tag would execute on this site's own origin when opened
  directly. Uploading is admin-only, but that turns a single compromised admin
  login into persistent script execution on the storefront, and a skincare
  catalogue has no need for vector artwork.
*/
const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  const extension = ALLOWED.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: "Unsupported file type: " + (file.type || "unknown") },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 25MB." },
      { status: 413 },
    );
  }

  // The stored name is generated, never taken from the upload, so a crafted
  // filename cannot escape the uploads directory or overwrite anything.
  const base = crypto.randomBytes(8).toString("hex");
  const filename = Date.now().toString(36) + "-" + base + extension;

  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, filename),
    Buffer.from(await file.arrayBuffer()),
  );

  return NextResponse.json({ url: "/uploads/" + filename });
}
