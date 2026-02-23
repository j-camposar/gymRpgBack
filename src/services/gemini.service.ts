import { GoogleGenerativeAI } from "@google/generative-ai";

// Si el .env sigue dando problemas, pégala aquí para probar
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY );

export async function analyzeBiometrics(imgSrc: string) {
  try {
    // Usamos el modelo 1.5-flash que es el estándar de oro para velocidad y visión gratuita
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const prompt = `Analiza la composición corporal en la imagen. 
        SI NO VES EL CUERPO COMPLETO, responde: {"error": "Por favor, encuadra tu cuerpo en la silueta neón"}. 
        SI VES EL CUERPO, estima % grasa y % músculo. Responde solo JSON: {"bodyFat": 0, "muscleMass": 0}`;

    // Extraemos solo la data del base64
    const base64Data = imgSrc.includes(",") 
      ? imgSrc.split(",")[1] 
      : imgSrc;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Limpiamos posibles etiquetas markdown
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error("DEBUG ARCA - Error Completo:", error);
    // Si el error contiene 404, imprimimos la configuración para depurar
    if (error.message?.includes("404")) {
      console.warn("El modelo no fue encontrado. Revisa si la API Key tiene habilitado Gemini 1.5 en la consola.");
    }
    throw error;
  }
}

export async function analyzeEats(imgSrc: string) {
  try {
    // Usamos el modelo 1.5-flash que es el estándar de oro para velocidad y visión gratuita
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const prompt = `Actúa como un experto en nutrición deportiva. 
    Analiza la imagen de la comida y extrae la mayor cantidad de información posible.
    Si no hay comida clara, responde: {"error": "No se detecta alimento"}.

    Si hay comida, devuelve ESTRICTAMENTE un objeto JSON con esta estructura:
    {
    "alimento": "Nombre del plato",
    "ingredientes_detectados": ["ingrediente1", "ingrediente2"],
    "porcion_estimada_gramos": 0,
    "macros": {
        "calorias": 0,
        "proteinas_g": 0,
        "carbohidratos_g": 0,
        "grasas_g": 0,
        "fibra_g": 0
    },
    "micro_nutrientes": {
        "vitaminas_destacadas": [],
        "minerales": []
    },
    "indice_glucemico": "Bajo/Medio/Alto",
    "analisis_fitness": "Breve comentario sobre si ayuda a la hipertrofia o pérdida de grasa",
    "confianza_analisis": 0.95
    }
    Solo devuelve el JSON, sin texto adicional.`;

    // Extraemos solo la data del base64
    const base64Data = imgSrc.includes(",") 
      ? imgSrc.split(",")[1] 
      : imgSrc;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Limpiamos posibles etiquetas markdown
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error("DEBUG ARCA - Error Completo:", error);
    // Si el error contiene 404, imprimimos la configuración para depurar
    if (error.message?.includes("404")) {
      console.warn("El modelo no fue encontrado. Revisa si la API Key tiene habilitado Gemini 1.5 en la consola.");
    }
    throw error;
  }
}
