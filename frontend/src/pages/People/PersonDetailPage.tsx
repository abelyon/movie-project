import { Fragment, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, User } from "lucide-react";
import { fetchPerson, type PersonCreditRow } from "../../api/tmdb";
import type { MediaItem } from "../../api/types";
import { AnimatedNavIcon } from "../../components/AnimatedNavIcon";
import MediaCard from "../Discovery/MediaCard";
import { useSavedList } from "../../hooks/useMedia";
import { stateKey } from "../../api/userMedia";
import {
  mediaBadgeHeroClass,
  mediaBadgeHeroIconSize,
} from "../../constants/mediaBadges";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const HERO_PROFILE_SIZE = "w1280";
const NO_PHOTO_PLACEHOLDER =
  "https://placehold.co/1280x720/171717/a3a3a3?text=No+Photo";

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const enterFast = { duration: 0.22, ease } as const;
const pill =
  "flex items-center justify-center bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md rounded-4xl p-4 cursor-pointer transition-colors";
const actionButtonInactive = "text-neutral-400";

const infoPillClass =
  "flex h-10 shrink-0 items-center justify-center rounded-[26px] border-t border-neutral-600 bg-neutral-800/80 px-4 py-2 font-space-grotesk text-base font-bold text-neutral-300";

const horizontalScrollOuterClass =
  "-mx-5 overflow-x-auto px-5 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const horizontalScrollInnerClass = "flex w-max gap-5";

