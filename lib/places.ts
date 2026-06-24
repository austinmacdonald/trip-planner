import { flattenStops } from "./match-places";
import type { EnrichedStop, EnrichPlacesRequest, TripItinerary } from "./types";

// Minimal field mask — skips photos/hours for faster Places responses
const SEARCH_FIELD_MASK =
  "places.id,places.formattedAddress,places.location,places.rating,places.googleMapsUri";

interface PlaceDetails {
  placeId?: string;
  mapsUri?: string;
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

function buildMapsUri(placeId: string): string {
  const id = placeId.startsWith("places/") ? placeId.slice("places/".length) : placeId;
  return `https://www.google.com/maps/search/?api=1&query_place_id=${id}`;
}

function cacheKey(stopName: string, destination: string): string {
  return `${stopName.trim().toLowerCase()}|${destination.trim().toLowerCase()}`;
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

async function searchPlace(
  stopName: string,
  destination: string,
  destinationCoords?: { lat: number; lng: number } | null
): Promise<PlaceDetails | null> {
  const apiKey = getMapsApiKey();

  const body: Record<string, unknown> = {
    textQuery: `${stopName}, ${destination}`,
    maxResultCount: 1,
  };

  if (destinationCoords) {
    body.locationBias = {
      circle: {
        center: {
          latitude: destinationCoords.lat,
          longitude: destinationCoords.lng,
        },
        radius: 50000,
      },
    };
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    places?: {
      id?: string;
      googleMapsUri?: string;
      location?: { latitude?: number; longitude?: number };
      formattedAddress?: string;
      rating?: number;
    }[];
  };

  const place = data.places?.[0];
  if (!place?.id || place.location?.latitude == null || place.location?.longitude == null) {
    return null;
  }

  return {
    placeId: place.id,
    mapsUri: place.googleMapsUri ?? buildMapsUri(place.id),
    lat: place.location.latitude,
    lng: place.location.longitude,
    formattedAddress: place.formattedAddress,
    rating: place.rating,
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
      place_id?: string;
    }[];
  };

  const result = data.results?.[0];
  if (!result?.geometry?.location) return null;

  const placeId = result.place_id;
  return {
    placeId: placeId ? `places/${placeId}` : undefined,
    mapsUri: placeId ? buildMapsUri(placeId) : undefined,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

async function resolveStopDetails(
  stopName: string,
  destination: string,
  destinationCoords: { lat: number; lng: number } | null | undefined,
  cache: Map<string, PlaceDetails | null>
): Promise<PlaceDetails | null> {
  const key = cacheKey(stopName, destination);
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  const details =
    (await searchPlace(stopName, destination, destinationCoords)) ??
    (await geocodeStop(stopName, destination));

  cache.set(key, details);
  return details;
}

export async function enrichItineraryStops(
  itinerary: TripItinerary,
  destinationCoords?: { lat: number; lng: number } | null
): Promise<EnrichedStop[]> {
  const flatStops = flattenStops(itinerary);
  const cache = new Map<string, PlaceDetails | null>();

  return Promise.all(
    flatStops.map(async ({ day, dayTitle, stopIndex, stop }, i) => {
      const id = `day-${day}-stop-${stopIndex}`;
      const details = await resolveStopDetails(
        stop.name,
        itinerary.destination,
        destinationCoords,
        cache
      );

      const matched = Boolean(
        details?.lat != null && details?.lng != null && details?.placeId
      );

      return {
        id,
        day,
        dayTitle,
        globalIndex: i + 1,
        name: stop.name,
        timeSlot: stop.timeSlot,
        description: stop.description,
        category: stop.category,
        estimatedDuration: stop.estimatedDuration,
        placeId: details?.placeId,
        mapsUri: details?.mapsUri,
        lat: details?.lat,
        lng: details?.lng,
        formattedAddress: details?.formattedAddress,
        rating: details?.rating,
        photoUrl: details?.photoUrl,
        openingHours: details?.openingHours,
        matched,
      };
    })
  );
}

export async function enrichPlaces(
  request: EnrichPlacesRequest,
  destinationCoords?: { lat: number; lng: number } | null
): Promise<EnrichedStop[]> {
  return enrichItineraryStops(request.itinerary, destinationCoords);
}
