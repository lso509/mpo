import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { MediaplanPDF } from "@/components/pdf/MediaplanPDF";
import type {
  MediaplanPDFKunde,
  MediaplanPDFKampagne,
  MediaplanPDFKundenberater,
  MediaplanPDFPosition,
} from "@/components/pdf/MediaplanPDF";

export type MediaplanPDFBody = {
  kunde: MediaplanPDFKunde;
  kampagne: MediaplanPDFKampagne;
  kundenberater?: MediaplanPDFKundenberater;
  positionen: MediaplanPDFPosition[];
  erstelltAm?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MediaplanPDFBody;
    const { kunde, kampagne, kundenberater, positionen, erstelltAm } = body;

    if (!kunde || !kampagne || !Array.isArray(positionen)) {
      return NextResponse.json(
        { error: "kunde, kampagne und positionen sind erforderlich" },
        { status: 400 }
      );
    }

    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoPathOrUndefined = fs.existsSync(logoPath) ? logoPath : undefined;

    const element = React.createElement(MediaplanPDF, {
      kunde,
      kampagne,
      kundenberater,
      positionen,
      erstelltAm,
      logoPath: logoPathOrUndefined,
    });
    const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);

    const safeName = (kampagne.name || "Mediaplan")
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "")
      .trim()
      .slice(0, 80);
    const filename = `Mediaplan_${safeName || "Export"}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF mediaplan error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF-Generierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
