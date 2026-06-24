import type { GroundingChunk, TripItinerary } from "./types";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  const aTokens = new Set(na.split(" "));
  const bTokens = new Set(nb.split(" "));
  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token) && token.length > 2) overlap++;
  }
  const union = new Set([...aTokens, ...bTokens]).size;
  return union > 0 ? overlap / union : 0;
}

export function matchStopToGroundingChunk(
  stopName: string,
  chunks: GroundingChunk[],
  usedPlaceIds: Set<string>
): GroundingChunk | undefined {
  let best: GroundingChunk | undefined;
  let bestScore = 0;

  for (const chunk of chunks) {
    if (usedPlaceIds.has(chunk.placeId)) continue;
    const score = similarity(stopName, chunk.title);
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      best = chunk;
    }
  }

  return best;
}

export function flattenStops(itinerary: TripItinerary) {
  const stops: {
    day: number;
    dayTitle: string;
    stopIndex: number;
    stop: TripItinerary["days"][number]["stops"][number];
  }[] = [];

  for (const day of itinerary.days) {
    day.stops.forEach((stop, stopIndex) => {
      stops.push({
        day: day.day,
        dayTitle: day.title,
        stopIndex,
        stop,
      });
    });
  }

  return stops;
}
