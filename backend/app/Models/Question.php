<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'topic_id',
        'exam_id',
        'text',
        'type',
        'difficulty',
        'options_json',
        'correct_answer',
        'explanation',
    ];

    protected $casts = [
        'options_json' => 'array',
    ];

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
}
