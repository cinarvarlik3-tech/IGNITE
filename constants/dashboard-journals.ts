import type { JournalPromptSection } from "@/types/dashboard-journals";

export const DASHBOARD_JOURNAL_SECTIONS: JournalPromptSection[] = [
  {
    title: "SITUATIONAL",
    subtitle: "For a specific moment, conversation, or stress spike.",
    items: [
      {
        id: "knowing-your-needs",
        title: "Knowing Your Needs",
        subtitle: "with Emilee Crowder",
        icon: "🧭",
        badge: "recommended",
      },
      {
        id: "nervous-system-rebalancing",
        title: "Nervous System Rebalancing",
        subtitle: "with Raelan Agle",
        icon: "🦋",
      },
      {
        id: "communication-breakdown",
        title: "Communication Breakdown",
        subtitle: "with Jessica Hunt, LCSW",
        icon: "💬",
        badge: "popular",
      },
      {
        id: "conversation-prep",
        title: "Conversation Prep",
        subtitle: "by Rosebud",
        icon: "🗨️",
      },
      {
        id: "conflict-reset",
        title: "Conflict Reset",
        subtitle: "with Dr. Lena Morris",
        icon: "⚡",
        badge: "new",
      },
      {
        id: "boundary-setting",
        title: "Boundary Setting",
        subtitle: "with Alex Rivera",
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
        subtitle: "by Rosebud",
        icon: "❤️",
        badge: "popular",
      },
      {
        id: "weekly-relationship-check-in",
        title: "Weekly Relationship Check-in",
        subtitle: "by Rosebud",
        icon: "📅",
      },
      {
        id: "evening-reflection",
        title: "Evening Reflection",
        subtitle: "by Rosebud",
        icon: "🌙",
      },
      {
        id: "dream-journal",
        title: "Dream Journal",
        subtitle: "by Rosebud",
        icon: "💤",
      },
      {
        id: "morning-intentions",
        title: "Morning Intentions",
        subtitle: "by Rosebud",
        icon: "🌅",
        badge: "new",
      },
      {
        id: "mood-tracker",
        title: "Mood Tracker",
        subtitle: "by Rosebud",
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
        subtitle: "with Dr. Kim Lee",
        icon: "🪞",
        badge: "recommended",
      },
      {
        id: "habit-builder",
        title: "Habit Builder",
        subtitle: "by Rosebud",
        icon: "🔁",
        badge: "new",
      },
      {
        id: "emotional-patterns",
        title: "Emotional Patterns",
        subtitle: "with Sarah Klein",
        icon: "🧠",
        badge: "popular",
      },
      {
        id: "trigger-mapping",
        title: "Trigger Mapping",
        subtitle: "with Rosebud",
        icon: "🎯",
      },
      {
        id: "personal-values",
        title: "Personal Values",
        subtitle: "with Daniel Scott",
        icon: "📌",
      },
    ],
  },
];
