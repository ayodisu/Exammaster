import React, { useState } from 'react';
import { generateExam } from '../services/geminiService';
import { Exam } from '../types';
import { Loader2, BookOpen, BrainCircuit, Layers } from 'lucide-react';

interface ExamCreatorProps {
  onExamCreated: (exam: Exam) => void;
  onCancel: () => void;
}

const ExamCreator: React.FC<ExamCreatorProps> = ({ onExamCreated, onCancel }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!topic) return;
    setIsLoading(true);
    try {
      const examData = await generateExam(topic, difficulty, questionCount);
      const newExam: Exam = {
        ...examData,
        id: Date.now().toString(),
        createdAt: Date.now()
      };
      onExamCreated(newExam);
    } catch (error) {
      alert("Failed to generate exam. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-in fade-in">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
        <h3 className="text-2xl font-bold text-slate-800">Generating Exam...</h3>
        <p className="text-slate-500 mt-2">Consulting the knowledge base about "{topic}"</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="text-blue-600"/> Create New Exam
        </h2>
        <p className="text-slate-500 mt-1">Enter a topic and let AI generate a test for you.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Topic or Subject</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. History of Rome, Javascript Basics, Quantum Physics"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                <div className="relative">
                    <Layers className="absolute left-3 top-3.5 text-slate-400" size={20} />
                    <select
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    </select>
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Number of Questions</label>
                 <input 
                    type="number" 
                    min={3} 
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                 />
            </div>
        </div>

        <div className="flex items-center gap-3 mt-8 pt-4 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!topic}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
          >
            Generate Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamCreator;
