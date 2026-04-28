export type AppToastPayload = {
  title: string;
  message?: string;
  type?: "info" | "warning" | "error";
};

export const APP_TOAST_EVENT = "app:toast";

export function emitAppToast(payload: AppToastPayload): void {
  window.dispatchEvent(new CustomEvent<AppToastPayload>(APP_TOAST_EVENT, { detail: payload }));
}
