import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Question } from '@/types';

interface QuestionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Question>) => Promise<void>;
    initialData?: Question | null;
}

export default function QuestionFormModal({ isOpen, onClose, onSave, initialData }: QuestionFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState('');
    const [type, setType] = useState<'mcq' | 'tf'>('mcq');
    const [options, setOptions] = useState<{ id: string, text: string }[]>([
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' }
    ]);
    const [correctAnswer, setCorrectAnswer] = useState('');

    useEffect(() => {
        if (initialData) {
            setText(initialData.text);
            setType(initialData.type);
            // Parse options if they vary
            if (initialData.options_json) {
                setOptions(initialData.options_json.map(o => ({ id: o.id.toString(), text: o.text || o.id.toString() })));
            }
            setCorrectAnswer(initialData.correct_answer || '');
        } else {
            // Reset
            setText('');
            setType('mcq');
            setOptions([
                { id: 'A', text: '' },
                { id: 'B', text: '' },
                { id: 'C', text: '' },
                { id: 'D', text: '' }
            ]);
            setCorrectAnswer('');
        }
    }, [initialData, isOpen]);

    const handleTypeChange = (newType: 'mcq' | 'tf') => {
        setType(newType);

        if (newType === 'tf') {
            setOptions([
                { id: 'true', text: 'True' },
                { id: 'false', text: 'False' }
            ]);
            // If current correct answer isn't True/False, default to True
            if (correctAnswer !== 'True' && correctAnswer !== 'False') setCorrectAnswer('True');
        } else if (newType === 'mcq' && options.length === 2 && options[0].id === 'true') {
            // Switch back to MCQ pattern if needed
            setOptions([
                { id: 'A', text: '' },
                { id: 'B', text: '' },
                { id: 'C', text: '' },
                { id: 'D', text: '' }
            ]);
            setCorrectAnswer('A'); // Default ID
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Backend expects options in format: id (Text) => text (Text) for MCQ usually?
            // Wait, in Import (Step 3279), we decided ID = Text.
            // But here we present fixed IDs A, B...
            // If we use fixed IDs A, B, C, D, then Correct Answer must be 'A', 'B'...
            // BUT ExamEngine (Frontend) displays options.
            // If ID=A, Text="Paris".
            // If Student selects "Paris" (ID A). Value sent is "A".
            // Backend Correct Answer is "Paris"? No, Backend `correct_answer` column stores string.

            // Critical Design Decision:
            // 1. Store `correct_answer` as "Paris" (Text).
            //    Then Options must handle ID vs Value.
            //    If we send options with ID='A', Text='Paris'.
            //    And `correct_answer`='Paris'.
            //    Student pick ID 'A'.
            //    We must map ID 'A' -> 'Paris' BEFORE checking?
            //    Or, ensure ID IS the Text.

            // Previous Store method (Step 3265): ID = Text.
            // So we should stick to ID = Text.

            const submitOptions = options.map(o => ({
                id: type === 'mcq' ? o.text : o.id, // For MCQ use Text as ID. For TF use 'true'/'false'.
                text: o.text
            }));

            // Correct Answer logic:
            // If MCQ, UI selects 'A', 'B'. get Text from Option.
            // If TF, UI selects 'True', 'False'.

            let finalCorrect = correctAnswer;
            if (type === 'mcq') {
                // User selected 'A' (the fixed ID in state). Find actual text.
                const selectedOpt = options.find(o => o.id === correctAnswer) || options[0];
                finalCorrect = selectedOpt.text;
            }

            await onSave({
                text,
                type,
                options_json: submitOptions,
                correct_answer: finalCorrect
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                        {initialData ? 'Edit Question' : 'Add New Question'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Question Text</label>
                        <textarea
                            required
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Enter your question here..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Question Type</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                                value={type}
                                onChange={e => handleTypeChange(e.target.value as 'mcq' | 'tf')}
                            >
                                <option value="mcq">Multiple Choice</option>
                                <option value="tf">True / False</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 border-emerald-200 bg-emerald-50"
                                value={correctAnswer}
                                onChange={e => setCorrectAnswer(e.target.value)}
                            >
                                {options.map((opt, idx) => (
                                    <option key={idx} value={opt.id}>
                                        {type === 'mcq' ? `Option ${String.fromCharCode(65 + idx)}` : opt.text}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Options</label>
                        {type === 'mcq' ? (
                            options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        className="flex-1 p-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                        value={opt.text}
                                        onChange={e => {
                                            const newOpts = [...options];
                                            newOpts[idx].text = e.target.value;
                                            setOptions(newOpts);
                                        }}
                                    />
                                    {/* Mark as Correct Visual Indicator */}
                                    {correctAnswer === opt.id && <Check className="text-emerald-500" size={20} />}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
                                Standard True/False options will be used.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Question'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
