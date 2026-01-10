<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'examiner_id',
        'title',
        'duration_minutes',
        'is_published',
        'settings_json',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'settings_json' => 'array',
    ];

    public function examiner()
    {
        return $this->belongsTo(Examiner::class, 'examiner_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function attempts()
    {
        return $this->hasMany(Attempt::class);
    }
}
