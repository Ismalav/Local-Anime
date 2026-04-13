import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

export async function GET() {
  const s = getSettings();
  return NextResponse.json({
    sushiscan: {
      configured: Boolean(s.sushiscan.cfClearance.trim()),
      cfClearance: s.sushiscan.cfClearance,
      userAgent: s.sushiscan.userAgent,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      cfClearance?: string;
      userAgent?: string;
    };
    saveSettings({
      sushiscan: {
        cfClearance: body.cfClearance?.trim() ?? "",
        userAgent: body.userAgent?.trim() ?? "",
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur de sauvegarde" },
      { status: 500 }
    );
  }
}
