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

    let destinationLat = body.destinationLat;
    let destinationLng = body.destinationLng;

    if (destinationLat == null || destinationLng == null) {
      const geocoded = await geocodeDestination(body.destination);
      if (geocoded) {
        destinationLat = geocoded.lat;
        destinationLng = geocoded.lng;
      }
    }

    const { itinerary, groundingChunks } = await planTripWithGemini({
      ...body,
      destinationLat,
      destinationLng,
    });

    const enrichedStops = await enrichItineraryStops(
      itinerary,
      groundingChunks
    );

    return NextResponse.json({
      itinerary,
      enrichedStops,
      groundingChunks,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to plan trip.";
    console.error("plan-trip error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
