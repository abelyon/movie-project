import { profileColorBgClass } from "../constants/profileColors";
import { userNameInitial } from "../utils/userDisplay";

const sizeClasses = {
  sm: "size-9 text-base font-semibold",
  md: "h-12 w-12 text-xl font-semibold",
  lg: "size-14 text-xl font-extrabold",
} as const;

const shapeClasses = {
  circle: "rounded-full",
  rounded: "rounded-3xl border-t border-neutral-600",
} as const;

export function UserAvatar({
  name,
  profileColor,
  size = "md",
  shape = "circle",
  bordered = false,
  className = "",
}: {
  name: string;
  profileColor?: string | null;
  size?: keyof typeof sizeClasses;
  shape?: keyof typeof shapeClasses;
  bordered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-space-grotesk leading-none tracking-wide text-neutral-100 ${profileColorBgClass(profileColor)} ${sizeClasses[size]} ${shapeClasses[shape]} ${bordered ? "border-2 border-neutral-900" : ""} ${className}`}
      aria-hidden
    >
      {userNameInitial(name)}
    </div>
  );
}
