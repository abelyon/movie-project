import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LogOut, Mail, UserPlus, UserRound, Users, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  acceptFriendRequest,
  denyFriendRequest,
  getFriendOverview,
  removeFriend,
  searchUser,
  sendFriendRequest,
} from "../../api/friends";
import { updateProfile } from "../../api/auth";

const cardClass =
  "rounded-4xl border-t border-neutral-600 bg-neutral-800/80 p-5 backdrop-blur-md";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, refetchUser } = useAuth();
  const qc = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [searchUserId, setSearchUserId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [nameError, setNameError] = useState("");
  const [nameSaved, setNameSaved] = useState("");

  useEffect(() => {
    setNameInput(user?.name ?? "");
  }, [user?.name]);

  const joinedAt = useMemo(() => {
    if (!user?.created_at) return "Unknown";
    const date = new Date(user.created_at);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }, [user?.created_at]);

  const handleLogout = async () => {
    setError("");
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const friendsOverview = useQuery({
    queryKey: ["friends", "overview"],
    queryFn: getFriendOverview,
  });

  const searchMutation = useMutation({
    mutationFn: searchUser,
    onError: () => setSearchError("Could not search user right now."),
  });

  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["friends", "overview"] });
      setSearchError("");
      setSearchUserId("");
    },
    onError: () => setSearchError("Could not send request."),
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["friends", "overview"] });
    },
  });

  const denyMutation = useMutation({
    mutationFn: denyFriendRequest,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["friends", "overview"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["friends", "overview"] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      setNameSaved("Name updated.");
      setNameError("");
      await refetchUser();
    },
    onError: () => {
      setNameSaved("");
      setNameError("Could not update name. Use 3-255 characters.");
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    const trimmed = searchUserId.trim();
    if (!trimmed) {
      setSearchError("Enter a user ID or name.");
      return;
    }
    await searchMutation.mutateAsync(trimmed);
  };

  const searchResult = searchMutation.data;
  const isSelfResult = !!searchResult?.user && searchResult.user.id === user?.id;
  const canSendRequest =
    !!searchResult?.user &&
    !isSelfResult &&
    !searchResult.relationship;

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 text-neutral-300">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 pb-28 text-white">
      <div className={cardClass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-neutral-400">Profile</p>
            <h1 className="mt-1 text-3xl font-space-grotesk font-bold">{user.name}</h1>
          </div>
          <div className="rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-3 text-neutral-200">
            <UserRound size={22} strokeWidth={2.5} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-4">
            <p className="font-space-grotesk text-xs uppercase tracking-wide text-neutral-500">User ID</p>
            <p className="mt-1 font-space-grotesk text-neutral-100">{user.public_user_id}</p>
          </div>

          <div className="rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-4">
            <p className="font-space-grotesk text-xs uppercase tracking-wide text-neutral-500">Email</p>
            <p className="mt-1 flex items-center gap-2 break-all font-space-grotesk text-neutral-100">
              <Mail size={14} />
              {user.email}
            </p>
          </div>

          <div className="rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-4">
            <p className="font-space-grotesk text-xs uppercase tracking-wide text-neutral-500">Joined</p>
            <p className="mt-1 font-space-grotesk text-neutral-100">{joinedAt}</p>
          </div>

          <div className="rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-4">
            <p className="font-space-grotesk text-xs uppercase tracking-wide text-neutral-500">Name</p>
            <form
              className="mt-2 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                setNameSaved("");
                setNameError("");
                const trimmed = nameInput.trim();
                if (trimmed.length < 3) {
                  setNameError("Name must be at least 3 characters.");
                  return;
                }
                void updateProfileMutation.mutateAsync({
                  name: trimmed,
                });
              }}
            >
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your display name"
                className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 font-space-grotesk text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
              />
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="rounded-2xl border-t border-neutral-500 bg-neutral-200 px-4 py-2 font-space-grotesk text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </button>
            </form>
            {nameError && <p className="mt-2 text-xs text-red-300">{nameError}</p>}
            {nameSaved && <p className="mt-2 text-xs text-emerald-300">{nameSaved}</p>}
          </div>
        </div>
      </div>

      <div className={`${cardClass} mt-4`}>
        <h2 className="font-space-grotesk text-lg font-semibold">Friends</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Search by user ID or name and send friend requests.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            placeholder="Example: USR-1A2B3C or Abel"
            className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2.5 font-space-grotesk text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
          />
          <button
            type="submit"
            disabled={searchMutation.isPending}
            className="rounded-2xl border-t border-neutral-500 bg-neutral-200 px-4 py-2.5 font-space-grotesk font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchMutation.isPending ? "Searching..." : "Search"}
          </button>
        </form>

        {searchError && (
          <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {searchError}
          </p>
        )}

        {searchResult && (
          <div className="mt-4 rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-4">
            {searchResult.user ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-space-grotesk font-semibold text-neutral-100">{searchResult.user.name}</p>
                  <p className="text-sm text-neutral-400">{searchResult.user.public_user_id}</p>
                </div>
                {canSendRequest ? (
                  <button
                    type="button"
                    onClick={() => void sendRequestMutation.mutateAsync(searchResult.user!.public_user_id)}
                    disabled={sendRequestMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-2xl border-t border-neutral-500 bg-neutral-200 px-4 py-2 font-space-grotesk font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserPlus size={16} />
                    {sendRequestMutation.isPending ? "Sending..." : "Send request"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {searchResult.relationship?.status === "pending" &&
                    !searchResult.relationship.is_outgoing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void acceptMutation.mutateAsync(searchResult.relationship!.request_id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/80 px-2 py-1 text-xs font-semibold text-white"
                        >
                          <Check size={12} /> Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => void denyMutation.mutateAsync(searchResult.relationship!.request_id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-red-500/80 px-2 py-1 text-xs font-semibold text-white"
                        >
                          <X size={12} /> Deny
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-neutral-400">
                        {isSelfResult
                          ? "You cannot send a request to yourself"
                          : searchResult.relationship?.status === "accepted"
                          ? "Already friends"
                          : searchResult.relationship?.is_outgoing
                            ? "Request already sent"
                            : "Request is not pending"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No user found for this ID or name.</p>
            )}
          </div>
        )}

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-4">
            <p className="font-space-grotesk text-sm font-semibold text-neutral-200">Incoming</p>
            <div className="mt-3 space-y-2">
              {(friendsOverview.data?.incoming ?? []).length === 0 ? (
                <p className="text-sm text-neutral-500">No pending requests.</p>
              ) : (
                friendsOverview.data?.incoming.map((req) => (
                  <div key={req.id} className="rounded-2xl border border-neutral-700/60 px-3 py-2">
                    <p className="font-space-grotesk text-sm text-neutral-100">{req.requester?.name}</p>
                    <p className="text-xs text-neutral-500">{req.requester?.public_user_id}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void acceptMutation.mutateAsync(req.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/80 px-2 py-1 text-xs font-semibold text-white"
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void denyMutation.mutateAsync(req.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-red-500/80 px-2 py-1 text-xs font-semibold text-white"
                      >
                        <X size={12} /> Deny
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-4">
            <p className="font-space-grotesk text-sm font-semibold text-neutral-200">Outgoing</p>
            <div className="mt-3 space-y-2">
              {(friendsOverview.data?.outgoing ?? []).length === 0 ? (
                <p className="text-sm text-neutral-500">No sent requests.</p>
              ) : (
                friendsOverview.data?.outgoing.map((req) => (
                  <div key={req.id} className="rounded-2xl border border-neutral-700/60 px-3 py-2">
                    <p className="font-space-grotesk text-sm text-neutral-100">{req.recipient?.name}</p>
                    <p className="text-xs text-neutral-500">{req.recipient?.public_user_id}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border-t border-neutral-600 bg-neutral-900/70 p-4">
            <p className="inline-flex items-center gap-2 font-space-grotesk text-sm font-semibold text-neutral-200">
              <Users size={15} /> Friends
            </p>
            <div className="mt-3 space-y-2">
              {(friendsOverview.data?.friends ?? []).length === 0 ? (
                <p className="text-sm text-neutral-500">No friends yet.</p>
              ) : (
                friendsOverview.data?.friends.map((friend) => (
                  <div key={friend.id} className="rounded-2xl border border-neutral-700/60 px-3 py-2">
                    <p className="font-space-grotesk text-sm text-neutral-100">{friend.name}</p>
                    <p className="text-xs text-neutral-500">{friend.public_user_id}</p>
                    <button
                      type="button"
                      onClick={() => void removeFriendMutation.mutateAsync(friend.id)}
                      disabled={removeFriendMutation.isPending}
                      className="mt-2 rounded-xl border border-red-400/40 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removeFriendMutation.isPending ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`${cardClass} mt-4`}>
        <h2 className="font-space-grotesk text-lg font-semibold">Session</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Use logout if you are on a shared device.
        </p>
        {error && (
          <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border-t border-neutral-500 bg-neutral-200 px-4 py-2.5 font-space-grotesk font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={16} />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;