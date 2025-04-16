"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, FileText, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import EvaluationSection from "@/components/evaluation-section"
import { jsPDF } from "jspdf"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/utils"

// Define types for our data structure
interface StudentDetails {
  projectId: string;
  studentName: string;
  studentId: string;
  sapCode: string;
  collegeName: string;
  studentEmail: string;
  courseDepartment: string;
  supervisorName: string;
  supervisorEmail: string;
  [key: string]: string;
}

interface ProjectDetails {
  problemStatement: string;
  abstract: string;
  introduction: string;
  objectives: string;
  methodology: string;
  timeline: string;
  expectedOutcome: string;
  budget: string;
  [key: string]: string;
}

interface EvaluationSection {
  title: string;
  feedback: string;
  score: number | null;
}

interface Evaluation {
  overall: EvaluationSection;
  sections: {
    problemStatement: EvaluationSection;
    abstract: EvaluationSection;
    introduction: EvaluationSection;
    objectives: EvaluationSection;
    methodology: EvaluationSection;
    timeline: EvaluationSection;
    expectedOutcome: EvaluationSection;
    budget: EvaluationSection;
    [key: string]: EvaluationSection;
  };
}

interface EvaluationData {
  studentDetails: StudentDetails;
  projectDetails: ProjectDetails;
  evaluation: Evaluation;
  processingTime: number | null;
}

