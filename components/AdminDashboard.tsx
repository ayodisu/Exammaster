import React from 'react';
import { Exam, User } from '../types';
import { Plus, Trash2, BookOpen, Clock, Users, ChevronRight } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  exams: Exam[];
  onCreateExam: () => void;
  onDeleteExam: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, exams, onCreateExam, onDeleteExam }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hello, {user.name}</h1>
          <p className="text-slate-500 mt-2">Manage your assessments and question banks.</p>
        </div>
        <button 
            onClick={onCreateExam}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
            <Plus size={20} /> Set New Exam
        </button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <BookOpen size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Active Exams</p>
                    <h3 className="text-2xl font-bold text-slate-800">{exams.length}</h3>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Total Candidates</p>
                    <h3 className="text-2xl font-bold text-slate-800">128</h3>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Avg Duration</p>
                    <h3 className="text-2xl font-bold text-slate-800">15m</h3>
                </div>
            </div>
        </div>
      </div>

      {/* Exam List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Managed Exams</h2>
            <span className="text-sm text-slate-500">{exams.length} total</span>
        </div>
        
        <div className="divide-y divide-slate-100">
            {exams.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <BookOpen size={32} />
                    </div>
                    <p className="text-slate-500 mb-4">No exams created yet.</p>
                    <button onClick={onCreateExam} className="text-indigo-600 font-medium hover:underline">Create your first exam</button>
                </div>
            ) : (
                exams.map(exam => (
                    <div key={exam.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                {exam.subject.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{exam.title}</h3>
                                <div className="flex gap-2 mt-1 text-xs text-slate-500">
                                    <span>{exam.questions.length} Questions</span>
                                    <span>•</span>
                                    <span>{exam.durationMinutes} mins</span>
                                    <span>•</span>
                                    <span className={`font-medium ${
                                        exam.difficulty === 'Hard' ? 'text-red-600' : 
                                        exam.difficulty === 'Medium' ? 'text-yellow-600' : 'text-emerald-600'
                                    }`}>{exam.difficulty}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-400">ID: {exam.id.substring(0,8)}...</span>
                            <button 
                                onClick={() => onDeleteExam(exam.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Exam"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
