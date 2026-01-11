<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-submit expired exam attempts every minute
Schedule::command('exams:auto-submit')->everyMinute();

// Manage exam availability (auto-enable/disable based on schedule) every minute
Schedule::command('exams:manage-availability')->everyMinute();
