import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WordRange = {
  start: number;
  end: number;
};

export interface SpeechProgress {
  currentWordIndex: number;
  totalWords: number;
  percentage: number;
}

export interface SpeechVoiceOption {
  id: string;
  name: string;
  lang: string;
  label: string;
  localService: boolean;
  isDefault: boolean;
}

export interface SpeechLanguageOption {
  lang: string;
  label: string;
  voiceCount: number;
}

export interface UseSpeechSynthesisResult {
  /** True when narration is actively playing. */
  isPlaying: boolean;
  /** True when narration is paused mid-stream. */
  isPaused: boolean;
  /** True when the speech engine has an active utterance. */
  isSpeaking: boolean;
  /** Start narration from the beginning of the supplied text. */
  play: () => void;
  /** Pause the active narration without resetting progress. */
  pause: () => void;
  /** Resume narration from the paused position. */
  resume: () => void;
  /** Stop narration and reset progress back to the beginning. */
  stop: () => void;
  /** Current playback speed. */
  rate: number;
  /** Update narration speed for future and active utterances. */
  setRate: (nextRate: number) => void;
  /** Current pitch multiplier. */
  pitch: number;
  /** Update narration pitch for future and active utterances. */
  setPitch: (nextPitch: number) => void;
  /** Current output volume. */
  volume: number;
  /** Update narration volume for future and active utterances. */
  setVolume: (nextVolume: number) => void;
  /** Available browser narration voices. */
  voices: SpeechVoiceOption[];
  /** Available languages inferred from browser voices. */
  languageOptions: SpeechLanguageOption[];
  /** Selected BCP 47 narration language, for example "en-US" or "hi-IN". */
  selectedLanguage: string;
  /** Update narration language and pick the first matching voice. */
  setSelectedLanguage: (nextLanguage: string) => void;
  /** Selected browser voice id. */
  selectedVoiceId: string;
  /** Update narration voice. */
  setSelectedVoiceId: (nextVoiceId: string) => void;
  /** Word-level progress metadata for UI rendering and text highlighting. */
  progress: SpeechProgress;
  /** Browser support flag for the Web Speech API. */
  isSupported: boolean;
  /** True while the browser is loading available voices. */
  isReady: boolean;
  /** Human-readable error message, if any. */
  error: string | null;
  /** Zero-based word index of the currently spoken word. */
  currentWordIndex: number;
}

const hasSpeechSupport = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
};

const buildWordRanges = (inputText: string): WordRange[] => {
  if (!inputText.trim()) {
    return [];
  }

  const ranges: WordRange[] = [];
  const wordPattern = /\S+/g;

  for (const match of inputText.matchAll(wordPattern)) {
    const start = match.index ?? 0;
    ranges.push({
      start,
      end: start + match[0].length,
    });
  }

  return ranges;
};

