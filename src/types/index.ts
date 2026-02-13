export interface User {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    exam_number?: string;
    phone_number?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    created_at?: string;
    email: string;
    role: 'student' | 'examiner' | 'candidate';
    is_admin?: boolean;
    status?: string;
}

export interface Question {
    id: number;
    text: string;
    type: 'mcq' | 'tf';
    options_json: { id: string | number; text: string }[] | null;
    correct_answer?: string;
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
    created_at?: string;
    updated_at?: string;
    max_retakes?: number;
    // Dynamic properties added by API
    is_scheduled?: boolean;
    can_take?: boolean;
    scheduled_time?: string;
    attempts_used?: number;
    has_ongoing?: boolean;
    stats?: {
        attempts: number;
        avg_score: number;
        pass_rate: string | number;
    };
}

export interface Student {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    exam_number?: string;
}

export interface Violation {
    id: number;
    attempt_id: number;
    type: string;
    occurred_at: string;
    details?: string;
}

export interface Attempt {
    id: number;
    student_id: number;
    exam_id: number;
    status: 'ongoing' | 'submitted' | 'terminated';
    score?: number;
    started_at: string;
    submitted_at?: string;
    created_at?: string;
    exam?: Exam;
    student?: Student;
    violations?: Violation[];
}

