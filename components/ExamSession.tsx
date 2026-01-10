import React, { useState, useEffect } from 'react';
import { Exam, Question, UserAnswer, ExamResult } from '../types';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { generateExamFeedback } from '../services/geminiService';

interface ExamSessionProps {
  exam: Exam;
  onComplete: (result: ExamResult) => void;
  onExit: () => void;
}

const ExamSession: React.FC<ExamSessionProps> = ({ exam, onComplete, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = exam.questions[currentQuestionIndex];

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (option: string) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== currentQuestion.id);
      return [...filtered, { questionId: currentQuestion.id, answer: option }];
    });
  };

  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let correctCount = 0;
    const weakAreas: string[] = [];

    // Calculate Score
    exam.questions.forEach(q => {
      const userAnswer = answers.find(a => a.questionId === q.id)?.answer;
      if (userAnswer === q.correctAnswer) {
        correctCount++;
      } else {
        weakAreas.push(q.text); // Collect question text for AI analysis
      }
    });

    const score = Math.round((correctCount / exam.questions.length) * 100);
    
    // Get AI Feedback
    let feedback = "Great job!";
    if (weakAreas.length > 0) {
        feedback = await generateExamFeedback(exam.title, score, weakAreas.slice(0, 3).join(", "));
    }

    const result: ExamResult = {
      id: Date.now().toString(),
      examId: exam.id,
      examTitle: exam.title,
      timestamp: Date.now(),
      score,
      totalQuestions: exam.questions.length,
      correctCount,
      answers,
      aiFeedback: feedback
    };

    onComplete(result);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)?.answer;

  if (isSubmitting) {
      return (
          <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-500">Grading your exam...</p>
          </div>
      )
  }

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-slate-800">{exam.title}</h2>
          <p className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-4">
            {currentQuestion.type === 'TRUE_FALSE' ? 'True / False' : 'Multiple Choice'}
          </span>
          <h3 className="text-xl font-medium text-slate-900 mb-8 leading-relaxed">
            {currentQuestion.text}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${
                  currentAnswer === option
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                }`}
              >
                <span className={`font-medium ${currentAnswer === option ? 'text-blue-700' : 'text-slate-600'}`}>
                  {option}
                </span>
                {currentAnswer === option && <CheckCircle size={20} className="text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={onExit}
          className="text-slate-400 hover:text-slate-600 font-medium px-4"
        >
          Quit Exam
        </button>
        
        <div className="flex gap-3">
            {currentQuestionIndex > 0 && (
                <button
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                    Previous
                </button>
            )}
            <button
                onClick={() => isLastQuestion ? handleSubmit() : setCurrentQuestionIndex(prev => prev + 1)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"
            >
                {isLastQuestion ? 'Submit Exam' : 'Next Question'}
                {!isLastQuestion && <ChevronRight size={18} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSession;
