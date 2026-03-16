export const getGeminiAnalysis = async (biteName: string, confidence: number, token?: string): Promise<string> => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers,
      body: JSON.stringify({ biteName, confidence }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get analysis from server.");
    }

    const data = await response.json();
    return data.text || "Unable to generate detailed analysis at this time.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "The expert analysis service is currently unavailable. Please refer to the general medical insights below.";
  }
};
