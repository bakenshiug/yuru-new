import type { MainCategory, UserProfile } from "@/lib/types";

const STORAGE_KEY = "yuru-new:profile:v1";

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isUninterested(
  itemCategory: MainCategory,
  interests: MainCategory[]
): boolean {
  return !interests.includes(itemCategory);
}
