<?php

namespace App\Notifications;

use App\Models\Exam;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ExamDueNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Exam $exam
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Assessment Available: {$this->exam->title}")
            ->greeting("Hello {$notifiable->first_name}!")
            ->line("A new assessment is now available for you:")
            ->line("**{$this->exam->title}**")
            ->line("**Type:** " . ucfirst($this->exam->type))
            ->line("**Duration:** {$this->exam->duration_minutes} minutes")
            ->action('Start Assessment', url("/exam/{$this->exam->id}"))
            ->line('Please complete the assessment while it is active.')
            ->salutation('— The ExamMaster Team');
    }
}
