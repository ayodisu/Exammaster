<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use HasFactory, SoftDeletes;

    public $incrementing = false;

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = self::generateUniqueId();
            }
        });
    }

    private static function generateUniqueId()
    {
        do {
            $id = mt_rand(10000000, 99999999);
        } while (self::where('id', $id)->exists());

        return $id;
    }

    protected $fillable = [
        'examiner_id',
        'title',
        'duration_minutes',
        'is_published',
        'settings_json',
        'type',
        'scheduled_at',
        'is_active',
        'enabled_at',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_active' => 'boolean',
        'scheduled_at' => 'datetime',
        'enabled_at' => 'datetime',
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
