<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     *
     * @throws ValidationException
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['sometimes', 'string', 'max:255', Rule::unique(User::class, 'username')],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        $email = Str::lower($input['email']);
        $username = isset($input['username'])
            ? Str::lower($input['username'])
            : $this->generateUniqueUsername($email);

        return User::create([
            'name' => $input['name'],
            'username' => $username,
            'email' => $email,
            'password' => Hash::make($input['password']),
        ]);
    }

    private function generateUniqueUsername(string $email): string
    {
        $local = Str::before($email, '@');
        $base = Str::slug($local, '_') ?: 'user';
        $base = Str::limit($base, 200, '');

        $candidate = $base;
        $suffix = 1;

        while (User::query()->where('username', $candidate)->exists()) {
            $candidate = Str::limit($base.'_'.$suffix, 255, '');
            $suffix++;
        }

        return $candidate;
    }
}
