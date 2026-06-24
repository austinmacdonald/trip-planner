import { GoogleGenAI, Type } from "@google/genai";
import type { TripItinerary, TripRequest } from "./types";

const tripItinerarySchema = {
  type: Type.OBJECT,
  properties: {
    destination: { type: Type.STRING },
    durationDays: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          title: { type: Type.STRING },
          stops: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                timeSlot: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                estimatedDuration: { type: Type.STRING },
              },
              required: [
                "name",
                "timeSlot",
                "description",
                "category",
                "estimatedDuration",
              ],
            },
          },
        },
        required: ["day", "title", "stops"],
      },
    },
  },
  required: ["destination", "durationDays", "summary", "days"],
};

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
- Use exact, searchable place names (e.g. "Senso-ji Temple" not "a famous temple").
- Order stops chronologically within each day with realistic time slots.
- Include 3-5 stops per day depending on pace (${request.pace}).
- Match activities to the stated interests and budget level.
- Provide practical descriptions mentioning what to do and why it fits the trip.
- Categories must be one of: food, museum, landmark, nature, shopping, nightlife, activity, transport, other.`;
}

export async function planTripWithGemini(
  request: TripRequest
): Promise<TripItinerary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Copy .env.local.example to .env.local and add your key."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(request);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: tripItinerarySchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(text) as TripItinerary;
  } catch {
    throw new Error("Failed to parse itinerary JSON from Gemini.");
  }
}