function SectionHeader({
  title,
  emphasized = false,
}: {
  title: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <h2
        className={`font-space-grotesk text-2xl uppercase text-neutral-100 ${
          emphasized ? "font-extrabold" : "font-bold"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

function MetadataDot() {
  return <span className="size-1 shrink-0 rounded-[2px] bg-neutral-300" aria-hidden />;
}

function personCreditToMediaItem(item: PersonCreditRow): MediaItem {
  return {
    id: item.id,
    media_type: item.media_type,
    title: item.title,
    name: item.name,
    poster_path: item.poster_path ?? null,
    backdrop_path: item.backdrop_path ?? null,
    overview: item.overview,
    vote_average: item.vote_average,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
  };
}

const PersonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const personId = Number.parseInt(id ?? "", 10);
  const [bioExpanded, setBioExpanded] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    setBioExpanded(false);
  }, [id]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["tmdb", "person", personId],
    queryFn: () => fetchPerson(personId),
    enabled: Number.isFinite(personId),
    staleTime: 5 * 60 * 1000,
  });

  const directingItems: MediaItem[] = useMemo(
    () => (data?.directing_credits ?? []).map(personCreditToMediaItem),
    [data?.directing_credits],
  );

  const actingItems: MediaItem[] = useMemo(
    () => (data?.credits ?? []).map(personCreditToMediaItem),
    [data?.credits],
  );

  const { data: savedList } = useSavedList();
  const savedSet = useMemo(
    () => new Set((savedList ?? []).map((item) => stateKey(item.id, item.media_type))),
    [savedList],
  );

  if (!Number.isFinite(personId)) {
    return <div className="p-5 text-neutral-400">Invalid route</div>;
  }

  if (isPending) {
    return (
      <div className="overflow-hidden text-white">
        <div className="h-[290px] animate-pulse bg-neutral-800/80" />
        <div className="flex flex-col gap-9 px-5 py-9">
          <div className="flex flex-wrap justify-center gap-3">
            <div className="h-10 w-32 rounded-[26px] bg-neutral-800/80 animate-pulse" />
            <div className="h-10 w-40 rounded-[26px] bg-neutral-800/80 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-7 w-28 rounded bg-neutral-800/80 animate-pulse" />
            <div className="h-4 w-full rounded bg-neutral-800/80 animate-pulse" />
            <div className="h-4 w-[92%] rounded bg-neutral-800/80 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-7 w-36 rounded bg-neutral-800/80 animate-pulse" />
            <div className="flex gap-5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[264px] w-44 shrink-0 rounded-4xl bg-neutral-800/80 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <p className="p-5 text-red-400">Error: {(error as Error).message}</p>;
  }

  if (!data) return null;

  const heroImage = data.profile_path
    ? `${TMDB_IMAGE_BASE}/${HERO_PROFILE_SIZE}${data.profile_path}`
    : null;

  const metadataParts = [
    data.birthday ? data.birthday.slice(0, 4) : null,
    data.known_for_department ?? null,
  ].filter((part): part is string => Boolean(part));

  const infoPills = [data.birthday, data.place_of_birth].filter(
    (part): part is string => Boolean(part),
  );

  const actingSectionTitle =
    directingItems.length > 0 ? "Acting & other credits" : "Film & TV";

  return (
    <div className="overflow-hidden text-white">
      <section className="relative h-[290px] w-full overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top"
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <img
            src={NO_PHOTO_PLACEHOLDER}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-b from-neutral-500/0 via-neutral-950/20 to-neutral-950"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(125,125,125,0) 0%, #0a0a0a 86.5%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className={mediaBadgeHeroClass}>
              <User
                size={mediaBadgeHeroIconSize}
                strokeWidth={2.5}
                className="text-neutral-100"
              />
            </span>
          </div>

          <motion.div
            className="flex flex-col items-center gap-2.5 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={enterFast}
          >
            <h1 className="font-space-grotesk text-[32px] font-bold uppercase leading-tight text-neutral-100">
              {data.name}
            </h1>
            {metadataParts.length > 0 && (
              <div className="flex items-center justify-center gap-5 font-space-grotesk text-xl font-bold text-neutral-300">
                {metadataParts.map((part, index) => (
                  <Fragment key={`${part}-${index}`}>
                    {index > 0 ? <MetadataDot /> : null}
                    <span>{part}</span>
                  </Fragment>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <motion.main
        className="flex flex-col gap-9 px-5 pt-0"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enterFast}
      >
        {infoPills.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {infoPills.map((label) => (
              <span key={label} className={infoPillClass}>
                {label}
              </span>
            ))}
          </div>
        )}

        {data.biography && (
          <section className="flex flex-col gap-3">
            <SectionHeader title="Biography" emphasized />
            <p
              className={`font-space-grotesk font-medium leading-relaxed text-neutral-300 ${
                bioExpanded ? "" : "line-clamp-3"
              } ${!bioExpanded ? "cursor-pointer" : ""}`}
              onDoubleClick={() => setBioExpanded((prev) => !prev)}
              title={bioExpanded ? undefined : "Double-click to read more"}
            >
              {data.biography}
            </p>
          </section>
        )}

        {directingItems.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeader title="Directed" emphasized />
            <div className={horizontalScrollOuterClass}>
              <div className={horizontalScrollInnerClass}>
                {directingItems.map((item) => (
                  <div key={`dir-${item.media_type}-${item.id}`} className="w-44 shrink-0">
                    <MediaCard
                      item={item}
                      isSaved={savedSet.has(stateKey(item.id, item.media_type))}
                      scrollToTopOnOpen
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {actingItems.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeader title={actingSectionTitle} emphasized />
            <div className={horizontalScrollOuterClass}>
              <div className={horizontalScrollInnerClass}>
                {actingItems.map((item) => (
                  <div key={`cast-${item.media_type}-${item.id}`} className="w-44 shrink-0">
                    <MediaCard
                      item={item}
                      isSaved={savedSet.has(stateKey(item.id, item.media_type))}
                      scrollToTopOnOpen
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {directingItems.length === 0 && actingItems.length === 0 && (
          <p className="text-sm text-neutral-500 font-space-grotesk">
            No movie or TV credits found.
          </p>
        )}
      </motion.main>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3">
        <motion.button
          type="button"
          onClick={() => navigate(-1)}
          className={`${pill} ${actionButtonInactive}`}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedNavIcon>
            <ArrowLeft size={24} strokeWidth={2.5} />
          </AnimatedNavIcon>
        </motion.button>
      </div>
    </div>
  );
};

export default PersonDetailPage;
