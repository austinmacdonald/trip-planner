import { NextResponse } from "next/server";
import { enrichPlaces, geocodeDestination } from "@/lib/places";
import type { EnrichPlacesRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnrichPlacesRequest;

    if (!body.itinerary) {
      return NextResponse.json(
        { error: "itinerary is required." },
        { status: 400 }
      );
    }

    const destinationCoords =
      body.destinationCoords ??
      (await geocodeDestination(body.itinerary.destination));

    const enrichedStops = await enrichPlaces(body, destinationCoords);

    return NextResponse.json({ enrichedStops });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve places.";
    console.error("enrich-places error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
