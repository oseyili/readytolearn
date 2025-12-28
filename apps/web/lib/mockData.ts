import type { Role } from "@readytolearn/ui";

export function getDemoRole(): Role {
  const env = process.env.NEXT_PUBLIC_DEMO_ROLE as Role | undefined;
  return env ?? "learner";
}

export function getGreeting(role: Role) {
  const map: Record<Role, string> = {
    learner: "Today’s Focus",
    supporter: "Learner Support Overview",
    employer: "Talent Pipeline Overview",
    admin: "System Health Overview",
    investor: "Performance Overview",
  };
  return map[role];
}

export const demo = {
  learner: {
    level: "Intermediate",
    nextAction: "Continue: Algebra Foundations (10 min)",
    unlocked: "Internship-ready: Junior Support Analyst (remote)",
    skills: ["Numeracy", "Critical Thinking", "Digital Literacy"],
  },
  supporter: { monitored: 8, alerts: 2, note: "Two learners show overload signals — recommend Simple Mode + shorter sessions." },
  employer: { openPipelines: 3, candidatesReady: 12, sponsorCTA: "Sponsor 25 learners into an internship track" },
  admin: { users: 1240, certificates: 410, payments: "Card 62% · Mobile 24% · Bank 10% · Crypto 4%" },
  investor: { arr: "£420k", growth: "+12.3% QoQ", retention: "Monthly 74%" },
};
