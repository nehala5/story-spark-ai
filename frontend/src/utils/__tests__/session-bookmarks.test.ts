import {
  getSessionBookmarks,
  addSessionBookmark,
  removeSessionBookmark,
  isSessionBookmarked,
} from "../session-bookmarks";

describe("session-bookmarks utility", () => {
  const SESSION_KEY = "story_spark_session_bookmarks";

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe("getSessionBookmarks", () => {
    it("should return empty array if no bookmarks in sessionStorage", () => {
      expect(getSessionBookmarks()).toEqual([]);
    });

    it("should parse and return stored bookmarks", () => {
      const mockBookmarks = [{ uuid: "123", title: "Test Story" }];
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(mockBookmarks));

      expect(getSessionBookmarks()).toEqual(mockBookmarks);
    });

    it("should handle JSON parse errors gracefully and return empty array", () => {
      sessionStorage.setItem(SESSION_KEY, "invalid-json{");
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(getSessionBookmarks()).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("addSessionBookmark", () => {
    it("should add a new bookmark and dispatch change event", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      const story = { uuid: "123", title: "New Story" } as any;

      addSessionBookmark(story);

      expect(getSessionBookmarks()).toEqual([story]);
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
      expect(dispatchSpy.mock.calls[0][0].type).toBe("session_bookmarks_changed");
    });

    it("should not add a duplicate bookmark based on uuid", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      const story1 = { uuid: "123", title: "Story 1" } as any;
      const story2 = { uuid: "123", title: "Story 1 Duplicate" } as any;

      addSessionBookmark(story1);
      dispatchSpy.mockClear();

      // Attempt to add duplicate
      addSessionBookmark(story2);

      expect(getSessionBookmarks()).toEqual([story1]);
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("removeSessionBookmark", () => {
    it("should remove bookmark by uuid and dispatch change event", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      const story1 = { uuid: "123", title: "Story 1" } as any;
      const story2 = { uuid: "456", title: "Story 2" } as any;

      sessionStorage.setItem(SESSION_KEY, JSON.stringify([story1, story2]));

      removeSessionBookmark("123");

      expect(getSessionBookmarks()).toEqual([story2]);
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
      expect(dispatchSpy.mock.calls[0][0].type).toBe("session_bookmarks_changed");
    });
  });

  describe("isSessionBookmarked", () => {
    it("should return true if bookmark exists", () => {
      const story = { uuid: "123", title: "Bookmarked Story" } as any;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify([story]));

      expect(isSessionBookmarked("123")).toBe(true);
      expect(isSessionBookmarked("456")).toBe(false);
    });

    it("should return false if bookmark does not exist", () => {
      expect(isSessionBookmarked("123")).toBe(false);
    });
  });
});
