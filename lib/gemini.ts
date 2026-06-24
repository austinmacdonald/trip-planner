import { GoogleGenAI } from "@google/genai";
import type { GroundingChunk, TripItinerary, TripRequest } from "./types";

function buildPrompt(request: TripRequest): string {
  const interests =
    request.interests.length > 0
      ? request.interests.join(", ")
      : "general sightseeing";

  const dateLine = request.startDate
    ? `Start date: ${request.startDate}.`
    : "";

  return `You are an expert travel planner. Create a detailed ${request.days}-day itinerary for ${request.destination}.

Preferences:
- Interests: ${interests}
- Budget: ${request.budget}
- Pace: ${request.pace}
${dateLine}

Requirements:
- Use real, specific places (restaurants, landmarks, museums, parks) that exist in ${request.destination}.
- Order stops chronologically within each day with realistic time slots.
- Include 3-5 stops per day depending on pace (${request.pace}).
- Match activities to the stated interests and budget level.
- Provide practical descriptions mentioning what to do and why it fits the trip.
- Categories must be one of: food, museum, landmark, nature, shopping, nightlife, activity, transport, other.

Respond with ONLY valid JSON (no markdown, no commentary) in this exact shape:
{
  "destination": "string",
  "durationDays": number,
  "summary": "string",
  "days": [
    {
      "day": 1,
      "title": "string",
      "stops": [
        {
          "name": "Exact place name",
          "timeSlot": "09:00 or Morning",
          "description": "string",
          "category": "food",
          "estimatedDuration": "1-2 hours"
        }
      ]
    }
  ]
}`;
}

export function parseItineraryFromText(text: string): TripItinerary {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as TripItinerary;
  } catch {
    // fall through
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim()) as TripItinerary;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1)) as TripItinerary;
  }

  throw new Error("Failed to parse itinerary JSON from Gemini.");
}

export function parseGroundingChunks(
  groundingMetadata: unknown
): GroundingChunk[] {
  if (!groundingMetadata || typeof groundingMetadata !== "object") {
    return [];
  }

  const chunks = (groundingMetadata as { groundingChunks?: unknown[] })
    .groundingChunks;
  if (!Array.isArray(chunks)) {
    return [];
  }

  return chunks
    .map((chunk) => {
      if (!chunk || typeof chunk !== "object") return null;
      const maps = (chunk as { maps?: Record<string, string> }).maps;
      if (!maps?.placeId || !maps?.title) return null;
      return {
        placeId: maps.placeId,
        title: maps.title,
        uri: maps.uri ?? "",
      };
    })
    .filter((chunk): chunk is GroundingChunk => chunk !== null);
}

export async function planTripWithGemini(
  request: TripRequest
): Promise<{ itinerary: TripItinerary; groundingChunks: GroundingChunk[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Copy .env.local.example to .env.local and add your key."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(request);

  // Maps grounding cannot be combined with responseMimeType: application/json
  const config: Record<string, unknown> = {
    tools: [{ googleMaps: {} }],
  };

  if (request.destinationLat != null && request.destinationLng != null) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: request.destinationLat,
          longitude: request.destinationLng,
        },
      },
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config,
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const itinerary = parseItineraryFromText(text);

  const candidate = response.candidates?.[0];
  const groundingChunks = parseGroundingChunks(candidate?.groundingMetadata);

  return { itinerary, groundingChunks };
}
