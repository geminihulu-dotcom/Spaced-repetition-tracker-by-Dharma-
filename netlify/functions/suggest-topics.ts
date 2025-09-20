import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { subject } = JSON.parse(event.body || '{}');
    if (!subject) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Subject is required.' }) 
      };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not set in Netlify function environment.");
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'API key is not configured on the server.' }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down the broad subject "${subject}" into a list of smaller, specific topics suitable for spaced repetition learning. Each topic should be a concise, actionable item for a flashcard or a single study session. Provide around 10-15 topics.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'A specific, learnable topic.',
              },
              description: 'A list of suggested topics for learning.'
            },
          },
          required: ['topics'],
        },
      },
    });

    const jsonString = response.text.trim();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonString,
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An internal server error occurred.", details: errorMessage }),
    };
  }
};

export { handler };
