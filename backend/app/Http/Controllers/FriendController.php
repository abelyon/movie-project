<?php

namespace App\Http\Controllers;

use App\Mail\FriendRequestAcceptedMail;
use App\Mail\FriendRequestReceivedMail;
use App\Models\FriendRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class FriendController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $incoming = FriendRequest::query()
            ->with('requester:id,name,email,public_user_id')
            ->where('recipient_id', $user->id)
            ->where('status', 'pending')
            ->latest('id')
            ->get();

        $outgoing = FriendRequest::query()
            ->with('recipient:id,name,email,public_user_id')
            ->where('requester_id', $user->id)
            ->where('status', 'pending')
            ->latest('id')
            ->get();

        $accepted = FriendRequest::query()
            ->with([
                'requester:id,name,email,public_user_id',
                'recipient:id,name,email,public_user_id',
            ])
            ->where('status', 'accepted')
            ->where(function ($q) use ($user): void {
                $q->where('requester_id', $user->id)
                    ->orWhere('recipient_id', $user->id);
            })
            ->latest('id')
            ->get()
            ->map(function (FriendRequest $item) use ($user) {
                return $item->requester_id === $user->id ? $item->recipient : $item->requester;
            })
            ->values();

        return response()->json([
            'incoming' => $incoming,
            'outgoing' => $outgoing,
            'friends' => $accepted,
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'max:80'],
        ]);

        $authUser = $request->user();
        $rawQuery = trim($validated['query']);
        $targetUserId = strtoupper($rawQuery);
        $lowerQuery = mb_strtolower($rawQuery);

        $target = User::query()
            ->select(['id', 'name', 'email', 'public_user_id'])
            ->where(function ($q) use ($targetUserId, $rawQuery): void {
                $q->where('public_user_id', $targetUserId)
                    ->orWhere('name', 'like', '%' . $rawQuery . '%');
            })
            ->orderByRaw('CASE WHEN public_user_id = ? THEN 0 ELSE 1 END', [$targetUserId])
            ->orderByRaw('CASE WHEN LOWER(name) = ? THEN 0 ELSE 1 END', [$lowerQuery])
            ->orderByRaw('CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END', [$lowerQuery . '%'])
            ->orderBy('name')
            ->first();

        if (!$target || $target->id === $authUser->id) {
            return response()->json(['user' => null]);
        }

        $relation = FriendRequest::query()
            ->where(function ($q) use ($authUser, $target): void {
                $q->where('requester_id', $authUser->id)
                    ->where('recipient_id', $target->id);
            })
            ->orWhere(function ($q) use ($authUser, $target): void {
                $q->where('requester_id', $target->id)
                    ->where('recipient_id', $authUser->id);
            })
            ->latest('id')
            ->first();

        return response()->json([
            'user' => $target,
            'relationship' => $relation ? [
                'request_id' => $relation->id,
                'status' => $relation->status,
                'is_outgoing' => $relation->requester_id === $authUser->id,
            ] : null,
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'string', 'max:16', 'regex:/^USR-[A-Z0-9]+$/'],
        ]);

        $authUser = $request->user();
        $targetUserId = strtoupper(trim($validated['user_id']));
        $authPublicUserId = strtoupper((string) $authUser->public_user_id);

        if ($authPublicUserId !== '' && $targetUserId === $authPublicUserId) {
            throw ValidationException::withMessages([
                'user_id' => 'You cannot send a friend request to yourself.',
            ]);
        }

        $recipient = User::query()
            ->where('public_user_id', $targetUserId)
            ->first();

        if (!$recipient) {
            throw ValidationException::withMessages([
                'user_id' => 'No user found with this ID.',
            ]);
        }

        if ($recipient->id === $authUser->id) {
            throw ValidationException::withMessages([
                'user_id' => 'You cannot send a friend request to yourself.',
            ]);
        }

        $existingPending = FriendRequest::query()
            ->where('status', 'pending')
            ->where(function ($q) use ($authUser, $recipient): void {
                $q->where(function ($pair) use ($authUser, $recipient): void {
                    $pair->where('requester_id', $authUser->id)
                        ->where('recipient_id', $recipient->id);
                })->orWhere(function ($pair) use ($authUser, $recipient): void {
                    $pair->where('requester_id', $recipient->id)
                        ->where('recipient_id', $authUser->id);
                });
            })
            ->exists();

        if ($existingPending) {
            throw ValidationException::withMessages([
                'user_id' => 'A pending friend request already exists.',
            ]);
        }

        $existingAccepted = FriendRequest::query()
            ->where('status', 'accepted')
            ->where(function ($q) use ($authUser, $recipient): void {
                $q->where(function ($pair) use ($authUser, $recipient): void {
                    $pair->where('requester_id', $authUser->id)
                        ->where('recipient_id', $recipient->id);
                })->orWhere(function ($pair) use ($authUser, $recipient): void {
                    $pair->where('requester_id', $recipient->id)
                        ->where('recipient_id', $authUser->id);
                });
            })
            ->exists();

        if ($existingAccepted) {
            throw ValidationException::withMessages([
                'user_id' => 'You are already friends with this user.',
            ]);
        }

        $friendRequest = FriendRequest::query()->updateOrCreate(
            [
                'requester_id' => $authUser->id,
                'recipient_id' => $recipient->id,
            ],
            [
                'status' => 'pending',
                'responded_at' => null,
            ]
        );

        // Notify recipient by email when a new friend request is sent.
        Mail::to($recipient->email)->send(
            new FriendRequestReceivedMail($recipient, $authUser)
        );

        return response()->json([
            'request' => $friendRequest->load('recipient:id,name,email,public_user_id'),
        ], 201);
    }

    public function accept(Request $request, FriendRequest $friendRequest): JsonResponse
    {
        $authUser = $request->user();
        if ($friendRequest->recipient_id !== $authUser->id) {
            abort(403);
        }
        if ($friendRequest->status !== 'pending') {
            throw ValidationException::withMessages([
                'request' => 'Only pending requests can be accepted.',
            ]);
        }

        $friendRequest->update([
            'status' => 'accepted',
            'responded_at' => now(),
        ]);

        $requester = $friendRequest->requester()->first();
        $recipient = $friendRequest->recipient()->first();
        if ($requester && $recipient) {
            // Notify original sender that the request was accepted.
            Mail::to($requester->email)->send(
                new FriendRequestAcceptedMail($requester, $recipient)
            );
        }

        return response()->json([
            'request' => $friendRequest->load([
                'requester:id,name,email,public_user_id',
                'recipient:id,name,email,public_user_id',
            ]),
        ]);
    }

    public function deny(Request $request, FriendRequest $friendRequest): JsonResponse
    {
        $authUser = $request->user();
        if ($friendRequest->recipient_id !== $authUser->id) {
            abort(403);
        }
        if ($friendRequest->status !== 'pending') {
            throw ValidationException::withMessages([
                'request' => 'Only pending requests can be denied.',
            ]);
        }

        $friendRequest->update([
            'status' => 'denied',
            'responded_at' => now(),
        ]);

        return response()->json([
            'request' => $friendRequest->load([
                'requester:id,name,email,public_user_id',
                'recipient:id,name,email,public_user_id',
            ]),
        ]);
    }
}
