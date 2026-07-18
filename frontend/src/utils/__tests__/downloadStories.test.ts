// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadTXT } from "../downloadStories";

describe("downloadStories utility", () => {
  let mockCreateObjectURL: any;
  let mockRevokeObjectURL: any;
  let mockAnchorElement: any;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    mockRevokeObjectURL = vi.fn();
    
    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    mockAnchorElement = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return mockAnchorElement as any;
      }
      return document.createElement(tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should create a text blob and trigger a click on a temporary anchor element", () => {
    const story = {
      title: "My Story",
      prompt: "Once upon a time",
      content: "Deep in the forest...",
    };

    downloadTXT(story);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(mockAnchorElement.href).toBe("blob:mock-url");
    expect(mockAnchorElement.download).toBe("My_Story.txt");
    expect(mockAnchorElement.click).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should sanitize the filename by replacing special characters and whitespace with underscores", () => {
    const story = {
      title: "Story/Title: *With? <Special> | Chars",
      prompt: "Once upon a time",
      content: "Deep in the forest...",
    };

    downloadTXT(story);

    expect(mockAnchorElement.download).toBe("Story_Title_With_Special_Chars.txt");
  });
});
