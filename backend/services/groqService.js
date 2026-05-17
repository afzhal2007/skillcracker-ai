const Groq = require("groq-sdk");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const defaultModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

async function evaluateWithGroq(prompt) {
  console.log("Groq service started");
  console.log("Using model:", process.env.GROQ_MODEL || "openai/gpt-oss-120b");
  console.log("API key available:", !!process.env.GROQ_API_KEY);
  try {
    const response = await client.chat.completions.create({
      model: defaultModel,
      messages: [
        {
          role: "system",
          content: "You are SkillCracker AI, an interview answer evaluator. Return only valid JSON. Do not use markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const text = extractResponseText(response);
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("========== GROQ JSON PARSE ERROR ==========");
      console.error("Raw content:", text);
      console.error("Parse error:", parseError.message);
      console.error("==========================================");
      return {
        ok: false,
        isValid: false,
        isRelevant: false,
        completed: false,
        score: 0,
        message: "AI response format error. Please try again.",
      };
    }
  } catch (error) {
    console.error("========== GROQ API ERROR ==========");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Status:", error.status);
    console.error("Name:", error.name);
    console.error("Error object:", error.error);
    console.error("Response data:", error.response?.data);
    console.error("===================================");
    return {
      ok: false,
      isValid: false,
      isRelevant: false,
      completed: false,
      score: 0,
      message: error.message || "AI evaluation temporarily unavailable. Please try again.",
    };
  }
}

async function generateQuestionWithGroq(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: defaultModel,
      messages: [
        {
          role: "system",
          content: "You are SkillCracker AI. Generate fresher-friendly interview questions. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const text = extractResponseText(response);
    try {
      return JSON.parse(text);
    } catch (parseError) {
      return {
        ok: false,
        message: "AI question format error. Please try again.",
      };
    }
  } catch (error) {
    console.error("Groq API Error Full:", error);
    console.error("Groq API Error Message:", error.message);
    console.error("Groq API Error Status:", error.status);
    console.error("Groq API Error Response:", error.response?.data || error.error || "");
    return {
      ok: false,
      message: error.message || "AI question generation temporarily unavailable.",
    };
  }
}

function extractResponseText(response) {
  if (!response) return "";

  if (typeof response === "string") {
    return response;
  }

  if (response.output_text) {
    return String(response.output_text);
  }

  if (response.choices && Array.isArray(response.choices) && response.choices[0]) {
    const content = response.choices[0].message || response.choices[0].text;
    if (typeof content === "string") {
      return content;
    }
    if (content && typeof content.content === "string") {
      return content.content;
    }
  }

  return JSON.stringify(response);
}

module.exports = {
  evaluateWithGroq,
  generateQuestionWithGroq,
};
