const TAXONOMY = [
    "Water & Sanitation",
    "Urban Infrastructure",
    "Healthcare",
    "Education",
    "Agriculture",
    "Environment",
    "Public Safety",
    "Energy",
    "Accessibility",
    "Governance",
  ];
  
  const SKILLS = [
    "Civil Engineering",
    "Environmental Engineering",
    "Computer Science",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Chemical Engineering",
    "Biotechnology",
    "Public Health",
    "Agriculture",
    "Hydrology",
    "GIS Mapping",
    "Data Science",
    "Urban Planning",
    "Structural Engineering",
    "Water Treatment",
    "Renewable Energy",
    "Robotics",
    "IoT",
    "Machine Learning",
    "Social Work",
  ];
  
  export async function extractChallengeInfo(title: string, description: string) {
    const apiKey = process.env.OPENAI_API_KEY;
  
    if (!apiKey) {
      console.log("No OpenAI API key found, using fallback");
      return getFallbackAnalysis(title, description);
    }
  
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an expert at analyzing societal challenges. Extract structured information from the challenge description.
  
  RULES:
  - domain must be one of: ${TAXONOMY.join(", ")}
  - urgency must be one of: low, medium, high, critical
  - required_skills must be from this list: ${SKILLS.join(", ")}
  - confidence must be between 0 and 1
  - summary must be 1-2 sentences
  - affected_groups should be specific groups of people
  - estimated_affected_count should be a reasonable number
  
  Return ONLY valid JSON with these exact keys:
  {
    "domain": "",
    "subdomain": "",
    "urgency": "",
    "affected_groups": [],
    "estimated_affected_count": 0,
    "required_skills": [],
    "summary": "",
    "confidence": 0.0
  }`,
            },
            {
              role: "user",
              content: `Title: ${title}\nDescription: ${description}`,
            },
          ],
          temperature: 0.3,
        }),
      });
  
      if (!response.ok) {
        console.log("OpenAI API error:", response.status);
        return getFallbackAnalysis(title, description);
      }
  
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
  
      if (!content) {
        return getFallbackAnalysis(title, description);
      }
  
      const parsed = JSON.parse(content);
  
      return {
        domain: parsed.domain || "Other",
        subdomain: parsed.subdomain || "",
        urgency: parsed.urgency || "medium",
        affected_groups: parsed.affected_groups || [],
        estimated_affected_count: parsed.estimated_affected_count || 0,
        required_skills: parsed.required_skills || [],
        summary: parsed.summary || "",
        confidence: parsed.confidence || 0.7,
      };
    } catch (error) {
      console.log("AI extraction failed:", error);
      return getFallbackAnalysis(title, description);
    }
  }
  
  function getFallbackAnalysis(title: string, description: string) {
    const lower = (title + " " + description).toLowerCase();
  
    let domain = "Other";
    if (lower.includes("water") || lower.includes("drain") || lower.includes("flood")) {
      domain = "Water & Sanitation";
    } else if (lower.includes("road") || lower.includes("bridge") || lower.includes("building")) {
      domain = "Urban Infrastructure";
    } else if (lower.includes("health") || lower.includes("hospital") || lower.includes("disease")) {
      domain = "Healthcare";
    } else if (lower.includes("school") || lower.includes("education") || lower.includes("student")) {
      domain = "Education";
    } else if (lower.includes("farm") || lower.includes("crop") || lower.includes("soil")) {
      domain = "Agriculture";
    }
  
    return {
      domain,
      subdomain: "General",
      urgency: "medium",
      affected_groups: ["Local community"],
      estimated_affected_count: 500,
      required_skills: ["Civil Engineering", "Environmental Engineering"],
      summary: `Societal challenge related to ${domain.toLowerCase()} requiring expert attention.`,
      confidence: 0.5,
    };
  }