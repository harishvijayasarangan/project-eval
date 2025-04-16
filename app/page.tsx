import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileCheck, Award, BookOpen } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-navy-800 mb-4">Project Evaluation System</h1>
            <p className="text-xl text-gray-600 mb-8">Professional evaluation and feedback for academic projects</p>
            <Link href="/submit">
              <Button className="bg-navy-700 hover:bg-navy-800 text-white px-6 py-6 rounded-md text-lg">
                Start Evaluation <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <FeatureCard
              icon={<FileCheck className="h-10 w-10 text-navy-600" />}
              title="Submit Project"
              description="Enter your project details through our structured submission form."
            />
            <FeatureCard
              icon={<Award className="h-10 w-10 text-navy-600" />}
              title="AI Evaluation"
              description="Get comprehensive feedback powered by advanced AI technology."
            />
            <FeatureCard
              icon={<BookOpen className="h-10 w-10 text-navy-600" />}
              title="Professional Report"
              description="Download a professionally formatted PDF report with detailed feedback."
            />
          </div>

          <div className="mt-20 bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-navy-800 mb-4">How It Works</h2>
            <div className="space-y-4">
              <Step
                number={1}
                title="Submit Your Project Details"
                description="Fill out the structured form with your project information."
              />
              <Step
                number={2}
                title="AI-Powered Evaluation"
                description="Our system analyzes your project using advanced AI technology."
              />
              <Step
                number={3}
                title="Review Feedback"
                description="Get comprehensive feedback on each section of your project."
              />
              <Step
                number={4}
                title="Download Report"
                description="Generate a professional PDF report with all evaluation details."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-navy-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function Step({ number, title, description }) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 bg-navy-700 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4">
        {number}
      </div>
      <div>
        <h3 className="font-medium text-navy-800">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  )
}
