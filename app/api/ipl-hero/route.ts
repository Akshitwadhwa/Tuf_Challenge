import { NextResponse } from "next/server";
import { fetchLatestIplHeroData } from "@/lib/ipl";

export const revalidate = 60;

export async function GET() {
  try {
    const heroData = await fetchLatestIplHeroData();

    return NextResponse.json(heroData, {
      headers: {
        "cache-control": "s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        label: "IPL update",
        title: "IPL 2026",
        subtitle: "Live schedule unavailable right now.",
        teamAName: "",
        teamAShort: "",
        teamAScore: null,
        teamBName: "",
        teamBShort: "",
        teamBScore: null,
        venue: "",
        startLabel: "",
        updatedAt: new Date().toISOString(),
        sourceUrl: ""
      },
      {
        status: 200
      }
    );
  }
}
