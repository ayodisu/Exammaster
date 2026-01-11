export interface User {
    id: number;
    name?: string; // Optional as backend uses first_name/last_name
    first_name?: string;
    last_name?: string;
    exam_number?: string;
    phone_number?: string;
    address?: string;
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
    type: 'exam' | 'mock' | 'test';
    scheduled_at?: string;
    is_active: boolean;
    questions?: Question[];
    is_published?: boolean;
    stats?: {
        attempts: number;
        avg_score: number;
        pass_rate: string | number;
    };
}

export interface Attempt {
    id: number;
    student_id: number;
    exam_id: number;
    status: 'ongoing' | 'submitted';
    score?: number;
    started_at: string;
    submitted_at?: string;
    exam?: Exam;
}
