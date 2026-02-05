import { FEEDBACK_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const { conversation } = await req.json();

    if (!conversation || conversation.length === 0) {
      return NextResponse.json(
        { error: "No conversation data provided" },
        { status: 400 },
      );
    }

    const FINAL_PROMPT = FEEDBACK_PROMPT.replace(
      "{{conversation}}",
      JSON.stringify(conversation),
    );

    console.log("Generating feedback for conversation...");

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.3-8b-instruct:free",
      messages: [{ role: "user", content: FINAL_PROMPT }],
    });

    console.log("API Response received");

    if (completion.choices && completion.choices.length > 0) {
      let content = completion.choices[0].message.content;

      // Remove <think> tags if present (DeepSeek sometimes includes these)
      if (content.includes("<think>")) {
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      }

      return NextResponse.json(content);
    } else {
      return NextResponse.json(
        { error: "No response from AI model." },
        { status: 500 },
      );
    }
  } catch (e) {
    console.error("Feedback API Error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to generate feedback" },
      { status: 500 },
    );
  }
}
