export async function generateEmbedding(text: string): Promise<number[] | null> {
    const apiKey = process.env.OPENAI_API_KEY;
  
    if (!apiKey) {
      console.log("No OpenAI API key, skipping embedding");
      return null;
    }
  
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text.slice(0, 8000),
        }),
      });
  
      if (!response.ok) {
        console.log("Embedding API error:", response.status);
        return null;
      }
  
      const data = await response.json();
      return data.data?.[0]?.embedding || null;
    } catch (error) {
      console.log("Embedding failed:", error);
      return null;
    }
  }