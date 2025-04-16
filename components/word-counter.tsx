"use client"

import { useState, useEffect } from "react"

interface WordCounterProps {
  text: string
  maxWords: number
}

export default function WordCounter({ text, maxWords }: WordCounterProps) {
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(words)
  }, [text])

  const isOverLimit = wordCount > maxWords

  return (
    <div className="flex justify-end mt-1">
      <span className={`text-xs ${isOverLimit ? "text-red-500 font-medium" : "text-gray-500"}`}>
        {wordCount}/{maxWords} words
      </span>
    </div>
  )
}
