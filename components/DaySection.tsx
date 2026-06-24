"use client";

import { useState } from "react";
import type { EnrichedStop } from "@/lib/types";
import StopCard from "./StopCard";

interface DaySectionProps {
  day: number;
  title: string;
  stops: EnrichedStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string) => void;
  defaultOpen?: boolean;
}

export default function DaySection({
  day,
  title,
  stops,
  selectedStopId,
  onSelectStop,
  defaultOpen = true,
}: DaySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50/50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Day {day}
          </p>
          <h3 className="font-semibold text-zinc-900">{title}</h3>
        </div>
        <span className="text-sm text-zinc-400">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-zinc-200 p-4">
          {stops.map((stop) => (
            <StopCard
              key={stop.id}
              stop={stop}
              selected={selectedStopId === stop.id}
              onSelect={onSelectStop}
            />
          ))}
        </div>
      )}
    </section>
  );
}
