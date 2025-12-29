export type Course = {
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  summary: string;
  tags?: string[];
};

export const COURSES: Course[] = [
  {
    slug: "digital-skills-foundations",
    title: "Digital Skills Foundations",
    level: "Beginner",
    minutes: 90,
    summary: "Email, documents, web safety, and everyday digital confidence.",
    tags: ["Essential", "Accessible"],
  },
  {
    slug: "ai-for-learning",
    title: "AI for Learning (Practical)",
    level: "Beginner",
    minutes: 75,
    summary: "Use AI responsibly to study faster, write better, and plan projects.",
    tags: ["AI", "Study"],
  },
];

