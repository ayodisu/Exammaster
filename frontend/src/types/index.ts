export interface User {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'examiner';
}

export interface Question {
    id: number;
    text: string;
    type: 'mcq' | 'tf';
    options_json: { id: number; text: string }[] | null;
    explanation?: string;
}

export interface Exam {
    id: number;
    title: string;
    duration_minutes: number;
    questions?: Question[];
}

export interface Attempt {
    id: number;
    student_id: number;
    exam_id: number;
    status: 'ongoing' | 'submitted';
    started_at: string;
    exam?: Exam;
}
