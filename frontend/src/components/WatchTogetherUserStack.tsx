import { userNameInitial } from "../utils/userDisplay";

/** Avatar initial + label row, matching the Saved watch-together friend picker. */
export function WatchTogetherUserStack({
  initialFrom,
  label,
  active = false,
}: {
  /** Source string for the capitalized initial (e.g. real name when label is "You"). */
  initialFrom: string;
  label: string;
  active?: boolean;
}) {
  return (
    <>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full font-space-grotesk font-semibold leading-none ${
          active ? "bg-neutral-200 text-neutral-900" : "bg-neutral-700/80 text-neutral-100"
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
