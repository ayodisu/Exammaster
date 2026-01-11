<?php

use App\Models\Candidate;
use App\Models\Exam;
use Illuminate\Support\Facades\Hash;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- EXAM DIAGNOSTIC ---\n";

$allExams = Exam::all();
echo "Total Exams in DB: " . $allExams->count() . "\n";

foreach ($allExams as $e) {
    echo "ID: {$e->id} | Title: {$e->title} | Published: " . var_export($e->is_published, true) . "\n";
}

echo "--- \n";
echo "Testing Query: Exam::where('is_published', true)->count()\n";
echo "Count: " . Exam::where('is_published', true)->count() . "\n";
