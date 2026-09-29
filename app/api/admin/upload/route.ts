import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getSession } from "@/lib/auth";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

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

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // If Cloudinary is configured in .env.local, upload directly to Cloudinary CDN
  if (isCloudinaryConfigured) {
    try {
      const res = await uploadToCloudinary(buffer, "hueglam");
      return NextResponse.json({ url: res.secure_url });
    } catch (err: unknown) {
      console.error("Cloudinary upload failed, falling back to local:", err);
    }
  }

  // Fallback to local storage for local testing if Cloudinary is not configured yet
  const base = crypto.randomBytes(8).toString("hex");
  const filename = Date.now().toString(36) + "-" + base + extension;

  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);

  return NextResponse.json({ url: "/uploads/" + filename });
}

