import { GoogleGenAI, Type } from "@google/genai";
import { User } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface RankedUser extends User {
  compatibilityScore: number;
  rankingReason: string;
}

export const rankCandidates = async (
  currentUser: User,
  candidates: User[]
): Promise<RankedUser[]> => {
  if (!apiKey) {
    console.warn("Gemini API key missing, skipping AI ranking.");
    return candidates.map(c => ({ ...c, compatibilityScore: 0, rankingReason: "AI ranking unavailable" }));
  }

  const prompt = `
    Rank the following sports candidates for the current user based on:
    1. Proximity: Distance within 3km is preferred.
    2. Status: Prioritize location_mode: "live".
    3. Attributes: Match preferred sports and skill level.
    
    Current User: ${JSON.stringify({
      preferredSports: currentUser.preferredSports,
      skillLevel: currentUser.skillLevel,
      location: currentUser.locationMode === 'live' ? 'Live' : 'Static'
    })}

    Candidates: ${JSON.stringify(candidates.map(c => ({
      uid: c.uid,
      displayName: c.displayName,
      preferredSports: c.preferredSports,
      skillLevel: c.skillLevel,
      locationMode: c.locationMode,
      isVisible: c.isVisible
    })))}

    Return a structured JSON array of objects with 'uid', 'compatibilityScore' (0-100), and 'rankingReason'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              uid: { type: Type.STRING },
              compatibilityScore: { type: Type.NUMBER },
              rankingReason: { type: Type.STRING }
            },
            required: ["uid", "compatibilityScore", "rankingReason"]
          }
        }
      }
    });

    const rankedData = JSON.parse(response.text || "[]");
    
    return candidates.map(candidate => {
      const rank = rankedData.find((r: any) => r.uid === candidate.uid);
      return {
        ...candidate,
        compatibilityScore: rank?.compatibilityScore || 0,
        rankingReason: rank?.rankingReason || "No specific reason provided"
      };
    }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  } catch (error) {
    console.error("Gemini ranking error:", error);
    return candidates.map(c => ({ ...c, compatibilityScore: 0, rankingReason: "Ranking failed" }));
  }
};
