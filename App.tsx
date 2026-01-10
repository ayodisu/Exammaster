import React, { useState } from 'react';
import { ViewState, Exam, ExamResult, User } from './types';
import Dashboard from './components/Dashboard'; // Student Dashboard
import AdminDashboard from './components/AdminDashboard'; // Examiner Dashboard
import ExamCreator from './components/ExamCreator';
import ExamSession from './components/ExamSession';
import { LayoutDashboard, CheckCircle, BrainCircuit, X, LogOut, User as UserIcon, Shield, ArrowLeft, Lock, BadgeCheck } from 'lucide-react';

type AuthStep = 'LANDING' | 'LOGIN_ADMIN' | 'LOGIN_STUDENT' | 'AUTHENTICATED';

const App: React.FC = () => {
  const [authStep, setAuthStep] = useState<AuthStep>('LANDING');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // State (Mock Database)
  const [exams, setExams] = useState<Exam[]>([
    {
        id: '1',
        title: 'General Science Quiz',
        subject: 'Science',
        difficulty: 'Easy',
        durationMinutes: 10,
        createdAt: Date.now(),
        questions: [
            {
                id: 'q1',
                type: 'MULTIPLE_CHOICE' as any,
                text: 'What is the chemical symbol for water?',
                options: ['H2O', 'CO2', 'O2', 'NaCl'],
                correctAnswer: 'H2O',
                explanation: 'Water is composed of two hydrogen atoms and one oxygen atom.'
            },
            {
                id: 'q2',
                type: 'TRUE_FALSE' as any,
                text: 'The Earth revolves around the Moon.',
                options: ['True', 'False'],
                correctAnswer: 'False',
                explanation: 'The Moon revolves around the Earth, and the Earth revolves around the Sun.'
            },
             {
                id: 'q3',
                type: 'MULTIPLE_CHOICE' as any,
                text: 'Which planet is known as the Red Planet?',
                options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
                correctAnswer: 'Mars',
                explanation: 'Mars appears red due to iron oxide on its surface.'
            }
        ]
    }
  ]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  // Authentication Handlers
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API Login
    const mockUser: User = {
        id: 'admin-1',
        name: 'Dr. Sarah Smith',
        role: 'ADMIN',
        email: 'sarah.smith@exammaster.com'
    };
    setCurrentUser(mockUser);
    setAuthStep('AUTHENTICATED');
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
     // Simulate API Login
    const mockUser: User = {
        id: 'student-1',
        name: 'Alex Johnson',
        role: 'STUDENT',
        email: 'alex.j@university.edu'
    };
    setCurrentUser(mockUser);
    setAuthStep('AUTHENTICATED');
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthStep('LANDING');
    setActiveExam(null);
    setSelectedResult(null);
    setCurrentView(ViewState.DASHBOARD);
  };

  // Admin Actions
  const handleCreateExam = (exam: Exam) => {
    setExams(prev => [exam, ...prev]);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleDeleteExam = (id: string) => {
      if(confirm('Are you sure you want to delete this exam?')) {
          setExams(prev => prev.filter(e => e.id !== id));
      }
  };

  // Student Actions
  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
    setCurrentView(ViewState.TAKE_EXAM);
  };

  const handleCompleteExam = (result: ExamResult) => {
    setResults(prev => [...prev, result]);
    setActiveExam(null);
    setSelectedResult(result); 
    setCurrentView(ViewState.RESULTS);
  };

  const handleViewResult = (result: ExamResult) => {
      setSelectedResult(result);
      setCurrentView(ViewState.RESULTS);
  };

  // --- VIEWS ---

  // 1. Landing Page
  if (authStep === 'LANDING') {
      return (
          <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-4">
              <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
                  <div className="p-12 md:w-1/2 bg-slate-900 text-white flex flex-col justify-between">
                      <div>
                          <div className="flex items-center gap-3 mb-6">
                            <BrainCircuit size={40} className="text-blue-400" />
                            <h1 className="text-3xl font-bold">ExamMaster CBT</h1>
                          </div>
                          <p className="text-slate-300 text-lg leading-relaxed">
                              The trusted platform for secure, AI-powered assessments. <br/><br/>
                              Streamline your examination process with intelligent generation and instant grading.
                          </p>
                      </div>
                      <div className="mt-12 text-sm text-slate-500">
                          © 2024 ExamMaster Inc.
                      </div>
                  </div>
                  <div className="p-12 md:w-1/2 flex flex-col justify-center gap-6">
                      <div className="text-center mb-8">
                          <h2 className="text-2xl font-bold text-slate-800">Welcome</h2>
                          <p className="text-slate-500">Choose your portal to sign in</p>
                      </div>

                      <button 
                        onClick={() => setAuthStep('LOGIN_ADMIN')}
                        className="group flex items-center p-5 border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left gap-4"
                      >
                          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Shield size={28} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800 text-lg">Examiner</h3>
                              <p className="text-sm text-slate-500">Admin Console Access</p>
                          </div>
                      </button>

                      <button 
                        onClick={() => setAuthStep('LOGIN_STUDENT')}
                        className="group flex items-center p-5 border-2 border-slate-100 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left gap-4"
                      >
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <UserIcon size={28} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800 text-lg">Candidate</h3>
                              <p className="text-sm text-slate-500">Student Assessment Portal</p>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // 2. Admin Login
  if (authStep === 'LOGIN_ADMIN') {
    return (
        <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4 animate-in fade-in slide-in-from-right-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <button onClick={() => setAuthStep('LANDING')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium mb-6">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                        <Shield size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Examiner Login</h2>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Professional Email</label>
                        <input type="email" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="name@institution.edu" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input type="password" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200">
                        Access Dashboard
                    </button>
                </form>
                <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                    <Lock size={12} /> Secure Admin Environment
                </div>
            </div>
        </div>
    );
  }

  // 3. Student Login
  if (authStep === 'LOGIN_STUDENT') {
    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 animate-in fade-in slide-in-from-right-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <button onClick={() => setAuthStep('LANDING')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium mb-6">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                        <UserIcon size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Candidate Login</h2>
                </div>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Candidate ID</label>
                        <input type="text" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. STU-2024-889" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Access Code</label>
                        <input type="password" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-200">
                        Start Assessment
                    </button>
                </form>
                 <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                    <BadgeCheck size={12} /> Verified Exam Terminal
                </div>
            </div>
        </div>
    );
  }

  // 4. Authenticated App Logic
  if (!currentUser) return null; // Should not happen based on logic above

  const renderContent = () => {
    // --- EXAMINER VIEWS ---
    if (currentUser.role === 'ADMIN') {
        switch (currentView) {
            case ViewState.CREATE_EXAM:
                return <ExamCreator onExamCreated={handleCreateExam} onCancel={() => setCurrentView(ViewState.DASHBOARD)} />;
            default:
                return <AdminDashboard user={currentUser} exams={exams} onCreateExam={() => setCurrentView(ViewState.CREATE_EXAM)} onDeleteExam={handleDeleteExam} />;
        }
    }

    // --- CANDIDATE VIEWS ---
    switch (currentView) {
      case ViewState.TAKE_EXAM:
        if (!activeExam) return null;
        return <ExamSession exam={activeExam} onComplete={handleCompleteExam} onExit={() => setCurrentView(ViewState.DASHBOARD)} />;
      case ViewState.RESULTS:
          if (!selectedResult) return null;
          return (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
                      <div className="inline-block p-4 rounded-full bg-slate-50 mb-4">
                          {selectedResult.score >= 70 ? (
                              <CheckCircle className="text-emerald-500 w-12 h-12" />
                          ) : (
                              <BrainCircuit className="text-amber-500 w-12 h-12" />
                          )}
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800">{selectedResult.score}%</h2>
                      <p className="text-slate-500">Score on {selectedResult.examTitle}</p>
                      
                      <div className="mt-8 bg-blue-50 p-6 rounded-xl text-left border border-blue-100">
                          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                              AI Feedback
                          </h4>
                          <p className="text-blue-800 leading-relaxed">{selectedResult.aiFeedback}</p>
                      </div>

                      <div className="mt-8 flex justify-center">
                          <button 
                            onClick={() => setCurrentView(ViewState.DASHBOARD)}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                          >
                              Back to Dashboard
                          </button>
                      </div>
                  </div>
              </div>
          );
      default:
        return (
            <Dashboard 
                user={currentUser}
                exams={exams} 
                results={results} 
                onStartExam={handleStartExam} 
                onViewResult={handleViewResult}
            />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView(ViewState.DASHBOARD)}>
            <div className={`p-1.5 rounded-lg ${currentUser.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-blue-600'} text-white`}>
                <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">
                ExamMaster <span className={`text-xs px-2 py-0.5 rounded-full ${currentUser.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>{currentUser.role === 'ADMIN' ? 'Examiner' : 'Candidate'}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {currentView !== ViewState.DASHBOARD && (
                <button onClick={() => setCurrentView(ViewState.DASHBOARD)} className="text-slate-500 hover:text-slate-800 hidden md:block">
                    Dashboard
                </button>
            )}
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button 
                onClick={handleLogout} 
                className="text-slate-500 hover:text-red-600 flex items-center gap-2 font-medium text-sm px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
            >
                 <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
