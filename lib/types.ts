export type Budget = "budget" | "moderate" | "luxury";
export type Pace = "relaxed" | "moderate" | "packed";

export interface TripRequest {
  destination: string;
  days: number;
  interests: string[];
  budget: Budget;
  pace: Pace;
  startDate?: string;
}

export interface TripStop {
  name: string;
  timeSlot: string;
  description: string;
  category: string;
  estimatedDuration: string;
}

export interface TripDay {
  day: number;
  title: string;
  stops: TripStop[];
}

export interface TripItinerary {
  destination: string;
  durationDays: number;
  summary: string;
  days: TripDay[];
}

export interface EnrichedStop {
  id: string;
  day: number;
  dayTitle: string;
  globalIndex: number;
  name: string;
  timeSlot: string;
  description: string;
  category: string;
  estimatedDuration: string;
  placeId?: string;
  mapsUri?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  rating?: number;
  photoUrl?: string;
  openingHours?: string;
  matched: boolean;
}

export interface PlanTripResponse {
  itinerary: TripItinerary;
  enrichedStops: EnrichedStop[];
}

export interface EnrichPlacesRequest {
  itinerary: TripItinerary;
  destinationCoords?: { lat: number; lng: number };
}
