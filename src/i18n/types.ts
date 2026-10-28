export type Locale = "zh" | "en";

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export const LOCALE_STORAGE_KEY = "pangza-docs-locale";
