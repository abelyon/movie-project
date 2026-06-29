import { profileColorBgClass } from "../constants/profileColors";
import { userNameInitial } from "../utils/userDisplay";

export function WatchTogetherUserStack({
  initialFrom,
  label,
  profileColor,
  active = false,
}: {
  initialFrom: string;
  label: string;
  profileColor?: string | null;
  active?: boolean;
}) {
  return (
    <>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full font-space-grotesk font-semibold leading-none ${
          active
            ? "bg-neutral-200 text-neutral-900"
            : `${profileColorBgClass(profileColor)} text-neutral-100`
        }`}
        aria-hidden
      >
        {userNameInitial(initialFrom)}
      </span>
      <span className="mt-1 w-full truncate text-center font-space-grotesk font-medium text-[11px]">
        {label}
      </span>
    </>
  );
}
