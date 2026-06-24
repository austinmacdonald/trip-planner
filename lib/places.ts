import {
  flattenStops,
  matchStopToGroundingChunk,
} from "./match-places";
import type {
  EnrichedStop,
  EnrichPlacesRequest,
  GroundingChunk,
  TripItinerary,
} from "./types";

const PLACE_FIELD_MASK =
  "id,displayName,location,formattedAddress,rating,photos,currentOpeningHours";

interface PlaceDetails {
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  rating?: number;
  photoUrl?: string;
  openingHours?: string;
}

function getMapsApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not set. Copy .env.local.example to .env.local and add your key."
    );
  }
  return key;
}

function extractPlaceId(placeId: string): string {
  return placeId.startsWith("places/") ? placeId.slice("places/".length) : placeId;
}

export async function geocodeDestination(
  destination: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", destination);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    results?: { geometry?: { location?: { lat: number; lng: number } } }[];
  };

  const location = data.results?.[0]?.geometry?.location;
  if (!location) return null;
  return { lat: location.lat, lng: location.lng };
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = getMapsApiKey();
  const id = extractPlaceId(placeId);
  const url = `https://places.googleapis.com/v1/places/${id}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACE_FIELD_MASK,
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    location?: { latitude?: number; longitude?: number };
    formattedAddress?: string;
    rating?: number;
    photos?: { name?: string }[];
    currentOpeningHours?: { weekdayDescriptions?: string[] };
  };

  let photoUrl: string | undefined;
  const photoName = data.photos?.[0]?.name;
  if (photoName) {
    photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${apiKey}`;
  }

  return {
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    formattedAddress: data.formattedAddress,
    rating: data.rating,
    photoUrl,
    openingHours: data.currentOpeningHours?.weekdayDescriptions?.join("; "),
  };
}

async function geocodeStop(
  stopName: string,
  destination: string
): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const query = `${stopName}, ${destination}`;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    results?: {
      geometry?: { location?: { lat: number; lng: number } };
      formatted_address?: string;
    }[];
  };

  const result = data.results?.[0];
  if (!result?.geometry?.location) return null;

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

export async function enrichItineraryStops(
  itinerary: TripItinerary,
  groundingChunks: GroundingChunk[]
): Promise<EnrichedStop[]> {
  const usedPlaceIds = new Set<string>();
  const flatStops = flattenStops(itinerary);
  const enriched: EnrichedStop[] = [];

  for (let i = 0; i < flatStops.length; i++) {
    const { day, dayTitle, stopIndex, stop } = flatStops[i];
    const id = `day-${day}-stop-${stopIndex}`;

    const match = matchStopToGroundingChunk(
      stop.name,
      groundingChunks,
      usedPlaceIds
    );

    let details: PlaceDetails | null = null;
    if (match) {
      usedPlaceIds.add(match.placeId);
      details = await fetchPlaceDetails(match.placeId);
    }

    if (!details?.lat || !details?.lng) {
      details = await geocodeStop(stop.name, itinerary.destination);
    }

    enriched.push({
      id,
      day,
      dayTitle,
      globalIndex: i + 1,
      name: stop.name,
      timeSlot: stop.timeSlot,
      description: stop.description,
      category: stop.category,
      estimatedDuration: stop.estimatedDuration,
      placeId: match?.placeId,
      mapsUri: match?.uri,
      lat: details?.lat,
      lng: details?.lng,
      formattedAddress: details?.formattedAddress,
      rating: details?.rating,
      photoUrl: details?.photoUrl,
      openingHours: details?.openingHours,
      matched: Boolean(match && details?.lat != null),
    });
  }

  return enriched;
}

export async function enrichPlaces(
  request: EnrichPlacesRequest
): Promise<EnrichedStop[]> {
  return enrichItineraryStops(request.itinerary, request.groundingChunks);
}
