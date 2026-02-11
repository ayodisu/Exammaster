<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification
{
    use Queueable;

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Welcome to ExamMaster!')
            ->greeting("Welcome, {$notifiable->first_name}!")
            ->line('Your email has been verified and your account is now active.')
            ->line('Here are your account details:')
            ->line("**Name:** {$notifiable->first_name} {$notifiable->last_name}")
            ->line("**Email:** {$notifiable->email}")
            ->line("**Exam Number:** {$notifiable->exam_number}")
            ->action('Go to Dashboard', url('/student-dashboard'))
            ->line('Good luck with your assessments!')
            ->salutation('— The ExamMaster Team');
    }
}
