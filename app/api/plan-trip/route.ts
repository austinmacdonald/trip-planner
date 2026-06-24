import { NextResponse } from "next/server";
import { planTripWithGemini } from "@/lib/gemini";
import { enrichItineraryStops, geocodeDestination } from "@/lib/places";
import type { TripRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TripRequest;

    if (!body.destination?.trim()) {
      return NextResponse.json(
        { error: "Destination is required." },
        { status: 400 }
      );
    }

    if (!body.days || body.days < 1 || body.days > 14) {
      return NextResponse.json(
        { error: "Days must be between 1 and 14." },
        { status: 400 }
      );
    }

    const [destinationCoords, itinerary] = await Promise.all([
      geocodeDestination(body.destination),
      planTripWithGemini(body),
    ]);

    const enrichedStops = await enrichItineraryStops(
      itinerary,
      destinationCoords
    );

    return NextResponse.json({
      itinerary,
      enrichedStops,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to plan trip.";
    console.error("plan-trip error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
