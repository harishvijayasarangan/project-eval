// Claude API integration

import { logger } from "./utils";

interface ClaudeResponse {
  content: string;
  error?: string;
}

interface EvaluationSection {
  title: string;
  feedback: string;
  score: number | null;
}

interface EvaluationResult {
  problemStatement: EvaluationSection;
  abstract: EvaluationSection;
  introduction: EvaluationSection;
  objectives: EvaluationSection;
  methodology: EvaluationSection;
  timeline: EvaluationSection;
  expectedOutcome: EvaluationSection;
  budget: EvaluationSection;
  overall: EvaluationSection;
  [key: string]: EvaluationSection; // Index signature for string keys
}

export async function generateEvaluation(
  projectDetails: Record<string, string>,
  questions: Record<string, string[]>,
  systemPrompt: string,
  apiKey: string
): Promise<ClaudeResponse> {
  try {
    // Start timer
    const startTime = performance.now();
    logger.info("Starting Claude API evaluation");
    
    // Prepare the messages for Claude API - using system parameter at top level
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: generatePrompt(projectDetails, questions),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // End timer and log duration
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    logger.info(`Claude API evaluation completed in ${duration.toFixed(2)} seconds`);
    
    return { content: data.content[0].text };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error calling Claude API:", errorMessage);
    return { content: "", error: errorMessage };
  }
}

// Generate the prompt for Claude with project details and questions
function generatePrompt(
  projectDetails: Record<string, string>,
  questions: Record<string, string[]>
): string {
  let prompt = `# Project Evaluation Request\n\nPlease evaluate the following project based on the provided details and answer the specific questions for each section.\n\n`;

  // Add project details
  prompt += `## Project Details\n\n`;
  
  for (const [section, content] of Object.entries(projectDetails)) {
    // Format section name for display (e.g., problemStatement -> Problem Statement)
    const formattedSection = section
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
      
    prompt += `### ${formattedSection}\n${content}\n\n`;
  }

  // Add questions for each section
  prompt += `## Evaluation Questions\n\nPlease answer the following questions for each section and provide a score (0-100) and summary evaluation.\n\n`;
  
  for (const [section, sectionQuestions] of Object.entries(questions)) {
    // Format section name for display
    const formattedSection = section
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
      
    prompt += `### ${formattedSection}\n`;
    
    sectionQuestions.forEach((question, index) => {
      prompt += `${index + 1}. ${question}\n`;
    });
    
    prompt += `\nPlease provide a summary evaluation and score (0-100) for this section.\n\n`;
  }

  prompt += `## Overall Assessment\n\nFinally, please provide an overall assessment of the entire project, highlighting key strengths and areas for improvement, and assign an overall score (0-100).\n`;

  return prompt;
}

