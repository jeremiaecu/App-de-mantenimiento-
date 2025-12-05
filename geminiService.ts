import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEYS = [
  import.meta.env.VITE_API_KEY_1,
  import.meta.env.VITE_API_KEY_2
];

let currentKeyIndex = 0;

function createClient() {
  return new GoogleGenerativeAI({
    apiKey: API_KEYS[currentKeyIndex],
  });
}

export async function generateResponse(prompt: string) {
  try {
    const client = createClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    // Si la API KEY se quedó sin cuota
    if (
      error.message &&
      error.message.toLowerCase().includes("quota") &&
      currentKeyIndex < API_KEYS.length - 1
    ) {
      console.warn("API Key agotada. Cambiando a la siguiente...");
      currentKeyIndex++;
      return generateResponse(prompt); // reintentar automáticamente
    }

    console.error("Error en Gemini:", error);
    throw error;
  }
}
