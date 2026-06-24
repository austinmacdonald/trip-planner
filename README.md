# AI Trip Planner

A Next.js web app that uses **Google Gemini** (with Grounding with Google Maps) to generate day-by-day trip itineraries, then displays stops and routes on an interactive **Google Map**.

## Features

- Trip form: destination, days, interests, budget, pace, optional start date
- Gemini generates structured itineraries grounded in real Google Maps places
- Split-panel UI: scrollable itinerary on the left, interactive map on the right
- Numbered map markers color-coded by day
- Walking route polyline connecting stops in order
- Click a stop in the list to highlight it on the map
- Google Maps attribution links on grounded places

## Prerequisites

1. [Gemini API key](https://aistudio.google.com/apikey) from Google AI Studio
2. [Google Maps Platform API key](https://console.cloud.google.com/google/maps-apis) with these APIs enabled:
   - Maps JavaScript API
   - Places API (New)
   - Routes API (or Directions API)
   - Geocoding API

## Setup

```bash
cd trip-planner
npm install
cp .env.local.example .env.local
```

Edit `.env.local` with your keys:

```
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
GOOGLE_MAPS_API_KEY=your_maps_key
```

Restrict your Maps API key by HTTP referrer (`http://localhost:3000/*` for local dev) in Google Cloud Console.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Enter a destination (e.g. "Tokyo, Japan")
2. Set trip length, interests, budget, and pace
3. Click **Generate itinerary**
4. Browse the day-by-day plan on the left; explore stops on the map on the right
5. Click any stop to highlight its marker and open an info window

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/plan-trip` | POST | Calls Gemini with Maps grounding, enriches places, returns full itinerary |
| `/api/enrich-places` | POST | Resolves grounding place IDs to coordinates via Places API |

## Cost Notes

- Grounding with Google Maps: ~$25 per 1,000 grounded prompts
- Maps JavaScript, Places, Geocoding, and Routes APIs have separate usage-based pricing

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- `@google/genai` — Gemini API with Maps grounding + structured JSON output
- `@vis.gl/react-google-maps` — Maps JavaScript API rendering
