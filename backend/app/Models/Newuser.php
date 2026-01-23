<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Newuser extends Model
{
    /** @use HasFactory<\Database\Factories\NewuserFactory> */
    use HasFactory;
    use SoftDeletes;

      protected $fillable = [
            'username',
            'email',
            'password',
            'ratings',
            'seen_it',
            'favourite_genres'
      ];
}
