import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. ROTACIÓN DE API KEYS ---
const apiKeys = [
  import.meta.env.VITE_API_KEY_1,
  import.meta.env.VITE_API_KEY_2
];

function getRandomApiKey() {
  return apiKeys[Math.floor(Math.random() * apiKeys.length)];
}

// --- 2. FUNCIÓN PARA CREAR INSTANCIA GEMINI ---
function getGenAI() {
  return new GoogleGenerativeAI(getRandomApiKey());
}

// -------------------------
// EXTRACCIÓN DE DATOS DE OT
// -------------------------
export async function extractWorkOrderData(file: File) {
  try {
    console.log("🔍 Procesando archivo para extracción de datos...");

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

    const base64Content = base64Data.split(',')[1];
    const mimeType =
      file.type === "application/pdf"
        ? "application/pdf"
        : "image/jpeg";

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analiza este documento de Orden de Trabajo y extrae:

      {
        "numero_ot": "",
        "tipo_ot": "",
        "nombre_equipo": "",
        "codigo_activo": "",
        "tecnico_asignado": ""
      }

      Responde SOLO JSON válido.
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Content, mimeType } }
    ]);

    const response = await result.response;
    const text = response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(text);

  } catch (error) {
    console.error("❌ Error en Gemini:", error);
    return {
      numero_ot: "",
      tipo_ot: "",
      nombre_equipo: "",
      codigo_activo: "",
      tecnico_asignado: ""
    };
  }
}

// -------------------------
// CHAT GENERAL
// -------------------------
export async function chatWithAI(message: string, history: any[]) {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: (history || []).map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }]
      }))
    });

    const result = await chat.sendMessage(message);
    return result.response.text();

  } catch (error) {
    console.error("❌ Error en el chat:", error);
    return "Ocurrió un problema al procesar tu mensaje.";
  }
}
