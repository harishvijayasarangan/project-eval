"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import WordCounter from "@/components/word-counter"
import Link from "next/link"
import React from "react"
import { jsPDF } from "jspdf"

export default function SubmitPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("student-details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingStage, setProcessingStage] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(25) // Default 25 seconds
  const [processingTimer, setProcessingTimer] = useState<NodeJS.Timeout | null>(null)
  const [jsPdfLoaded, setJsPdfLoaded] = useState(false)

  // Load jsPDF dynamically on client side
  useEffect(() => {
    setJsPdfLoaded(true)
  }, [])

  const [studentDetails, setStudentDetails] = useState({
    projectId: "",
    studentName: "",
    studentId: "",
    sapCode: "",
    collegeName: "",
    studentEmail: "",
    courseDepartment: "",
    supervisorName: "",
    supervisorEmail: "",
  })

  const [projectDetails, setProjectDetails] = useState<{
    problemStatement: string;
    abstract: string;
    introduction: string;
    objectives: string;
    methodology: string;
    timeline: string;
    expectedOutcome: string;
    budget: string;
    [key: string]: string;
  }>({
    problemStatement: "",
    abstract: "",
    introduction: "",
    objectives: "",
    methodology: "",
    timeline: "",
    expectedOutcome: "",
    budget: "",
  })

  const handleStudentDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setStudentDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleProjectDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectDetails((prev) => ({ ...prev, [name]: value }))
  }

  const validateProjectDetails = () => {
    const requiredFields = Object.keys(projectDetails)
    const emptyFields = requiredFields.filter((field) => !projectDetails[field].trim())

    if (emptyFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in all project details fields.`,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Generate PDF using jsPDF
  const generatePDF = (data: any) => {
    if (!jsPdfLoaded) {
      toast({
        title: "PDF Generation Error",
        description: "PDF generator not loaded. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      const { studentDetails, projectDetails, evaluation } = data
      const doc = new jsPDF()
      let yPos = 20

      // Title
      doc.setFontSize(22)
      doc.text("Project Evaluation Report", 105, yPos, { align: "center" })
      yPos += 10

      // Date
      doc.setFontSize(10)
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      doc.text(`Generated on: ${date}`, 105, yPos, { align: "center" })
      yPos += 15

      // Student Details
      doc.setFontSize(16)
      doc.text("Student Information", 14, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.text(`Project ID: ${studentDetails.projectId}`, 14, yPos)
      yPos += 6
      doc.text(`Student/Team Name: ${studentDetails.studentName}`, 14, yPos)
      yPos += 6
      doc.text(`Student/Team ID: ${studentDetails.studentId}`, 14, yPos)
      yPos += 6
      doc.text(`College Name: ${studentDetails.collegeName}`, 14, yPos)
      yPos += 6
      doc.text(`Email: ${studentDetails.studentEmail}`, 14, yPos)
      yPos += 6
      doc.text(`Course/Department: ${studentDetails.courseDepartment}`, 14, yPos)
      yPos += 6
      doc.text(`Supervisor/Mentor: ${studentDetails.supervisorName}`, 14, yPos)
      yPos += 15

      // Overall Assessment
      doc.addPage()
      yPos = 20
      doc.setFontSize(16)
      doc.text("Evaluation Summary", 14, yPos)
      yPos += 10

      doc.setFontSize(12)
      doc.text("Overall Assessment", 14, yPos)
      yPos += 6

      // Handle text wrapping for feedback
      const overallFeedback = evaluation.overall.feedback
      const splitOverallFeedback = doc.splitTextToSize(overallFeedback, 180)
      doc.setFontSize(10)
      doc.text(splitOverallFeedback, 14, yPos)
      yPos += splitOverallFeedback.length * 5 + 10

      doc.text(`Overall Score: ${evaluation.overall.score}/100`, 14, yPos)
      yPos += 15

      // Section Scores
      doc.setFontSize(12)
      doc.text("Section Scores", 14, yPos)
      yPos += 8

      const sections = [
        { key: "problemStatement", label: "Problem Statement" },
        { key: "abstract", label: "Abstract/Summary" },
        { key: "introduction", label: "Introduction/Background" },
        { key: "objectives", label: "Objectives" },
        { key: "methodology", label: "Methodology" },
        { key: "timeline", label: "Timeline" },
        { key: "expectedOutcome", label: "Expected Outcome" },
        { key: "budget", label: "Budget" },
      ]

      doc.setFontSize(10)
      sections.forEach((section) => {
        doc.text(
          `${section.label}: ${evaluation[section.key].score}/100`,
          14,
          yPos
        )
        yPos += 6
      })

      // Detailed Evaluation
      sections.forEach((section) => {
        doc.addPage()
        yPos = 20

        doc.setFontSize(16)
        doc.text(section.label, 14, yPos)
        yPos += 8

        doc.setFontSize(12)
        doc.text(`Score: ${evaluation[section.key].score}/100`, 14, yPos)
        yPos += 10

        doc.setFontSize(10)
        const feedback = evaluation[section.key].feedback
        const splitFeedback = doc.splitTextToSize(feedback, 180)
        doc.text(splitFeedback, 14, yPos)
      })

      // Save PDF
      doc.save(`${studentDetails.projectId || 'project'}-evaluation.pdf`)
      
      return true
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "PDF Generation Error",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateProjectDetails()) {
      return
    }

    setIsSubmitting(true)
    setProcessingStage("Preparing evaluation")
    setElapsedTime(0)
    
    // Start a timer to track elapsed time
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)
      
      // Update processing stage based on elapsed time
      if (elapsed <= 3) {
        setProcessingStage("Preparing evaluation")
      } else if (elapsed <= 8) {
        setProcessingStage("Analyzing project details")
      } else if (elapsed <= 15) {
        setProcessingStage("Generating comprehensive feedback")
      } else {
        setProcessingStage("Finalizing evaluation results")
      }
    }, 1000)
    
    setProcessingTimer(timer)

    try {
      // Step 1: Call the evaluation API
      const evaluationResponse = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentDetails,
          projectDetails,
        }),
      })

      if (!evaluationResponse.ok) {
        throw new Error("Failed to evaluate project")
      }

      const evaluationData = await evaluationResponse.json()
      
      // Calculate actual processing time for future estimates
      const processingTime = Math.floor((Date.now() - startTime) / 1000)
      
      // Store processing time in localStorage for future estimates
      const previousTimes = JSON.parse(localStorage.getItem("processingTimes") || "[]") as number[]
      previousTimes.push(processingTime)
      // Keep only the last 5 processing times
      if (previousTimes.length > 5) {
        previousTimes.shift()
      }
      localStorage.setItem("processingTimes", JSON.stringify(previousTimes))
      
      // Step 2: Store the evaluation results in localStorage for the results page
      localStorage.setItem(
        "evaluationResults",
        JSON.stringify({
          studentDetails,
          projectDetails,
          evaluation: evaluationData.evaluation,
          processingTime: processingTime,
          timestamp: new Date().toISOString()
        }),
      )

      // Navigate to results page
      router.push("/results")
    } catch (error) {
      toast({
        title: "Evaluation failed",
        description: "There was an error evaluating your project. Please try again.",
        variant: "destructive",
      })
    } finally {
      if (processingTimer) {
        clearInterval(processingTimer)
        setProcessingTimer(null)
      }
      setIsSubmitting(false)
      setProcessingStage(null)
    }
  }

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = () => {
    return Math.max(0, estimatedTime - elapsedTime)
  }

  // Get previous processing times average (if available)
  useEffect(() => {
    const previousTimes = JSON.parse(localStorage.getItem("processingTimes") || "[]") as number[]
    if (previousTimes.length > 0) {
      const avgTime = Math.ceil(previousTimes.reduce((a, b) => a + b, 0) / previousTimes.length)
      setEstimatedTime(avgTime)
    }
  }, [])

  // Processing overlay component
  const ProcessingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-navy-600" />
        <h3 className="text-xl font-semibold text-navy-800 mb-2">{processingStage}</h3>
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-navy-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` }}
            ></div>
          </div>
        </div>
        <p className="text-gray-700 mb-1">Elapsed time: {elapsedTime} seconds</p>
        <p className="text-gray-600">
          {elapsedTime < estimatedTime 
            ? `Estimated completion in ${getEstimatedTimeRemaining()} seconds` 
            : "Finalizing results..."}  
        </p>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
      {isSubmitting && <ProcessingOverlay />}
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-navy-700 hover:text-navy-800 mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>

          <h1 className="text-3xl font-bold text-navy-800 mb-8">Project Submission</h1>

          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="student-details" className="text-lg py-3">
                  Student Details
                </TabsTrigger>
                <TabsTrigger value="project-details" className="text-lg py-3">
                  Project Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student-details">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-navy-800">Student Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="projectId">Project ID</Label>
                        <Input
                          id="projectId"
                          name="projectId"
                          value={studentDetails.projectId}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter project ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="studentName">Student/Team Name</Label>
                        <Input
                          id="studentName"
                          name="studentName"
                          value={studentDetails.studentName}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter student or team name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student/Team ID</Label>
                        <Input
                          id="studentId"
                          name="studentId"
                          value={studentDetails.studentId}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter student or team ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sapCode">SAP Code</Label>
                        <Input
                          id="sapCode"
                          name="sapCode"
                          value={studentDetails.sapCode}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter SAP code"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="collegeName">College Name</Label>
                        <Input
                          id="collegeName"
                          name="collegeName"
                          value={studentDetails.collegeName}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter college name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="studentEmail">Student Email ID</Label>
                        <Input
                          id="studentEmail"
                          name="studentEmail"
                          type="email"
                          value={studentDetails.studentEmail}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter student email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="courseDepartment">Course/Department</Label>
                        <Input
                          id="courseDepartment"
                          name="courseDepartment"
                          value={studentDetails.courseDepartment}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter course or department"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supervisorName">Supervisor/Mentor Name</Label>
                        <Input
                          id="supervisorName"
                          name="supervisorName"
                          value={studentDetails.supervisorName}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter supervisor name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supervisorEmail">Supervisor Email ID</Label>
                        <Input
                          id="supervisorEmail"
                          name="supervisorEmail"
                          type="email"
                          value={studentDetails.supervisorEmail}
                          onChange={handleStudentDetailsChange}
                          placeholder="Enter supervisor email"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button
                        type="button"
                        onClick={() => setActiveTab("project-details")}
                        className="bg-navy-700 hover:bg-navy-800"
                      >
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="project-details">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-navy-800">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="problemStatement">
                          Problem Statement <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="problemStatement"
                          name="problemStatement"
                          value={projectDetails.problemStatement}
                          onChange={handleProjectDetailsChange}
                          placeholder="Describe the problem your project addresses"
                          className="min-h-[100px] resize-none"
                        />
                        <WordCounter text={projectDetails.problemStatement} maxWords={100} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="abstract">
                          Abstract/Summary <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="abstract"
                          name="abstract"
                          value={projectDetails.abstract}
                          onChange={handleProjectDetailsChange}
                          placeholder="Provide a brief summary of your project"
                          className="min-h-[100px] resize-none"
                        />
                        <WordCounter text={projectDetails.abstract} maxWords={100} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="introduction">
                          Introduction/Background <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="introduction"
                          name="introduction"
                          value={projectDetails.introduction}
                          onChange={handleProjectDetailsChange}
                          placeholder="Provide background information for your project"
                          className="min-h-[100px] resize-none"
                        />
                        <WordCounter text={projectDetails.introduction} maxWords={100} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="objectives">
                          Objectives <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="objectives"
                          name="objectives"
                          value={projectDetails.objectives}
                          onChange={handleProjectDetailsChange}
                          placeholder="List the main objectives of your project"
                          className="min-h-[100px] resize-none"
                        />
                        <WordCounter text={projectDetails.objectives} maxWords={100} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="methodology">
                          Methodology <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="methodology"
                          name="methodology"
                          value={projectDetails.methodology}
                          onChange={handleProjectDetailsChange}
                          placeholder="Describe the methods you will use"
                          className="min-h-[100px] resize-none"
                        />
                        <WordCounter text={projectDetails.methodology} maxWords={100} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timeline">
                          Timeline <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="timeline"
                          name="timeline"
                          value={projectDetails.timeline}
                          onChange={handleProjectDetailsChange}
                          placeholder="Outline the project timeline"
                          className="min-h-[100px] resize-none"
                        />
                        <WordCounter text={projectDetails.timeline} maxWords={100} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expectedOutcome">
                          Expected Outcome <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="expectedOutcome"
                          name="expectedOutcome"
                          value={projectDetails.expectedOutcome}
                          onChange={handleProjectDetailsChange}
                          placeholder="Describe the expected results of your project"
                          className="min-h-[100px] resize-none"
                        />
                        <WordCounter text={projectDetails.expectedOutcome} maxWords={100} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="budget">
                          Budget <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="budget"
                          name="budget"
                          value={projectDetails.budget}
                          onChange={handleProjectDetailsChange}
                          placeholder="Outline the project budget"
                          className="min-h-[100px] resize-none"
                        />
                        <WordCounter text={projectDetails.budget} maxWords={100} />
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("student-details")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>

                      <Button type="submit" className="bg-navy-700 hover:bg-navy-800" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>Processing...</>
                        ) : (
                          <>
                            Submit for Evaluation <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </div>
    </main>
  )
}
