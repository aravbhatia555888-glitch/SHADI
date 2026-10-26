/**
 * Wedding Cards persistence service tests.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
deleteSavedCard,
getSavedCards,
saveWeddingCard,
} from "@/services/wedding-cards";
import { DEFAULT_CARD_DATA } from "@/types/wedding-card";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

describe("Wedding Cards persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it("returns an empty list when nothing is saved", async () => {
    const cards = await getSavedCards();
    expect(cards).toEqual([]);
  });

  it("saves a card and returns it with a derived name", async () => {
    let stored = "";
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (_key: string, value: string) => {
        stored = value;
        return Promise.resolve();
      }
    );
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored)
    );

    const saved = await saveWeddingCard("traditional-red", {
      ...DEFAULT_CARD_DATA,
      groomName: "Rahul",
      brideName: "Priya",
    });

    expect(saved).not.toBeNull();
    expect(saved!.templateId).toBe("traditional-red");
    expect(saved!.name).toBe("Rahul & Priya");
    expect(saved!.id).toBeTruthy();

    // Reload from storage
    const cards = await getSavedCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].data.groomName).toBe("Rahul");
  });

  it("updates an existing card instead of duplicating it", async () => {
    let stored = "";
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (_key: string, value: string) => {
        stored = value;
        return Promise.resolve();
      }
    );
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored)
    );

    const first = await saveWeddingCard("traditional-red", {
      ...DEFAULT_CARD_DATA,
      groomName: "Rahul",
      brideName: "Priya",
    });
    expect(first).not.toBeNull();

    const updated = await saveWeddingCard(
      "royal-gold",
      { ...DEFAULT_CARD_DATA, groomName: "Rahul", brideName: "Priya" },
      first!.id
    );

    expect(updated).not.toBeNull();
    expect(updated!.templateId).toBe("royal-gold");
    expect(updated!.id).toBe(first!.id);

    const cards = await getSavedCards();
    expect(cards).toHaveLength(1);
  });

  it("deletes a saved card", async () => {
    let stored = "";
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (_key: string, value: string) => {
        stored = value;
        return Promise.resolve();
      }
    );
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored)
    );

    const saved = await saveWeddingCard("traditional-red", DEFAULT_CARD_DATA);
    expect(saved).not.toBeNull();

    const ok = await deleteSavedCard(saved!.id);
    expect(ok).toBe(true);

    const cards = await getSavedCards();
    expect(cards).toHaveLength(0);
  });

  it("tolerates corrupted storage data", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("{not-json");
    const cards = await getSavedCards();
    expect(cards).toEqual([]);

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify([{ id: "x", nonsense: true }])
    );
    const filtered = await getSavedCards();
    expect(filtered).toEqual([]);
  });
});
