import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TRACKS = [
  "digital-foundations",
  "productivity",
  "coding-web",
  "coding-python",
  "data",
  "design",
  "business",
  "finance",
  "career",
  "ai",
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function makeCourse(track, level, n) {
  const title = `${track.replaceAll("-", " ")} ${level} ${n}`;
  return {
    id: `${track}-${level.toLowerCase()}-${String(n).padStart(3, "0")}`,
    slug: slugify(`${track}-${level}-${n}`),
    title,
    track,
    level,
    minutes: level === "Beginner" ? 90 : level === "Intermediate" ? 150 : 240,
    summary: `A structured ${level.toLowerCase()} course in ${track.replaceAll("-", " ")}.`,
    grading: {
      model: "mastery",
      passMin: 70,
      components: [
        { name: "Quizzes", weight: 30, mastery: 80 },
        { name: "Projects", weight: 50, mastery: 75 },
        { name: "Final", weight: 20, mastery: 70 },
      ],
      rubric: [
        "Accuracy (0–4)",
        "Process (0–4)",
        "Communication (0–4)",
        "Professionalism (0–4)",
        "Accessibility (0–4)",
      ],
    },
    support: {
      channels: ["Help Center (24–48h)", "Course Q&A (12–24h)", "Mentor Office Hours"],
      accommodations: ["captions", "keyboard navigation", "extra time (by request)"],
    },
  };
}

const courses = [];
for (const track of TRACKS) {
  // 100 courses per track = 1000 total
  let n = 1;
  for (const level of LEVELS) {
    const count = level === "Beginner" ? 40 : 30; // 40+30+30=100 per track
    for (let i = 0; i < count; i++) courses.push(makeCourse(track, level, n++));
  }
}

const output = `/* AUTO-GENERATED. DO NOT EDIT BY HAND. */
export const COURSES = ${JSON.stringify(courses, null, 2)};
export type Course = (typeof COURSES)[number];
`;

writeFileSync(`${__dirname}/../app/courses/courses.data.ts`, output, "utf8");
console.log(`Generated ${courses.length} courses`);