// Parse Claude's response into structured evaluation data
export function parseClaudeResponse(response: string): EvaluationResult {
  // Default feedback for sections with no content
  const defaultFeedback = "1. This section requires more detailed information.\nThe content provided was insufficient for a complete evaluation.\n\n2. Consider adding specific details relevant to this section.\nA comprehensive project proposal should include this information.\n\n3. Refer to project guidelines for requirements.\nFollow the structure outlined in the submission guidelines.\n\n4. This section is essential for project approval.\nWithout this information, the project cannot be properly evaluated.\n\n5. Resubmit with complete information.\nPlease provide the necessary details for a thorough evaluation.";

  // Initialize with default values to ensure all sections exist
  const sections: EvaluationResult = {
    problemStatement: { title: "Problem Statement", feedback: defaultFeedback, score: 0 },
    abstract: { title: "Abstract/Summary", feedback: defaultFeedback, score: 0 },
    introduction: { title: "Introduction/Background", feedback: defaultFeedback, score: 0 },
    objectives: { title: "Objectives", feedback: defaultFeedback, score: 0 },
    methodology: { title: "Methodology", feedback: defaultFeedback, score: 0 },
    timeline: { title: "Timeline", feedback: defaultFeedback, score: 0 },
    expectedOutcome: { title: "Expected Outcome", feedback: defaultFeedback, score: 0 },
    budget: { title: "Budget", feedback: defaultFeedback, score: 0 },
    overall: { title: "Overall Assessment", feedback: "This project submission is incomplete and requires significant additional information across all sections. Please review the feedback for each section and resubmit with more comprehensive details.", score: 0 }
  };
  
  // Regular expressions to extract information
  const sectionRegex = /### ([\w\s\/]+)\n([\s\S]*?)(?=### |## |$)/g;
  const scoreRegex = /Section Score:\s*(\d+)/i;
  // For scores that might be formatted with just the number (e.g., "20/100")
  const alternativeScoreRegex = /(\d+)\/100/i;
  // Using [\s\S] instead of dot with 's' flag for cross-browser compatibility
  const questionRegex = /Question:\s*([\s\S]+?)\nAnswer:\s*([\s\S]+?)(?=\n\s*Question:|\nSection Score:|$)/g;
  
  // For direct extraction of specific sections if they are problematic
  const problemStatementRegex = /### Problem Statement[\s\S]*?(?=### |## |$)/i;
  const expectedOutcomeRegex = /### Expected Outcome[\s\S]*?(?=### |## |$)/i;
  
  // Try to directly extract Problem Statement section
  const problemStatementMatch = response.match(problemStatementRegex);
  if (problemStatementMatch) {
    const content = problemStatementMatch[0];
    const scoreMatch = content.match(scoreRegex) || content.match(alternativeScoreRegex);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1], 10);
      // Extract feedback and format it
      let formattedFeedback = "";
      const questionMatches = Array.from(content.matchAll(/Question:\s*([\s\S]+?)\nAnswer:\s*([\s\S]+?)(?=\n\s*Question:|\nSection Score:|$)/g));
      
      if (questionMatches.length > 0) {
        questionMatches.forEach((match, index) => {
          const question = match[1].trim();
          const answer = match[2].trim();
          formattedFeedback += `${index + 1}. ${question}\n${answer}\n\n`;
        });
      } else {
        // If no question-answer pairs found, use the content after removing the header and score
        const cleanedContent = content
          .replace(/### Problem Statement/i, "")
          .replace(/Section Score:\s*\d+/i, "")
          .replace(/\d+\/100/i, "")
          .trim();
        formattedFeedback = cleanedContent || defaultFeedback;
      }
      
      sections.problemStatement = {
        title: "Problem Statement",
        feedback: formattedFeedback,
        score: score
      };
    }
  }
  
  // Try to directly extract Expected Outcome section
  const expectedOutcomeMatch = response.match(expectedOutcomeRegex);
  if (expectedOutcomeMatch) {
    const content = expectedOutcomeMatch[0];
    const scoreMatch = content.match(scoreRegex) || content.match(alternativeScoreRegex);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1], 10);
      // Extract feedback and format it
      let formattedFeedback = "";
      const questionMatches = Array.from(content.matchAll(/Question:\s*([\s\S]+?)\nAnswer:\s*([\s\S]+?)(?=\n\s*Question:|\nSection Score:|$)/g));
      
      if (questionMatches.length > 0) {
        questionMatches.forEach((match, index) => {
          const question = match[1].trim();
          const answer = match[2].trim();
          formattedFeedback += `${index + 1}. ${question}\n${answer}\n\n`;
        });
      } else {
        // If no question-answer pairs found, use the content after removing the header and score
        const cleanedContent = content
          .replace(/### Expected Outcome/i, "")
          .replace(/Section Score:\s*\d+/i, "")
          .replace(/\d+\/100/i, "")
          .trim();
        formattedFeedback = cleanedContent || defaultFeedback;
      }
      
      sections.expectedOutcome = {
        title: "Expected Outcome",
        feedback: formattedFeedback,
        score: score
      };
    }
  }
  
  let match;
  while ((match = sectionRegex.exec(response)) !== null) {
    const sectionTitle = match[1].trim();
    const sectionContent = match[2].trim();
    
    // Skip Problem Statement and Expected Outcome as they are handled separately
    if (sectionTitle === "Problem Statement" || sectionTitle === "Expected Outcome") {
      continue;
    }
    
    // Convert section title to camelCase key
    const sectionKey = sectionTitle
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\/.*$/, '')
      .replace(/^(.)/, (match) => match.toLowerCase());
    
    // Extract score if present
    const scoreMatch = sectionContent.match(scoreRegex) || sectionContent.match(alternativeScoreRegex);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0; // Default to 0 if no score
    
    // Extract all question-answer pairs
    let formattedFeedback = "";
    let questionMatch;
    const questionAnswerPairs = [];
    
    while ((questionMatch = questionRegex.exec(sectionContent)) !== null) {
      const question = questionMatch[1].trim();
      const answer = questionMatch[2].trim();
      questionAnswerPairs.push({ question, answer });
    }
    
    // Format the feedback with all questions and answers
    if (questionAnswerPairs.length > 0) {
      questionAnswerPairs.forEach((pair, index) => {
        formattedFeedback += `${index + 1}. ${pair.question}\n${pair.answer}\n\n`;
      });
    } else {
      // If no question-answer pairs found, use the entire section content
      formattedFeedback = sectionContent;
    }
    
    // Only update if we have actual content (non-empty feedback)
    if (formattedFeedback.trim() !== "") {
      // Store the section data if it's a valid section
      if (sectionKey in sections) {
        sections[sectionKey] = {
          title: sectionTitle,
          feedback: formattedFeedback,
          score: score
        };
      }
    }
  }
  
  // Extract overall assessment
  const overallRegex = /## Overall Assessment\n([\s\S]*)/;
  const overallMatch = response.match(overallRegex);
  
  if (overallMatch) {
    const overallContent = overallMatch[1].trim();
    const scoreMatch = overallContent.match(/Overall Score:\s*(\d+)/i) || overallContent.match(/(\d+)\/100/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0; // Default to 0 if no score
    
    // Only update if we have actual content
    if (overallContent !== "") {
      sections.overall = {
        title: 'Overall Assessment',
        feedback: overallContent,
        score: score
      };
    }
  }
  
  return sections;
}
