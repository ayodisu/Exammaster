import Link from 'next/link';
import { BrainCircuit, Shield, User as UserIcon } from 'lucide-react';

export default function Home() {
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

                  <Link 
                    href="/examiner/login"
                    className="group flex items-center p-5 border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left gap-4"
                  >
                      <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Shield size={28} />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-800 text-lg">Examiner</h3>
                          <p className="text-sm text-slate-500">Admin Console Access</p>
                      </div>
                  </Link>

                  <Link 
                    href="/student/login"
                    className="group flex items-center p-5 border-2 border-slate-100 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left gap-4"
                  >
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <UserIcon size={28} />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-800 text-lg">Candidate</h3>
                          <p className="text-sm text-slate-500">Student Assessment Portal</p>
                      </div>
                  </Link>
              </div>
          </div>
      </div>
  );
}
