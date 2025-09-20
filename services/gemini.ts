export const suggestTopics = async (subject: string): Promise<string[]> => {
  try {
    const response = await fetch('/.netlify/functions/suggest-topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from server.' }));
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result && Array.isArray(result.topics)) {
        return result.topics;
    }
    
    console.warn("Could not parse topics from backend response:", result);
    return [];

  } catch (error) {
    console.error("Error suggesting topics:", error);
    if (error instanceof Error) {
        throw new Error(`Could not generate topics. ${error.message}`);
    }
    throw new Error("Could not generate topics. Please check the subject or try again later.");
  }
};
