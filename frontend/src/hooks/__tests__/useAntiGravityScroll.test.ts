import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAntiGravityScroll } from "../useAntiGravityScroll";

describe("useAntiGravityScroll hook", () => {
  let mockContainer: any;
  let containerRef: any;
  let rafCallback: any = null;
  let rafIdCounter = 0;

  beforeEach(() => {
    rafCallback = null;
    rafIdCounter = 0;

    // Mock requestAnimationFrame
    vi.stubGlobal("requestAnimationFrame", vi.fn().mockImplementation((cb: any) => {
      rafCallback = cb;
      rafIdCounter++;
      return rafIdCounter;
    }));

    // Mock cancelAnimationFrame
    vi.stubGlobal("cancelAnimationFrame", vi.fn().mockImplementation((id: number) => {
      if (rafIdCounter === id) {
        rafCallback = null;
      }
    }));

    // Mock container element
    mockContainer = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    containerRef = { current: mockContainer };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should register passive scroll interrupt event listeners on mount", () => {
    const { unmount } = renderHook(() => useAntiGravityScroll(containerRef));

    expect(mockContainer.addEventListener).toHaveBeenCalledWith("wheel", expect.any(Function), { passive: true });
    expect(mockContainer.addEventListener).toHaveBeenCalledWith("touchmove", expect.any(Function), { passive: true });

    unmount();

    expect(mockContainer.removeEventListener).toHaveBeenCalledWith("wheel", expect.any(Function));
    expect(mockContainer.removeEventListener).toHaveBeenCalledWith("touchmove", expect.any(Function));
  });

  it("should toggle isPlaying and targetSpeed states", () => {
    const { result } = renderHook(() => useAntiGravityScroll(containerRef));

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.targetSpeed).toBe(1);

    act(() => {
      result.current.setIsPlaying(true);
      result.current.setTargetSpeed(2);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.targetSpeed).toBe(2);
  });

  it("should stop scrolling and reset velocity when user manual scroll event fires", () => {
    const { result } = renderHook(() => useAntiGravityScroll(containerRef));

    act(() => {
      result.current.setIsPlaying(true);
    });
    expect(result.current.isPlaying).toBe(true);

    // Retrieve and execute the handleUserScroll handler registered by the hook
    const handleUserScroll = mockContainer.addEventListener.mock.calls[0][1];
    
    act(() => {
      handleUserScroll();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it("should accelerate scroll velocity and update container.scrollTop when isPlaying is true", () => {
    const { result } = renderHook(() => useAntiGravityScroll(containerRef));

    act(() => {
      result.current.setIsPlaying(true);
    });

    // Verify requestAnimationFrame was requested
    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(rafCallback).toBeDefined();

    // Trigger the animation loop frame
    act(() => {
      const currentCallback = rafCallback;
      rafCallback = null;
      currentCallback();
    });

    // Velocity should start accelerating towards targetSpeed * baseSpeed (0.5)
    // acceleration is 0.05, so velocity goes 0 -> 0.05
    expect(result.current.currentVelocityRef.current).toBeCloseTo(0.05);
    expect(mockContainer.scrollTop).toBeCloseTo(0.05);
  });

  it("should decelerate to 0 velocity when isPlaying is false", () => {
    const { result } = renderHook(() => useAntiGravityScroll(containerRef));

    act(() => {
      result.current.setIsPlaying(true);
    });

    act(() => {
      const currentCallback = rafCallback;
      rafCallback = null;
      currentCallback();
    });

    expect(result.current.currentVelocityRef.current).toBeCloseTo(0.05);

    act(() => {
      result.current.setIsPlaying(false);
    });

    expect(rafCallback).toBeDefined();
    act(() => {
      const currentCallback = rafCallback;
      rafCallback = null;
      currentCallback();
    });

    expect(result.current.currentVelocityRef.current).toBe(0);
  });

  it("should stop playing when container scroll reaches the bottom", () => {
    const { result } = renderHook(() => useAntiGravityScroll(containerRef));

    // Set scroll position near bottom (max is 1000 - 500 = 500)
    mockContainer.scrollTop = 499.8;
    result.current.currentVelocityRef.current = 0.5;

    act(() => {
      result.current.setIsPlaying(true);
    });

    // Run animation frame
    act(() => {
      const currentCallback = rafCallback;
      rafCallback = null;
      currentCallback();
    });

    // Reached bottom, so it should stop playing
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentVelocityRef.current).toBe(0);
  });
});
