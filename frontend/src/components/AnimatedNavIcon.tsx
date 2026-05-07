import { motion } from "motion/react";
import type { ReactNode } from "react";
import { navIconButtonMotion } from "../constants/motionInteraction";
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
