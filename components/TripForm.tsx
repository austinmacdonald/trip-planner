"use client";

import { useState } from "react";
import type { Budget, Pace, TripRequest } from "@/lib/types";

const INTEREST_OPTIONS = [
  "food",
  "museums",
  "nature",
  "nightlife",
  "shopping",
  "history",
  "art",
  "beaches",
  "adventure",
  "family",
  "photography",
  "local culture",
] as const;

interface TripFormProps {
  onSubmit: (request: TripRequest) => void;
  loading: boolean;
}

export default function TripForm({ onSubmit, loading }: TripFormProps) {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState<string[]>(["food", "museums"]);
  const [budget, setBudget] = useState<Budget>("moderate");
  const [pace, setPace] = useState<Pace>("moderate");
  const [startDate, setStartDate] = useState("");

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!destination.trim() || loading) return;

    onSubmit({
      destination: destination.trim(),
      days,
      interests,
      budget,
      pace,
      startDate: startDate || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Plan your trip</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Gemini + Google Maps will build a day-by-day itinerary with real
          places.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Destination</span>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Tokyo, Japan"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Days</span>
        <input
          type="number"
          min={1}
          max={14}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-zinc-700">Interests</span>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Budget</span>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value as Budget)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            <option value="budget">Budget</option>
            <option value="moderate">Moderate</option>
            <option value="luxury">Luxury</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Pace</span>
          <select
            value={pace}
            onChange={(e) => setPace(e.target.value as Pace)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            <option value="relaxed">Relaxed</option>
            <option value="moderate">Moderate</option>
            <option value="packed">Packed</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">
          Start date <span className="text-zinc-400">(optional)</span>
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </label>

      <button
        type="submit"
        disabled={loading || !destination.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Planning your trip..." : "Generate itinerary"}
      </button>
    </form>
  );
}
