<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Violation extends Model
{
    use HasFactory;

    protected $fillable = [
        'attempt_id',
        'type',
        'occurred_at',
        'details',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function attempt()
    {
        return $this->belongsTo(Attempt::class);
    }
}
