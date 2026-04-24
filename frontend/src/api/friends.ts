import api from "./client";
import { getCsrfCookie } from "./auth";

export type FriendUser = {
  id: number;
  name: string;
  email: string;
  public_user_id: string;
};

export type FriendRequestRow = {
  id: number;
  requester_id: number;
  recipient_id: number;
  status: "pending" | "accepted" | "denied";
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  requester?: FriendUser;
  recipient?: FriendUser;
};

export type FriendIndexResponse = {
  incoming: FriendRequestRow[];
  outgoing: FriendRequestRow[];
  friends: FriendUser[];
};

export type FriendSearchResponse = {
  user: FriendUser | null;
  relationship: {
    request_id: number;
    status: "pending" | "accepted" | "denied";
    is_outgoing: boolean;
  } | null;
};

export async function getFriendOverview(): Promise<FriendIndexResponse> {
  const { data } = await api.get<FriendIndexResponse>("/friends");
  return data;
}

export async function searchUserByPublicId(userId: string): Promise<FriendSearchResponse> {
  const { data } = await api.get<FriendSearchResponse>("/friends/search", {
    params: { user_id: userId },
  });
  return data;
}

export async function sendFriendRequest(userId: string): Promise<FriendRequestRow> {
  await getCsrfCookie();
  const { data } = await api.post<{ request: FriendRequestRow }>("/friends/requests", {
    user_id: userId,
  });
  return data.request;
}

export async function acceptFriendRequest(requestId: number): Promise<FriendRequestRow> {
  await getCsrfCookie();
  const { data } = await api.post<{ request: FriendRequestRow }>(
    `/friends/requests/${requestId}/accept`,
  );
  return data.request;
}

export async function denyFriendRequest(requestId: number): Promise<FriendRequestRow> {
  await getCsrfCookie();
  const { data } = await api.post<{ request: FriendRequestRow }>(
    `/friends/requests/${requestId}/deny`,
  );
  return data.request;
}
