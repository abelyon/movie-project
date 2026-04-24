import { motion } from "motion/react";
import type { ReactNode } from "react";
import { navIconButtonMotion } from "../constants/motionInteraction";

/** Navbar / FAB / detail: scale+rotate only the icon, not the outer control. */
export function AnimatedNavIcon({ children }: { children: ReactNode }) {
  return (
    <motion.span
      className="inline-flex items-center justify-center [&>svg]:block"
      {...navIconButtonMotion}
    >
      {children}
    </motion.span>
  );
}
