"use client";

import { useEffect, useMemo } from "react";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
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

interface TripMapProps {
  stops: EnrichedStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string) => void;
  loading?: boolean;
}

function FitBounds({ stops }: { stops: EnrichedStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const positioned = stops.filter((s) => s.lat != null && s.lng != null);
    if (positioned.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    for (const stop of positioned) {
      bounds.extend({ lat: stop.lat!, lng: stop.lng! });
    }
    map.fitBounds(bounds, 80);
  }, [map, stops]);

  return null;
}

function RoutePolyline({ stops }: { stops: EnrichedStop[] }) {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !mapsLibrary) return;

    const positioned = stops.filter((s) => s.lat != null && s.lng != null);
    if (positioned.length < 2) return;

    let polyline: google.maps.Polyline | null = null;

    const renderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#2563eb",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });

    const service = new google.maps.DirectionsService();
    const origin = {
      lat: positioned[0].lat!,
      lng: positioned[0].lng!,
    };
    const destination = {
      lat: positioned[positioned.length - 1].lat!,
      lng: positioned[positioned.length - 1].lng!,
    };
    const waypoints = positioned.slice(1, -1).map((stop) => ({
      location: { lat: stop.lat!, lng: stop.lng! },
      stopover: true,
    }));

    service.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          renderer.setDirections(result);
        } else {
          const path = positioned.map((s) => ({ lat: s.lat!, lng: s.lng! }));
          polyline = new mapsLibrary.Polyline({
            path,
            map,
            strokeColor: "#2563eb",
            strokeWeight: 4,
            strokeOpacity: 0.8,
          });
        }
      }
    );

    return () => {
      renderer.setMap(null);
      polyline?.setMap(null);
    };
  }, [map, mapsLibrary, stops]);

  return null;
}

function MapContent({
  stops,
  selectedStopId,
  onSelectStop,
}: {
  stops: EnrichedStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string) => void;
}) {
  const positioned = useMemo(
    () => stops.filter((s) => s.lat != null && s.lng != null),
    [stops]
  );

  const selectedStop = positioned.find((s) => s.id === selectedStopId) ?? null;
  const defaultCenter = positioned[0]
    ? { lat: positioned[0].lat!, lng: positioned[0].lng! }
    : { lat: 35.6762, lng: 139.6503 };

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={12}
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID"}
      gestureHandling="greedy"
      disableDefaultUI={false}
      className="h-full w-full"
    >
      <FitBounds stops={positioned} />
      {positioned.length >= 2 && <RoutePolyline stops={positioned} />}

      {positioned.map((stop) => {
        const color = DAY_COLORS[(stop.day - 1) % DAY_COLORS.length];
        const isSelected = stop.id === selectedStopId;

        return (
          <AdvancedMarker
            key={stop.id}
            position={{ lat: stop.lat!, lng: stop.lng! }}
            onClick={() => onSelectStop(stop.id)}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold text-white shadow-md transition-transform ${
                isSelected ? "scale-125 border-white" : "border-white/80"
              }`}
              style={{ backgroundColor: color }}
            >
              {stop.globalIndex}
            </div>
          </AdvancedMarker>
        );
      })}

      {selectedStop && (
        <InfoWindow
          position={{ lat: selectedStop.lat!, lng: selectedStop.lng! }}
          onCloseClick={() => onSelectStop("")}
        >
          <div className="max-w-[220px] p-1">
            <p className="text-sm font-semibold text-zinc-900">
              {selectedStop.name}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Day {selectedStop.day} · {selectedStop.timeSlot}
            </p>
            {selectedStop.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedStop.photoUrl}
                alt={selectedStop.name}
                className="mt-2 h-24 w-full rounded object-cover"
              />
            )}
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              {selectedStop.description}
            </p>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}

export default function TripMap({
  stops,
  selectedStopId,
  onSelectStop,
  loading = false,
}: TripMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-zinc-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100 p-8 text-center">
        <div>
          <p className="font-medium text-zinc-700">
            Google Maps API key not configured
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file. See
            .env.local.example for setup instructions.
          </p>
        </div>
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100 p-8 text-center">
        <div>
          <p className="font-medium text-zinc-700">Map preview</p>
          <p className="mt-2 text-sm text-zinc-500">
            Generate an itinerary to see stops and routes on the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-full w-full">
        <MapContent
          stops={stops}
          selectedStopId={selectedStopId}
          onSelectStop={onSelectStop}
        />
      </div>
    </APIProvider>
  );
}