const getWordIndexAtCharIndex = (
  charIndex: number,
  ranges: WordRange[]
): number => {
  if (ranges.length === 0) {
    return 0;
  }

  const normalizedCharIndex = Math.max(0, charIndex);
  let low = 0;
  let high = ranges.length - 1;
  let bestMatch = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const range = ranges[middle];

    if (range.start <= normalizedCharIndex) {
      bestMatch = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return bestMatch;
};

const getVoiceId = (voice: SpeechSynthesisVoice): string => {
  return voice.voiceURI || `${voice.name}-${voice.lang}`;
};

const getLanguageLabel = (languageCode: string): string => {
  try {
    const [language, region] = languageCode.split("-");
    const displayNames = new Intl.DisplayNames([window.navigator.language || "en"], {
      type: "language",
    });
    const languageName = displayNames.of(languageCode) || displayNames.of(language) || languageCode;

    return region ? `${languageName} (${region})` : languageName;
  } catch {
    return languageCode;
  }
};

const mapVoiceOption = (voice: SpeechSynthesisVoice): SpeechVoiceOption => ({
  id: getVoiceId(voice),
  name: voice.name,
  lang: voice.lang,
  label: `${voice.name} (${voice.lang})`,
  localService: voice.localService,
  isDefault: voice.default,
});

const getPreferredLanguage = (): string => {
  return window.navigator.language || "en-US";
};

const findVoiceForLanguage = (
  voices: SpeechVoiceOption[],
  language: string,
): SpeechVoiceOption | undefined => {
  const normalizedLanguage = language.toLowerCase();
  const languagePrefix = normalizedLanguage.split("-")[0];

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLanguage) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${languagePrefix}-`)) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix))
  );
};

export const useSpeechSynthesis = (
  text: string,
  _voiceGender: "female" | "male" = "female"
): UseSpeechSynthesisResult => {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sessionRef = useRef(0);
  const previousTextRef = useRef(text);
  const currentWordIndexRef = useRef(0);

  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rateState, setRateState] = useState(1);
  const [pitchState, setPitchState] = useState(1);
  const [volumeState, setVolumeState] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechVoiceOption[]>([]);
  const [selectedLanguage, setSelectedLanguageState] = useState("");
  const [selectedVoiceId, setSelectedVoiceIdState] = useState("");

  const wordRanges = useMemo(() => buildWordRanges(text), [text]);
  const totalWords = wordRanges.length;

  const progress = useMemo<SpeechProgress>(() => {
    const hasNarrationProgress = isPlaying || isPaused || currentWordIndex > 0;
    const spokenWords = hasNarrationProgress
      ? Math.min(currentWordIndex + 1, totalWords)
      : 0;

    return {
      currentWordIndex,
      totalWords,
      percentage: totalWords > 0 ? spokenWords / totalWords : 0,
    };
  }, [currentWordIndex, isPaused, isPlaying, totalWords]);

  const languageOptions = useMemo<SpeechLanguageOption[]>(() => {
    const languageCounts = new Map<string, number>();

    voices.forEach((voice) => {
      languageCounts.set(voice.lang, (languageCounts.get(voice.lang) || 0) + 1);
    });

    return Array.from(languageCounts.entries())
      .map(([lang, voiceCount]) => ({
        lang,
        label: getLanguageLabel(lang),
        voiceCount,
      }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }, [voices]);

  const resetNarrationState = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setIsSpeaking(false);
    setCurrentWordIndex(0);
    currentWordIndexRef.current = 0;
  }, []);

  const clearUtterance = useCallback(() => {
    utteranceRef.current = null;

    if (hasSpeechSupport()) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    clearUtterance();
    resetNarrationState();
  }, [clearUtterance, resetNarrationState]);

  const play = useCallback(() => {
    if (!isSupported) {
      setError("Speech synthesis is not supported in this browser.");
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      setError("No story text is available for narration.");
      return;
    }

    if (!isReady) {
      setError("Speech voices are still loading. Please try again in a moment.");
      return;
    }

    const speechSynthesis = window.speechSynthesis;
    sessionRef.current += 1;
    const sessionId = sessionRef.current;

    clearUtterance();
    setError(null);
    setCurrentWordIndex(0);
    currentWordIndexRef.current = 0;
    setIsPaused(false);
    setIsPlaying(true);
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rateState;
    utterance.pitch = pitchState;
    utterance.volume = volumeState;

    const browserVoice = speechSynthesis
      .getVoices()
      .find((voice) => getVoiceId(voice) === selectedVoiceId);

    if (browserVoice) {
      utterance.voice = browserVoice;
      utterance.lang = browserVoice.lang;
    } else {
      utterance.lang = selectedLanguage || getPreferredLanguage();
    }

    // Heartbeat to prevent Chrome from stalling on long narrations
    const heartbeatInterval = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 14000);

    const handleStart = () => {
      if (sessionRef.current !== sessionId) return;
      setIsPlaying(true);
      setIsPaused(false);
      setIsSpeaking(true);
    };

    const handleBoundary = (event: SpeechSynthesisEvent) => {
      if (sessionRef.current !== sessionId) return;
      if (event.name === "word" && typeof event.charIndex === "number") {
        const idx = getWordIndexAtCharIndex(event.charIndex, wordRanges);
        setCurrentWordIndex(idx);
        currentWordIndexRef.current = idx;
      }
    };

    const handleEnd = () => {
      clearInterval(heartbeatInterval);
      if (sessionRef.current !== sessionId) return;
      utteranceRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      setIsSpeaking(false);
      setCurrentWordIndex(totalWords);
      currentWordIndexRef.current = totalWords;
    };

    const handleError = (event: SpeechSynthesisErrorEvent) => {
      clearInterval(heartbeatInterval);
      if (sessionRef.current !== sessionId) return;
      utteranceRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      setIsSpeaking(false);
      if (event.error !== "interrupted") setError("Narration failed to play.");
    };

    utterance.addEventListener("start", handleStart);
    utterance.addEventListener("boundary", handleBoundary);
    utterance.addEventListener("end", handleEnd);
    utterance.addEventListener("error", handleError);

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, text, isReady, rateState, pitchState, volumeState, selectedVoiceId, selectedLanguage, wordRanges, totalWords, clearUtterance]);

  const pause = useCallback(() => {
    if (!isSupported || !utteranceRef.current) return;
    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis.speaking || speechSynthesis.paused) return;
    speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
    setIsSpeaking(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported || !utteranceRef.current) return;
    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis.paused) return;
    speechSynthesis.resume();
    setIsPlaying(true);
    setIsPaused(false);
    setIsSpeaking(true);
  }, [isSupported]);

  const setRate = useCallback((nextRate: number) => {
    setRateState(nextRate);
    if (!utteranceRef.current || !window.speechSynthesis.speaking) return;
    
    // Web Speech API usually requires a restart to change rate on active utterance
    const wasPaused = window.speechSynthesis.paused;
    if (!wasPaused) {
       play(); // For simplicity, restart with new rate. Better would be to slice text.
    }
  }, [play]);

  const setPitch = useCallback((nextPitch: number) => {
    setPitchState(nextPitch);
    if (utteranceRef.current) utteranceRef.current.pitch = nextPitch;
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    setVolumeState(nextVolume);
    if (utteranceRef.current) utteranceRef.current.volume = nextVolume;
  }, []);

  const setSelectedLanguage = useCallback((nextLanguage: string) => {
    stop();
    setSelectedLanguageState(nextLanguage);
    const nextVoice = findVoiceForLanguage(voices, nextLanguage);
    setSelectedVoiceIdState(nextVoice?.id || "");
  }, [stop, voices]);

  const setSelectedVoiceId = useCallback((nextVoiceId: string) => {
    stop();
    setSelectedVoiceIdState(nextVoiceId);
    const nextVoice = voices.find((voice) => voice.id === nextVoiceId);
    if (nextVoice) setSelectedLanguageState(nextVoice.lang);
  }, [stop, voices]);

  useEffect(() => {
    const supported = hasSpeechSupport();
    setIsSupported(supported);
    if (!supported) return;

    const speechSynthesis = window.speechSynthesis;
    let isMounted = true;

    const syncVoices = () => {
      if (!isMounted) return;
      const availableVoices = speechSynthesis.getVoices().map(mapVoiceOption);
      setVoices(availableVoices);
      setIsReady(availableVoices.length > 0);

      if (availableVoices.length > 0) {
        setSelectedLanguageState((currentLanguage) => {
          const nextLanguage = currentLanguage || getPreferredLanguage();
          const matchedVoice = findVoiceForLanguage(availableVoices, nextLanguage) || 
                               availableVoices.find((voice) => voice.isDefault) || 
                               availableVoices[0];
          setSelectedVoiceIdState((currentVoiceId) => currentVoiceId || matchedVoice.id);
          return matchedVoice.lang || nextLanguage;
        });
      }
    };

    syncVoices();
    speechSynthesis.addEventListener("voiceschanged", syncVoices);
    return () => {
      isMounted = false;
      speechSynthesis.removeEventListener("voiceschanged", syncVoices);
    };
  }, []);

  useEffect(() => {
    if (previousTextRef.current !== text) {
      previousTextRef.current = text;
      stop();
    }
  }, [stop, text]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    isPlaying,
    isPaused,
    isSpeaking,
    play,
    pause,
    resume,
    stop,
    rate: rateState,
    setRate,
    pitch: pitchState,
    setPitch,
    volume: volumeState,
    setVolume,
    voices,
    languageOptions,
    selectedLanguage,
    setSelectedLanguage,
    selectedVoiceId,
    setSelectedVoiceId,
    progress,
    isSupported,
    isReady,
    error,
    currentWordIndex,
  };
};

export default useSpeechSynthesis;
