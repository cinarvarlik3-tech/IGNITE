export type JournalPromptBadge = "recommended" | "new" | "popular";

export interface JournalPromptItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge?: JournalPromptBadge;
}

export interface JournalPromptSection {
  title: string;
  /** One-line mental model for why this bucket exists */
  subtitle: string;
  items: JournalPromptItem[];
}
