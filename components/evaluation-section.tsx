interface EvaluationSectionProps {
  title: string
  score: number
  feedback: string
}

export default function EvaluationSection({ title, score, feedback }: EvaluationSectionProps) {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-emerald-600"
    if (score >= 70) return "text-amber-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 80) return "bg-emerald-500"
    if (score >= 70) return "bg-amber-500"
    if (score >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  // Parse the feedback to extract question-answer pairs
  const renderFeedback = () => {
    if (!feedback) {
      return <p className="text-gray-700 text-sm">No feedback available.</p>;
    }

    // Split the feedback by numbered items (1., 2., etc.)
    const feedbackItems = feedback.split(/\d+\. /).filter(item => item.trim());
    
    if (feedbackItems.length === 0) {
      // If no numbered items found, just return the feedback as is
      return <p className="text-gray-700 text-sm">{feedback}</p>;
    }

    return (
      <div className="space-y-3">
        {feedbackItems.map((item, index) => {
          // Split each item into question and answer if possible
          const parts = item.split('\n');
          const question = parts[0]?.trim();
          const answer = parts.slice(1).join('\n').trim();

          return (
            <div key={index} className="text-sm">
              <p className="font-medium text-navy-800">{index + 1}. {question}</p>
              <p className="text-gray-700 ml-4">{answer}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-navy-800">{title}</h3>
        <span className={`font-semibold ${getScoreColor(score)}`}>{score}/100</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div className={`h-2 rounded-full ${getProgressColor(score)}`} style={{ width: `${score}%` }}></div>
      </div>

      {renderFeedback()}
    </div>
  )
}
