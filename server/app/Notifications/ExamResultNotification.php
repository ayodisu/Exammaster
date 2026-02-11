<?php

namespace App\Notifications;

use App\Models\Exam;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ExamResultNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Exam $exam,
        protected int $score
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $passed = $this->score >= 50;
        $status = $passed ? '✅ Passed' : '❌ Failed';

        return (new MailMessage)
            ->subject("Your Result: {$this->exam->title}")
            ->greeting("Hello {$notifiable->first_name}!")
            ->line("Your assessment has been graded:")
            ->line("**Assessment:** {$this->exam->title}")
            ->line("**Score:** {$this->score}%")
            ->line("**Status:** {$status}")
            ->action('View All Results', url('/results'))
            ->line($passed
                ? 'Congratulations on passing!'
                : 'Keep studying and try again next time.')
            ->salutation('— The ExamMaster Team');
    }
}
