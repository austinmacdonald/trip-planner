"use client";

import { useCallback, useState } from "react";
import ItineraryPanel from "@/components/ItineraryPanel";
import TripForm from "@/components/TripForm";
import TripMap from "@/components/TripMap";
import type {
  EnrichedStop,
  PlanTripResponse,
  TripItinerary,
  TripRequest,
} from "@/lib/types";

export default function HomePage() {
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [enrichedStops, setEnrichedStops] = useState<EnrichedStop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handlePlanTrip = useCallback(async (request: TripRequest) => {
    setLoading(true);
    setError(null);
    setSelectedStopId(null);

    try {
      const response = await fetch("/api/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = (await response.json()) as PlanTripResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to plan trip.");
      }

      setItinerary(data.itinerary);
      setEnrichedStops(data.enrichedStops);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectStop = useCallback((id: string) => {
    setSelectedStopId(id || null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-zinc-900">AI Trip Planner</h1>
        <p className="text-sm text-zinc-500">
          Powered by Gemini + Google Maps
        </p>
      </header>

      {!showResults ? (
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center p-6">
          <TripForm onSubmit={handlePlanTrip} loading={loading} />
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </main>
      ) : (
        <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex w-full flex-col border-b border-zinc-200 bg-white lg:w-[40%] lg:border-b-0 lg:border-r">
            <div className="border-b border-zinc-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowResults(false)}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                ← Plan another trip
              </button>
            </div>
            {error && (
              <p className="mx-4 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="min-h-[320px] flex-1 overflow-hidden lg:min-h-0">
              <ItineraryPanel
                itinerary={itinerary}
                enrichedStops={enrichedStops}
                selectedStopId={selectedStopId}
                onSelectStop={handleSelectStop}
                loading={loading}
              />
            </div>
          </div>

          <div className="h-[50vh] flex-1 lg:h-auto">
            <TripMap
              stops={enrichedStops}
              selectedStopId={selectedStopId}
              onSelectStop={handleSelectStop}
              loading={loading}
            />
          </div>
        </main>
      )}
    </div>
  );
}
