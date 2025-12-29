import "server-only";
import { cache } from "react";
import { COURSES } from "./courses.data";

type Course = any;

type IndexedCourse = Course & {
  __track: string;
  __level: string;
  __text: string; // prebuilt searchable blob
};

const INDEX: IndexedCourse[] = (COURSES as Course[]).map((c) => {
  const title = String(c.title ?? "");
  const summary = String(c.summary ?? "");
  const skills = Array.isArray(c.skills) ? c.skills.join(" ") : "";
  return {
    ...c,
    __track: String(c.track ?? "").toLowerCase().trim(),
    __level: String(c.level ?? "").toLowerCase().trim(),
    __text: (title + " " + summary + " " + skills).toLowerCase(),
  };
});

// Memoized query function (reused across requests in the same server process)
export const queryCourses = cache(function queryCourses(input: {
  q?: string;
  track?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = input.pageSize ?? 24;
  const q = (input.q ?? "").toLowerCase().trim();
  const track = (input.track ?? "").toLowerCase().trim();
  const level = (input.level ?? "").toLowerCase().trim();
  const page = Math.max(1, input.page ?? 1);

  let filtered = INDEX;

  if (track) filtered = filtered.filter((c) => c.__track === track);
  if (level) filtered = filtered.filter((c) => c.__level === level);
  if (q) filtered = filtered.filter((c) => c.__text.includes(q));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const items = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Strip internal fields so you don’t accidentally render them
  const cleanItems = items.map(({ __track, __level, __text, ...rest }) => rest);

  return { items: cleanItems, total, totalPages, safePage, pageSize };
});
