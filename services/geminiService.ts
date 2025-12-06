
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, Member, Event } from "../types";

const initGenAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateMinistryInsight = async (
  members: Member[],
  events: Event[],
  attendance: AttendanceRecord[]
): Promise<string> => {
  const ai = initGenAI();
  if (!ai) return "Gemini API Key is missing. Please configure your environment.";

  // Prepare data for the prompt (anonymized/aggregated for privacy best practices in a real app, strict JSON here)
  const dataSummary = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.status === 'active').length,
    recentEvents: events.slice(-3).map(e => ({
      name: e.name,
      date: e.date,
      attendanceCount: attendance.filter(a => a.eventId === e.id).length
    }))
  };

  const prompt = `
    Analyze the following church attendance data summary:
    ${JSON.stringify(dataSummary, null, 2)}

    Provide a short, encouraging, and strategic insight for the Pastor. 
    Focus on trends (growth or decline) and suggest one actionable step to improve engagement.
    Keep it under 100 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate insights.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI service.";
  }
};

export const generateEventDescription = async (
  eventName: string,
  eventType: string,
  eventDate: string,
  eventLocation: string
): Promise<string> => {
  const ai = initGenAI();
  if (!ai) return "";

  const prompt = `
    Write a short, inviting, and warm description (max 2 sentences) for a church event.
    
    Event Details:
    Name: ${eventName}
    Type: ${eventType}
    Date: ${eventDate}
    Location: ${eventLocation}

    The tone should be welcoming to both members and new guests.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};
