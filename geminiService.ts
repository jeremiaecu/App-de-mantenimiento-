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
// -------------------------------
// EXTRAER DATOS DE UNA OT CON GEMINI
// -------------------------------
export async function extractWorkOrderDataFromBase64(imageBase64: string)
 {
  const prompt = `
Eres un analista de órdenes de trabajo. A partir de la imagen proporcionada,
extrae los siguientes datos:

- Número de OT
- Tipo de OT (Preventiva o Correctiva)
- Fecha mínima de cumplimiento o fecha de creación
- Descripción si existe

Entrega el resultado exclusivamente en JSON con este formato:

{
  "numero_ot": "",
  "tipo_ot": "",
  "fecha": "",
  "descripcion": ""
}
`;

  const client = createClient();
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    prompt,
    { inline_data: { data: imageBase64, mime_type: "image/jpeg" } }
  ]);

  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    console.warn("La respuesta no fue JSON válido:", text);
    return null;
  }
// -------------------------------------------
// EXTRAER DATOS UNIVERSAL (IMÁGENES o PDF)
// -------------------------------------------
export async function extractWorkOrderData(file: File) {
  try {
    const client = createClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fileBytes = await file.arrayBuffer();

    const prompt = `
      Eres un sistema que extrae datos de Órdenes de Trabajo.
      Devuelve únicamente JSON estricto con este formato:

      {
        "numero_ot": "",
        "tipo_ot": "",
        "fecha": "",
        "descripcion": ""
      }

      Si un dato no existe, déjalo vacío.
    `;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.type,
                data: Buffer.from(fileBytes).toString("base64")
              }
            }
          ]
        }
      ]
    });

    const text = result.response.text();
    return JSON.parse(text);

  } catch (err) {
    console.error("Error en extractWorkOrderData(file):", err);
    return null;
  }
}

}
// -------------------------------
// CHAT GENERAL PARA EL ASISTENTE
// -------------------------------
export async function chatWithAI(message: string, history: any[] = []) {
  try {
    const client = createClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [
        ...history,
        {
          role: "user",
          parts: [{ text: message }]
        }
      ]
    });

    return result.response.text();
  } catch (error: any) {
    console.error("Error en chatWithAI:", error);
    throw error;
  }
}
