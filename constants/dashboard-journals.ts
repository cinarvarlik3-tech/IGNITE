import type { JournalPromptSection } from "@/types/dashboard-journals";

export const DASHBOARD_JOURNAL_SECTIONS: JournalPromptSection[] = [
  {
    title: "SITUATIONAL",
    subtitle: "For a specific moment, conversation, or stress spike.",
    items: [
      {
        id: "knowing-your-needs",
        title: "Knowing Your Needs",
        subtitle: "",
        icon: "🧭",
        badge: "recommended",
      },
      {
        id: "nervous-system-rebalancing",
        title: "Nervous System Rebalancing",
        subtitle: "",
        icon: "🦋",
      },
      {
        id: "communication-breakdown",
        title: "Communication Breakdown",
        subtitle: "",
        icon: "💬",
        badge: "popular",
      },
      {
        id: "conversation-prep",
        title: "Conversation Prep",
        subtitle: "",
        icon: "🗨️",
      },
      {
        id: "conflict-reset",
        title: "Conflict Reset",
        subtitle: "",
        icon: "⚡",
        badge: "new",
      },
      {
        id: "boundary-setting",
        title: "Boundary Setting",
        subtitle: "",
        icon: "🛑",
      },
    ],
  },
  {
    title: "DAILY",
    subtitle: "Rhythms and check-ins you can repeat.",
    items: [
      {
        id: "gratitude-journal",
        title: "Gratitude Journal",
        subtitle: "",
        icon: "❤️",
        badge: "popular",
      },
      {
        id: "weekly-relationship-check-in",
        title: "Weekly Relationship Check-in",
        subtitle: "",
        icon: "📅",
      },
      {
        id: "evening-reflection",
        title: "Evening Reflection",
        subtitle: "",
        icon: "🌙",
      },
      {
        id: "dream-journal",
        title: "Dream Journal",
        subtitle: "",
        icon: "💤",
      },
      {
        id: "morning-intentions",
        title: "Morning Intentions",
        subtitle: "",
        icon: "🌅",
        badge: "new",
      },
      {
        id: "mood-tracker",
        title: "Mood Tracker",
        subtitle: "",
        icon: "📊",
      },
    ],
  },
  {
    title: "GROWTH",
    subtitle: "Deeper patterns, habits, and who you want to become.",
    items: [
      {
        id: "self-awareness-audit",
        title: "Self Awareness Audit",
        subtitle: "",
        icon: "🪞",
        badge: "recommended",
      },
      {
        id: "habit-builder",
        title: "Habit Builder",
        subtitle: "",
        icon: "🔁",
        badge: "new",
      },
      {
        id: "emotional-patterns",
        title: "Emotional Patterns",
        subtitle: "",
        icon: "🧠",
        badge: "popular",
      },
      {
        id: "trigger-mapping",
        title: "Trigger Mapping",
        subtitle: "",
        icon: "🎯",
      },
      {
        id: "personal-values",
        title: "Personal Values",
        subtitle: "",
        icon: "📌",
      },
    ],
  },
];
