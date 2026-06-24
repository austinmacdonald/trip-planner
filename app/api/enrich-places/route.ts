import { NextResponse } from "next/server";
import { enrichPlaces } from "@/lib/places";
import type { EnrichPlacesRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnrichPlacesRequest;

    if (!body.itinerary || !Array.isArray(body.groundingChunks)) {
      return NextResponse.json(
        { error: "itinerary and groundingChunks are required." },
        { status: 400 }
      );
    }

    const enrichedStops = await enrichPlaces(body);

    return NextResponse.json({ enrichedStops });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enrich places.";
    console.error("enrich-places error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
