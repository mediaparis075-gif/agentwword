
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Sender } from "../types";

const SYSTEM_INSTRUCTION = `Tu es un assistant expert de WordPress et WooCommerce. Ton but est d'aider l'utilisateur à gérer son site en manipulant les catégories de produits.
Commandes disponibles:
- Lister les catégories de produits.
- Afficher les métadonnées d'une catégorie [nom]. (Inclut la description, le slug, le titre SEO, la méta-description et l'expression-clé principale de Yoast SEO).
- Renommer la catégorie [ancien nom] en [nouveau nom].
- Modifier la description de la catégorie [nom] par "[nouvelle description]".
- Modifier le slug de la catégorie [nom] par "[nouveau-slug]".
- Modifier le titre SEO Yoast de la catégorie [nom] par "[nouveau titre]".
- Modifier la méta-description Yoast de la catégorie [nom] par "[nouvelle description]".
- Modifier l'expression-clé principale Yoast de la catégorie [nom] par "[nouvelle expression]".

Quand une action de gestion est demandée, réponds UNIQUEMENT avec un objet JSON. Ne fournis aucune explication. Les actions peuvent être combinées.
Exemples de réponses JSON:
- Pour "Lister toutes les catégories de produits": {"action": "LIST_CATEGORIES"}
- Pour "Affiche les métadonnées de 'Chaussures'": {"action": "GET_CATEGORY_METADATA", "payload": {"categoryName": "Chaussures"}}
- Pour "Modifie la meta description de 'Pantalons' par 'Les meilleurs pantalons pour toutes les occasions.'": {"action": "UPDATE_CATEGORY_METADATA", "payload": {"categoryName": "Pantalons", "metaDescription": "Les meilleurs pantalons pour toutes les occasions."}}
- Pour "Change le titre SEO de 'T-shirts' en 'T-shirts Uniques & Originaux'": {"action": "UPDATE_CATEGORY_METADATA", "payload": {"categoryName": "T-shirts", "metaTitle": "T-shirts Uniques & Originaux"}}
- Pour "Renomme la catégorie 'Accessoires' en 'Bijoux et Accessoires'": {"action": "UPDATE_CATEGORY_METADATA", "payload": {"categoryName": "Accessoires", "name": "Bijoux et Accessoires"}}
- Pour "Change le slug de 'Sacs' en 'sacs-a-main-cuir'": {"action": "UPDATE_CATEGORY_METADATA", "payload": {"categoryName": "Sacs", "slug": "sacs-a-main-cuir"}}
- Pour "Change l'expression clé de 'Sacs' en 'sacs de luxe'": {"action": "UPDATE_CATEGORY_METADATA", "payload": {"categoryName": "Sacs", "focusKeyphrase": "sacs de luxe"}}
- Pour une commande combinée comme "Change le nom de 'Sacs' en 'Sacs à main', le slug en 'sacs-a-main' et mets la description 'Découvrez notre nouvelle collection.'": {"action": "UPDATE_CATEGORY_METADATA", "payload": {"categoryName": "Sacs", "name": "Sacs à main", "slug": "sacs-a-main", "description": "Découvrez notre nouvelle collection."}}

Si l'utilisateur pose une question générale ou discute, réponds naturellement en français.
`;

// FIX: As per guidelines, the GoogleGenAI instance should be initialized with an API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });


// FIX: The API key parameter has been removed. The function now uses the pre-configured `ai` instance.
export const validateGeminiApiKey = async (): Promise<boolean> => {
  if (!process.env.API_KEY) {
    console.error("Gemini API key (API_KEY) is not set in environment variables.");
    return false;
  }
  try {
    // A simple, low-cost call to check if the key is valid.
    // FIX: Updated model from deprecated 'gemini-pro' to 'gemini-2.5-flash' as per guidelines.
    // FIX: Simplified the 'contents' for a simple text prompt.
    await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: 'test'
    });
    return true;
  } catch (error) {
    console.error("Gemini API key validation failed:", error);
    return false;
  }
};


// FIX: The API key parameter has been removed. The function now uses the pre-configured `ai` instance.
export const getGeminiResponse = async (
    prompt: string,
    history: Message[]
): Promise<string> => {

    const contents = [
        ...history.map(msg => ({
            role: msg.sender === Sender.User ? 'user' : 'model',
            parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
    ];
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    
    // Using response.text as per the new guidelines
    const responseText = response.text;

    if (!responseText) {
        throw new Error("Received an empty response from Gemini API.");
    }
    
    // The API might wrap JSON in markdown, so we extract it.
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1].trim();
    }

    return responseText.trim();
};