export default function ResultsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [data, setData] = useState<EvaluationData | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("evaluation")
  const [jsPdfLoaded, setJsPdfLoaded] = useState(false)

  // Load jsPDF dynamically on client side
  useEffect(() => {
    setJsPdfLoaded(true)
  }, [])

  useEffect(() => {
    // In a real implementation, this would be fetched from the server
    // For now, we'll retrieve it from localStorage
    const storedData = localStorage.getItem("evaluationResults")

    if (!storedData) {
      router.push("/submit")
      return
    }

    try {
      // Parse the stored data
      const parsedData = JSON.parse(storedData)
      
      // Ensure all evaluation sections have proper values
      if (parsedData.evaluation) {
        // Default feedback for sections with no content
        const defaultFeedback = "1. This section requires more detailed information.\nThe content provided was insufficient for a complete evaluation.\n\n2. Consider adding specific details relevant to this section.\nA comprehensive project proposal should include this information.\n\n3. Refer to project guidelines for requirements.\nFollow the structure outlined in the submission guidelines.\n\n4. This section is essential for project approval.\nWithout this information, the project cannot be properly evaluated.\n\n5. Resubmit with complete information.\nPlease provide the necessary details for a thorough evaluation.";

        // Ensure all required sections exist with proper values
        const requiredSections = [
          'problemStatement', 'abstract', 'introduction', 'objectives',
          'methodology', 'timeline', 'expectedOutcome', 'budget'
        ];

        // If sections object doesn't exist, create it
        if (!parsedData.evaluation.sections) {
          parsedData.evaluation.sections = {};
        }

        // Ensure each section exists with proper values
        requiredSections.forEach(sectionKey => {
          // Check if section exists directly in evaluation
          if (parsedData.evaluation[sectionKey] && 
              parsedData.evaluation[sectionKey].feedback && 
              parsedData.evaluation[sectionKey].score !== null) {
            // Copy to sections object if not already there
            if (!parsedData.evaluation.sections[sectionKey]) {
              parsedData.evaluation.sections[sectionKey] = parsedData.evaluation[sectionKey];
            }
          } 
          // Check if section exists in sections object
          else if (parsedData.evaluation.sections[sectionKey] && 
                   parsedData.evaluation.sections[sectionKey].feedback && 
                   parsedData.evaluation.sections[sectionKey].score !== null) {
            // Copy to main evaluation object if not already there
            if (!parsedData.evaluation[sectionKey]) {
              parsedData.evaluation[sectionKey] = parsedData.evaluation.sections[sectionKey];
            }
          }
          // If missing in both places, create with default values
          else {
            const title = sectionKey
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .replace(/([a-z])([A-Z])/g, '$1 $2');
              
            const newSection = {
              title: title,
              feedback: defaultFeedback,
              score: 0
            };
            
            parsedData.evaluation[sectionKey] = newSection;
            parsedData.evaluation.sections[sectionKey] = newSection;
          }
        });
      }

      // Extract processing time if available
      if (parsedData.processingTime) {
        setProcessingTime(parsedData.processingTime)
      }

      // Simulate loading time
      const timer = setTimeout(() => {
        setData(parsedData)
        setLoading(false)
      }, 1500)

      return () => clearTimeout(timer)
    } catch (error) {
      console.error("Error parsing stored data:", error);
      router.push("/submit");
    }
  }, [router])

  // Generate PDF using jsPDF
  const generatePDF = () => {
    if (!jsPdfLoaded || !data) {
      logger.error("PDF Generation Error", "PDF generator not loaded or data not available");
      toast({
        title: "PDF Generation Error",
        description: "PDF generator not loaded or data not available. Please try again.",
        variant: "destructive",
      })
      return false
    }

    try {
      logger.time("PDF Generation");
      logger.debug("Starting PDF generation", { studentId: data.studentDetails.studentId });
      
      const { studentDetails, projectDetails, evaluation } = data
      const doc = new jsPDF()
      let yPos = 20

      // Title
      doc.setFontSize(18)
      doc.text("Project Evaluation Report", 105, yPos, { align: "center" })
      yPos += 15

      // Student Details
      doc.setFontSize(14)
      doc.text("Student Information", 14, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.text(`Project ID: ${studentDetails.projectId || 'N/A'}`, 14, yPos)
      yPos += 6
      doc.text(`Student Name: ${studentDetails.studentName || 'N/A'}`, 14, yPos)
      yPos += 6
      doc.text(`College: ${studentDetails.collegeName || 'N/A'}`, 14, yPos)
      yPos += 15

      // Overall Assessment
      doc.setFontSize(14)
      doc.text("Evaluation Summary", 14, yPos)
      yPos += 10

      // Ensure we have the overall score
      const overallScore = evaluation.overall?.score ?? 0
      doc.setFontSize(10)
      doc.text(`Overall Score: ${overallScore}/100`, 14, yPos)
      yPos += 8

      // Overall feedback with text wrapping
      const overallFeedback = evaluation.overall?.feedback || "No overall feedback available."
      const splitOverallFeedback = doc.splitTextToSize(overallFeedback, 180)
      doc.text(splitOverallFeedback, 14, yPos)
      yPos += splitOverallFeedback.length * 5 + 10

      // Section Scores
      doc.setFontSize(14)
      doc.text("Section Scores", 14, yPos)
      yPos += 10

      // List all section scores
      doc.setFontSize(10)
      
      // Handle both direct sections and nested sections structure
      const sectionEntries = evaluation.sections 
        ? Object.entries(evaluation.sections) 
        : Object.entries(evaluation).filter(([key]) => key !== 'overall')
      
      sectionEntries.forEach(([key, section]) => {
        // Skip the 'overall' section as it's already handled
        if (key === 'overall' || key === 'sections') return;
        
        // Make sure section is an EvaluationSection object
        if (section && typeof section === 'object' && 'score' in section) {
          const title = section.title || key.charAt(0).toUpperCase() + key.slice(1);
          const score = section.score ?? 0;
          
          // Add a new page for each section to ensure enough space
          doc.addPage()
          yPos = 20
          
          // Section title and score
          doc.setFontSize(14)
          doc.text(`${title}: ${score}/100`, 14, yPos)
          yPos += 10
          
          // Parse and display all question-answer pairs
          doc.setFontSize(10)
          const feedbackText = section.feedback || "No feedback available.";
          
          // Split the feedback by numbered items (1., 2., etc.)
          const feedbackItems = feedbackText.split(/\d+\. /).filter((item: string) => item.trim());
          
          if (feedbackItems.length > 0) {
            feedbackItems.forEach((item: string, index: number) => {
              // Split each item into question and answer if possible
              const parts = item.split('\n');
              const question = parts[0]?.trim() || '';
              const answer = parts.slice(1).join('\n').trim();
              
              // Display question (bold)
              doc.setFont(undefined as any, 'bold');
              doc.text(`${index + 1}. ${question}`, 14, yPos);
              yPos += 6;
              
              // Display answer (normal)
              doc.setFont(undefined as any, 'normal');
              const answerLines = doc.splitTextToSize(answer, 180);
              doc.text(answerLines, 20, yPos);
              yPos += answerLines.length * 5 + 8;
              
              // Check if we need a new page
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
            });
          } else {
            // If no question-answer pairs found, display the raw feedback
            const feedbackLines = doc.splitTextToSize(feedbackText, 180);
            doc.text(feedbackLines, 14, yPos);
            yPos += feedbackLines.length * 5 + 10;
          }
        }
      })

      // Save PDF
      doc.save(`${studentDetails.projectId || 'project'}-evaluation.pdf`)
      
      logger.timeEnd("PDF Generation");
      logger.info("PDF generated successfully", { projectId: studentDetails.projectId });
      return true
    } catch (error) {
      logger.error("Error generating PDF", error);
      console.error("Error generating PDF:", error)
      toast({
        title: "PDF Generation Error",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleGeneratePDF = async () => {
    setGenerating(true)
    logger.debug("PDF generation requested");

    try {
      // Generate PDF using client-side jsPDF
      const success = generatePDF()
      
      if (!success) {
        logger.error("Failed to generate PDF", "The generatePDF function returned false");
        throw new Error("Failed to generate PDF")
      }
      
      toast({
        title: "PDF Generated",
        description: "Your project evaluation PDF has been downloaded.",
        variant: "default",
      })
    } catch (error) {
      logger.error("Failed to generate PDF in handler", error);
      console.error("Failed to generate PDF:", error)
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleNewEvaluation = () => {
    localStorage.removeItem("evaluationResults")
    router.push("/submit")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mb-8"></div>
              <h2 className="text-2xl font-semibold text-navy-800 mb-2">Analyzing Your Project</h2>
              <p className="text-gray-600">Please wait while we evaluate your submission...</p>
            </div>

            <div className="space-y-6 mt-8">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-navy-700 hover:text-navy-800 mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-navy-800">Evaluation Results</h1>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleNewEvaluation}>
                <RefreshCw className="mr-2 h-4 w-4" /> New Evaluation
              </Button>

              <Button onClick={handleGeneratePDF} className="bg-navy-700 hover:bg-navy-800" disabled={generating}>
                {generating ? (
                  <>Generating...</>
                ) : (
                  <>
                    Download PDF <Download className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {processingTime && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-sm text-gray-600 flex items-center">
              <Loader2 className="h-4 w-4 mr-2 text-navy-600" />
              <span>Evaluation completed in <strong>{processingTime} seconds</strong> </span>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="evaluation" className="text-lg py-3">
                Evaluation
              </TabsTrigger>
              <TabsTrigger value="project-details" className="text-lg py-3">
                Project Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evaluation">
              <Card className="border-gray-200 shadow-sm mb-8">
                <CardHeader className="bg-navy-50 border-b border-gray-200">
                  <CardTitle className="text-navy-800 flex items-center">
                    <FileText className="mr-2 h-5 w-5" /> Evaluation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 mb-4">
                      This evaluation provides feedback on your project based on the information you submitted. Each
                      section has been analyzed to identify strengths and areas for improvement.
                    </p>

                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                      <h3 className="text-green-800 font-medium mb-1">Overall Assessment</h3>
                      <p className="text-green-700">
                        {data?.evaluation?.overall?.feedback || ""}
                      </p>
                    </div>

                    <div className="space-y-8 mt-8">
                      {data?.evaluation?.sections ? (
                        Object.entries(data.evaluation.sections).map(([key, section]) => (
                          <EvaluationSection
                            key={key}
                            title={section.title || key}
                            score={section.score ?? 0}
                            feedback={section.feedback}
                          />
                        ))
                      ) : (
                        Object.entries(data?.evaluation || {}).map(([key, section]) => {
                          // Skip the overall section as it's already displayed above
                          if (key === 'overall') return null;
                          
                          // Make sure section is an EvaluationSection object
                          if (typeof section === 'object' && section !== null && 'title' in section) {
                            return (
                              <EvaluationSection
                                key={key}
                                title={(section as any).title || key}
                                score={(section as any).score ?? 0}
                                feedback={(section as any).feedback}
                              />
                            );
                          }
                          return null;
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="project-details">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-navy-50 border-b border-gray-200">
                  <CardTitle className="text-navy-800 flex items-center">
                    <FileText className="mr-2 h-5 w-5" /> Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-2">Problem Statement</h3>
                      <p className="text-gray-700">{data?.projectDetails?.problemStatement}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-2">Abstract/Summary</h3>
                      <p className="text-gray-700">{data?.projectDetails?.abstract}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-2">Introduction/Background</h3>
                      <p className="text-gray-700">{data?.projectDetails?.introduction}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-2">Objectives</h3>
                      <p className="text-gray-700">{data?.projectDetails?.objectives}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-2">Methodology</h3>
                      <p className="text-gray-700">{data?.projectDetails?.methodology}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-2">Timeline</h3>
                      <p className="text-gray-700">{data?.projectDetails?.timeline}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-2">Expected Outcome</h3>
                      <p className="text-gray-700">{data?.projectDetails?.expectedOutcome}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-2">Budget</h3>
                      <p className="text-gray-700">{data?.projectDetails?.budget}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
