import { NextResponse } from "next/server"
import { evaluationQuestions, systemPrompt } from "@/lib/evaluation-questions"
import { generateEvaluation, parseClaudeResponse } from "@/lib/claude-api"
import { logger } from "@/lib/utils"

// Environment variable for Claude API key
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "";

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { studentDetails, projectDetails } = data

    // Check if API key is available
    if (!CLAUDE_API_KEY) {
      logger.error("Claude API key not found. Cannot proceed with evaluation.")
      return NextResponse.json(
        { error: "API key not configured. Please set up your Claude API key." },
        { status: 401 }
      )
    }

    // Call Claude API for evaluation
    const claudeResponse = await generateEvaluation(
      projectDetails,
      evaluationQuestions,
      systemPrompt,
      CLAUDE_API_KEY
    )

    if (claudeResponse.error) {
      logger.error("Error from Claude API:", claudeResponse.error)
      return NextResponse.json(
        { error: "Failed to get evaluation from Claude API. Please try again later." },
        { status: 503 }
      )
    }

    // Parse Claude's response into structured data
    const evaluation = parseClaudeResponse(claudeResponse.content)

    return NextResponse.json({ evaluation })
  } catch (error) {
    logger.error("Error evaluating project:", error)
    return NextResponse.json({ error: "Failed to evaluate project" }, { status: 500 })
  }
}
