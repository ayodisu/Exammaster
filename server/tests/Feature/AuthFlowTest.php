<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Candidate;
use Illuminate\Support\Facades\Notification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Carbon;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_candidate_registration_flow()
    {
        Notification::fake();

        $payload = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'phone_number' => '1234567890',
            'gender' => 'male',
            'address' => '123 Test St',
        ];

        // 1. Register
        $response = $this->postJson('/api/candidate/register', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'requires_verification' => true
            ]);

        $this->assertDatabaseHas('candidates', ['email' => 'john@example.com']);
        $candidate = Candidate::where('email', 'john@example.com')->first();
        $this->assertNull($candidate->email_verified_at);

        // 2. Verify Notification Sent
        Notification::assertSentTo(
            [$candidate],
            VerifyEmailNotification::class
        );

        // 3. Try login before verification (Should Fail)
        $loginResponse = $this->postJson('/api/candidate/login', [
            'email' => 'john@example.com',
            'password' => 'Password123!',
        ]);

        $loginResponse->assertStatus(403)
            ->assertJson(['email_not_verified' => true]);

        // 4. Verify Email
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(60),
            [
                'id' => $candidate->getKey(),
                'hash' => sha1($candidate->getEmailForVerification()),
            ]
        );

        $verifyResponse = $this->get($verificationUrl);

        $verifyResponse->assertStatus(200)
            ->assertJson(['verified' => true]);

        $candidate->refresh();
        $this->assertNotNull($candidate->email_verified_at);

        // 5. Login after verification (Should Succeed)
        $loginResponseAfter = $this->postJson('/api/candidate/login', [
            'email' => 'john@example.com',
            'password' => 'Password123!',
        ]);

        $loginResponseAfter->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }
}
