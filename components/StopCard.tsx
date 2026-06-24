"use client";

import type { EnrichedStop } from "@/lib/types";

const DAY_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#059669",
  "#0891b2",
  "#4f46e5",
  "#be123c",
];

interface StopCardProps {
  stop: EnrichedStop;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function StopCard({ stop, selected, onSelect }: StopCardProps) {
  const dayColor = DAY_COLORS[(stop.day - 1) % DAY_COLORS.length];

  return (
    <button
      type="button"
      onClick={() => onSelect(stop.id)}
      className={`w-full rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: dayColor }}
        >
          {stop.globalIndex}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-zinc-900">{stop.name}</h4>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-600">
              {stop.category}
            </span>
            {!stop.matched && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Unverified location
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {stop.timeSlot} · {stop.estimatedDuration}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {stop.description}
          </p>
          {stop.formattedAddress && (
            <p className="mt-2 text-xs text-zinc-500">{stop.formattedAddress}</p>
          )}
          {stop.rating != null && (
            <p className="mt-1 text-xs text-zinc-500">
              Rating: {stop.rating.toFixed(1)} ★
            </p>
          )}
          {stop.mapsUri && (
            <a
              href={stop.mapsUri}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              View on Google Maps
            </a>
          )}
        </div>
      </div>
    </button>
  );
}
