import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const path = join(process.cwd(), "lib/mediaplan/mediaplanImportClipboardPrompt.txt");
  const text = readFileSync(path, "utf-8");
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
