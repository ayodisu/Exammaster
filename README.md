# ExamMaster

## Overview
ExamMaster is a comprehensive Exam Management System designed to streamline the process of creating, taking, and grading exams. It features a robust role-based system for **Candidates** (Students) and **Examiners** (Teachers/Admins), providing distinct dashboards and workflows for each.

The application is built with a modern tech stack, ensuring performance, scalability, and type safety:
- **Backend**: Laravel 10 (PHP)
- **Frontend**: Next.js 14 (TypeScript, React)
- **Database**: MySQL

## Features

### 🎓 Candidate (Student) Features
- **Secure Authentication**: Registration, Login, Email Verification, and Password Reset.
- **Dashboard**: Overview of available exams and recent activity.
- **Exam Taking**:
  - Timed exams with auto-submission.
  - Support for Multiple Choice (MCQ) and True/False questions.
  - Randomized question order (deterministic per attempt).
  - Resume capability for ongoing attempts.
- **Detailed Results**:
  - Immediate scoring and pass/fail status.
  - Comprehensive breakdown of performance by question type.
  - Question-by-question review with correct answers and explanations.
- **Profile Management**: View personal details and exam history.

### 👨‍🏫 Examiner (Admin) Features
- **Exam Management**: Create, publish, and schedule exams.
- **Question Bank**: Manage questions (Add, Edit, Delete) and import from CSV.
- **Monitoring**: Track student attempts and performance stats.
- **Analytics**: View average scores, pass rates, and time spent.

## Tech Stack

### Backend (Server)
- **Framework**: Laravel 10
- **Authentication**: Laravel Sanctum (Token-based)
- **Database**: MySQL
- **Email**: SMTP (Mailpit for local testing)
- **Testing**: PHPUnit (Feature & Unit tests)

### Frontend (Client)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites
- PHP >= 8.1
- Composer
- Node.js >= 18
- MySQL Database

### 1. Backend Setup (Laravel)

Navigate to the server directory:
```bash
cd server
```

Install PHP dependencies:
```bash
composer install
```

Set up environment variables:
```bash
cp .env.example .env
```
> **Note:** Update `.env` with your database credentials (DB_DATABASE, DB_USERNAME, DB_PASSWORD).

Generate Application Key:
```bash
php artisan key:generate
```

Run Migrations (Create Database Tables):
```bash
php artisan migrate
```

Start the Development Server:
```bash
php artisan serve
```
The backend API will run at `http://127.0.0.1:8000`.

### 2. Frontend Setup (Next.js)

Navigate to the project root (if not already there):
```bash
# Return to root if in server/
cd ..
```

Install Node dependencies:
```bash
npm install
```

Set up environment variables:
```bash
cp .env.example .env.local
```
> **Note:** Ensure `NEXT_PUBLIC_API_URL` points to your running backend (default: `http://localhost:8000/api`).

Start the Development Server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 3. Email Testing (Optional but Recommended)
For local email testing (Verification logs, Password Resets), use [Mailpit](https://github.com/axllent/mailpit).
- Configure `MAIL_HOST=127.0.0.1` and `MAIL_PORT=1025` in your server `.env`.
- View emails at `http://localhost:8025`.

## API Documentation
The API is structured around resource-oriented URLs.
- **Base URL**: `/api`
- **Auth**: Bearer Token (Sanctum)

### Key Endpoints
- `POST /api/candidate/register`: Register a new student.
- `POST /api/candidate/login`: Authenticate a student.
- `GET /api/assessments`: List available exams.
- `GET /api/attempts/{id}/detail`: Get result breakdown.

## Testing
Run backend feature tests:
```bash
cd server
php artisan test
```
