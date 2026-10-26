/**
 * Wedding Cards persistence service.
 *
 * Saved cards are stored locally in AsyncStorage (no server dependency).
 * Each saved card keeps the full WeddingCardData so the renderer and
 * card designer can restore it exactly.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WeddingCardData } from "@/types/wedding-card";
import { DEFAULT_CARD_DATA } from "@/types/wedding-card";

const STORAGE_KEY = "shaadi-saved-cards-v1";

// Serialize read-modify-write operations so overlapping calls (e.g. a save
// racing a focus-refresh reload) cannot drop updates.
let _queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = _queue.then(operation, operation);
  _queue = next.catch(() => undefined);
  return next;
}

export interface SavedWeddingCard {
  id: string;
  templateId: string;
  data: WeddingCardData;
  createdAt: string;
  /** Human-friendly title derived from the couple names. */
  name: string;
}

function buildName(data: WeddingCardData): string {
  const groom = data.groomName.trim();
  const bride = data.brideName.trim();
  if (groom && bride) return `${groom} & ${bride}`;
  return groom || bride || "Wedding Card";
}

function isSavedCard(value: unknown): value is SavedWeddingCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" &&
    typeof card.templateId === "string" &&
    typeof card.createdAt === "string" &&
    typeof card.data === "object" &&
    card.data !== null &&
    typeof (card.data as Record<string, unknown>).groomName === "string"
  );
}

async function readCards(): Promise<SavedWeddingCard[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedCard);
  } catch (error) {
    if (__DEV__) console.warn("Failed to load saved cards:", error);
    return [];
  }
}

export async function getSavedCards(): Promise<SavedWeddingCard[]> {
  return enqueue(readCards);
}

export function saveWeddingCard(
  templateId: string,
  data: WeddingCardData,
  existingId?: string
): Promise<SavedWeddingCard | null> {
  return enqueue(() => saveWeddingCardNow(templateId, data, existingId));
}

async function saveWeddingCardNow(
  templateId: string,
  data: WeddingCardData,
  existingId?: string
): Promise<SavedWeddingCard | null> {
  try {
    const cards = await readCards();
    const now = new Date().toISOString();

    let saved: SavedWeddingCard;
    if (existingId) {
      const existing = cards.find((c) => c.id === existingId);
      if (!existing) return null;
      saved = { ...existing, templateId, data, createdAt: existing.createdAt };
      const updated = cards.map((c) => (c.id === existingId ? saved : c));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else {
      saved = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        templateId,
        data,
        createdAt: now,
        name: buildName(data),
      };
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([saved, ...cards])
      );
    }

    return saved;
  } catch (error) {
    if (__DEV__) console.warn("Failed to save card:", error);
    return null;
  }
}

export function deleteSavedCard(cardId: string): Promise<boolean> {
  return enqueue(() => deleteSavedCardNow(cardId));
}

async function deleteSavedCardNow(cardId: string): Promise<boolean> {
  try {
    const cards = await readCards();
    const remaining = cards.filter((c) => c.id !== cardId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    return true;
  } catch (error) {
    if (__DEV__) console.warn("Failed to delete card:", error);
    return false;
  }
}

/** A card that shares DEFAULT_CARD_DATA — used by the share/restore helpers. */
export { DEFAULT_CARD_DATA };
