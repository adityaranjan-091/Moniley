import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Initialize genai client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
    try {
        const { text, type, userId } = await req.json();

        if (!text || !type || !userId) {
            return NextResponse.json({ success: false, message: "Missing text, type or userId." }, { status: 400 });
        }

        // Fetch user's categories for the given type
        const client = await clientPromise;
        const db = client.db();
        const categories = await db.collection("categories").find({ userId, type }).toArray();

        // Pluck the names
        const categoryNames = categories.length > 0 ? categories.map(c => c.name) : [];
        const categoriesText = categoryNames.length > 0 ? categoryNames.join(", ") : "None configured yet.";

        // Format prompt for Gemini
        const prompt = `You are a financial categorizer.
Analyze this user input describing a transaction: "${text}"
The transaction type is: "${type}".
The available categories the user has configured are: ${categoriesText}.

Extract the relevant information and return a strict JSON object with these keys:
- "amount": Number representing the parsed amount. Return 0 if not found. Do not include currency symbols.
- "description": A short cleaned-up description of the transaction (e.g. "Pizza" instead of "Bought 3 pizzas").
- "category": Assign the closest matching category from the available categories list. If none fit perfectly, invent a new, logical, short category name (e.g., "Transportation", "Dining Out", "Freelance"). Do NOT use "Uncategorized". Ensure the format is Title Case.
- "date": The date mentioned or implied, in YYYY-MM-DD format. If no date is mentioned, use today's date (${new Date().toISOString().slice(0, 10)}).

Ensure your response is valid JSON and nothing else. Do not use markdown wrappers.`;

        // Call Gemini API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        if (response.text) {
            let resultData;
            try {
                resultData = JSON.parse(response.text);
            } catch (e) {
                console.error("Gemini parse err. Text:", response.text);
                return NextResponse.json({ success: false, message: "Failed to parse API response" }, { status: 500 });
            }
            return NextResponse.json({ success: true, data: resultData }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, message: "No response from Gemini API" }, { status: 500 });
        }
    } catch (error) {
        console.error("Gemini categorizer error:", error);
        return NextResponse.json({ success: false, message: "Server error calling Gemini. Make sure GEMINI_API_KEY is configured." }, { status: 500 });
    }
}
