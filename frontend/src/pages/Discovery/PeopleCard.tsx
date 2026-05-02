import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { PersonSearchResult } from "../../api/tmdb";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const PeopleCard = ({ person }: { person: PersonSearchResult }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const imageSrc = person.profile_path
    ? `${TMDB_IMAGE_BASE_URL}${person.profile_path}`
    : "https://placehold.co/500x750/171717/a3a3a3?text=No+Photo";

  return (
    <motion.div
      onClick={() => navigate(`/person/${person.id}`)}
      className="relative m-auto flex flex-col items-center justify-center rounded-4xl cursor-pointer aspect-2/3 w-full"
      initial={{ opacity: 1, y: 0, scale: 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative w-full h-full wmin-h-[280px] overflow-hidden rounded-4xl bg-neutral-800/80">
        <motion.img
          src={imageSrc}
          alt={person.name}
          className="w-full h-full object-cover"
          onLoad={() => setImageLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute inset-0 rounded-4xl bg-neutral-800/90"
          initial={false}
          animate={{ opacity: imageLoaded ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          style={{ pointerEvents: "none" }}
        >
          <motion.div
            className="absolute inset-0 rounded-4xl bg-linear-to-r from-transparent via-neutral-600/30 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            style={{ width: "60%", willChange: "transform" }}
          />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 pointer-events-none">
        <div className="rounded-3xl border-t border-neutral-600 bg-neutral-800/80 px-3 py-2 backdrop-blur-md">
          <p className="text-sm font-space-grotesk font-medium text-neutral-100 truncate">{person.name}</p>
          {person.known_for_department && (
            <p className="mt-0.5 text-xs text-neutral-300 truncate">{person.known_for_department}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PeopleCard;
