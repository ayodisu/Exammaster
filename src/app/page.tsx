"use client";

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Zap, Globe, Cpu, BarChart3, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
               <Cpu className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ExamMaster
            </span>
          </div>
          <div className="flex items-center gap-4">
             <Link 
              href="/student/login" 
              className="text-slate-600 hover:text-indigo-600 font-medium text-sm transition-colors hidden sm:block"
            >
              Log in
            </Link>
            <Link 
              href="/student/register" 
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-50 to-white -z-10"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Next-Gen CBT Platform v2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Assessments Powered by <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">Intelligence.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Experience the future of testing with AI-driven grading, real-time proctoring, and instant analytics. Secure, fast, and reliable.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link 
              href="/student/register" 
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
            >
              Start Your Journey <ArrowRight size={20} />
            </Link>
             <Link 
              href="/student/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-bold text-lg transition-all hover:scale-105 flex items-center justify-center"
            >
              Candidate Login
            </Link>
          </div>
          
          {/* Dashboard Preview or Abstract Visual */}
          <div className="mt-20 relative mx-auto max-w-5xl animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="aspect-[16/9] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 relative group">
                {/* Mock UI Elements */}
                <div className="absolute top-0 left-0 w-full h-12 bg-slate-800 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="p-12 flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-slate-800">
                     <div className="text-center">
                        <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm ring-4 ring-indigo-500/20">
                            <Lock className="text-indigo-400 w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Secure Exam Environment</h3>
                        <p className="text-slate-400">Browser locked. Camera active.</p>
                     </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute top-1/3 left-10 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg transform -rotate-6 group-hover:-rotate-3 transition-transform duration-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg"><CheckCircle2 className="text-emerald-400 w-5 h-5" /></div>
                        <div>
                            <div className="text-xs text-slate-300">Accuracy</div>
                            <div className="text-sm font-bold text-white">99.8%</div>
                        </div>
                    </div>
                </div>
                 <div className="absolute bottom-1/4 right-10 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg"><Zap className="text-purple-400 w-5 h-5" /></div>
                        <div>
                            <div className="text-xs text-slate-300">Speed</div>
                            <div className="text-sm font-bold text-white">Real-time</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] -z-10 blur-2xl opacity-20"></div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything needed for modern assessment</h2>
                <p className="text-slate-500">We&apos;ve reimagined the computer-based testing experience to be faster, smarter, and more secure than ever before.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300 group">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Shield className="text-blue-600 w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Anti-Cheat System</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Advanced browser lockdown, tab-switch monitoring, and optional webcam proctoring ensure total integrity.
                    </p>
                </div>
                 {/* Feature 2 */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300 group">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                         <BarChart3 className="text-purple-600 w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Analytics</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Get results the moment you finish. Detailed performance breakdowns, pass rates, and improvement insights.
                    </p>
                </div>
                 {/* Feature 3 */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300 group">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Globe className="text-emerald-600 w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Accessible Anywhere</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Cloud-native infrastructure means you can take exams on any device, from anywhere in the world.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <Cpu className="text-indigo-500 w-5 h-5" />
                <span className="text-white font-bold text-lg">ExamMaster</span>
            </div>
            <div className="flex gap-8 text-sm">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <div className="text-sm opacity-50">
                © {new Date().getFullYear()} ExamMaster Inc.
            </div>
        </div>
      </footer>
    </div>
  );
}
