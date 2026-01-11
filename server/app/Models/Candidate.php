<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Candidate extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'exam_number',
        'first_name',
        'last_name',
        'email',
        'password',
        'phone_number',
        'date_of_birth',
        'gender',
        'address',
        'status'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = ['role', 'name'];

    public function getRoleAttribute()
    {
        return 'student';
    }

    public function getNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    // Relationships
    public function attempts()
    {
        return $this->hasMany(Attempt::class, 'student_id');
    }
}
