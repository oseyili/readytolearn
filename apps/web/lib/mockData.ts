import type { Role } from "@readytolearn/ui";

export function getDemoRole(): Role {
  const env = process.env.NEXT_PUBLIC_DEMO_ROLE as Role | undefined;
  return env ?? "learner";
}

export function getGreeting(role: Role) {
  const map: Record<Role, string> = {
    student: "Today’s Focus",
    learner: "Today’s Focus",
    supporter: "Learner Support Overview",
    employer: "Talent Pipeline Overview",
    admin: "System Health Overview",
  };

  return map[role];
}
