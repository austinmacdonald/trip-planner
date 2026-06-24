"use client";

import type { EnrichedStop, TripItinerary } from "@/lib/types";
import DaySection from "./DaySection";

interface ItineraryPanelProps {
  itinerary: TripItinerary | null;
  enrichedStops: EnrichedStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string) => void;
  loading?: boolean;
}

export default function ItineraryPanel({
  itinerary,
  enrichedStops,
  selectedStopId,
  onSelectStop,
  loading = false,
}: ItineraryPanelProps) {
  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-medium text-zinc-700">
            Your itinerary will appear here
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Fill in your trip details and click Generate itinerary to get
            started.
          </p>
        </div>
      </div>
    );
  }

  const stopsByDay = itinerary.days.map((day) => ({
    day: day.day,
    title: day.title,
    stops: enrichedStops.filter((stop) => stop.day === day.day),
  }));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-zinc-200 bg-white px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          {itinerary.durationDays}-day trip
        </p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900">
          {itinerary.destination}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          {itinerary.summary}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {stopsByDay.map((day, index) => (
          <DaySection
            key={day.day}
            day={day.day}
            title={day.title}
            stops={day.stops}
            selectedStopId={selectedStopId}
            onSelectStop={onSelectStop}
            defaultOpen={index === 0}
          />
        ))}

        {enrichedStops.some((stop) => stop.placeId) && (
          <p className="text-xs text-zinc-400">
            Place data provided by Google Maps.{" "}
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Maps
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
