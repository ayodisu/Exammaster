<?php

namespace App\Console\Commands;

use App\Models\Exam;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ManageExamAvailability extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exams:manage-availability';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-enable exams at scheduled time and auto-disable after 1 hour window';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Managing exam availability...');
        $now = Carbon::now();

        $enabledCount = 0;
        $disabledCount = 0;

        // 1. Auto-ENABLE exams where scheduled_at has arrived and exam is not yet active
        $examsToEnable = Exam::where('is_active', false)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', $now)
            ->where('scheduled_at', '>', $now->copy()->subHour()) // Only within the 1hr window
            ->whereNull('enabled_at') // Not manually re-enabled before
            ->get();

        foreach ($examsToEnable as $exam) {
            $exam->update([
                'is_active' => true,
                'enabled_at' => $now
            ]);
            $this->line("  + Enabled exam: {$exam->title} (scheduled at {$exam->scheduled_at})");
            $enabledCount++;
        }

        // 2. Auto-DISABLE exams that have been active for more than 1 hour
        $examsToDisable = Exam::where('is_active', true)
            ->whereNotNull('enabled_at')
            ->where('enabled_at', '<', $now->copy()->subHour())
            ->get();

        foreach ($examsToDisable as $exam) {
            $exam->update([
                'is_active' => false,
                'enabled_at' => null // Reset so it can be re-enabled
            ]);
            $this->line("  - Disabled exam: {$exam->title} (enabled at {$exam->enabled_at}, 1hr window expired)");
            $disabledCount++;
        }

        // 3. Also disable exams where scheduled_at + 1hr has passed (even if enabled_at is null)
        $scheduledExamsToDisable = Exam::where('is_active', true)
            ->whereNotNull('scheduled_at')
            ->whereNull('enabled_at') // Exams enabled via schedule but enabled_at wasn't set
            ->where('scheduled_at', '<', $now->copy()->subHour())
            ->get();

        foreach ($scheduledExamsToDisable as $exam) {
            $exam->update(['is_active' => false]);
            $this->line("  - Disabled exam: {$exam->title} (scheduled window expired)");
            $disabledCount++;
        }

        $this->info("Enabled: {$enabledCount}, Disabled: {$disabledCount}");

        return Command::SUCCESS;
    }
}
