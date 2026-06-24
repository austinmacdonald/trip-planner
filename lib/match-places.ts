import type { TripItinerary } from "./types";

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
