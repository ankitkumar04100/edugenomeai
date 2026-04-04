// Voice Engine — TTS hints + Speech Recognition dictation (privacy-safe)

export interface VoiceCapabilities {
  ttsSupported: boolean;
  sttSupported: boolean;
}

export function getVoiceCapabilities(): VoiceCapabilities {
  return {
    ttsSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    sttSupported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  };
}

// TTS
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakHint(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): { stop: () => void; duration: number } {
  if (!getVoiceCapabilities().ttsSupported) {
    return { stop: () => {}, duration: 0 };
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 0.9;
  currentUtterance = utterance;

  const startTime = Date.now();

  utterance.onstart = () => onStart?.();
  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    currentUtterance = null;
  };

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    },
    duration: text.length * 60, // rough estimate ms
  };
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return currentUtterance !== null;
}

// Speech Recognition (dictation)
type SpeechRecognitionType = any;

export interface DictationResult {
  transcript: string;
  confidence: number;
}

export function startDictation(
  onResult: (result: DictationResult) => void,
  onEnd?: () => void,
  onError?: (error: string) => void
): { stop: () => void } | null {
  const caps = getVoiceCapabilities();
  if (!caps.sttSupported) {
    onError?.('Speech recognition not supported in this browser');
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition: SpeechRecognitionType = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    onResult({
      transcript: result[0].transcript,
      confidence: result[0].confidence || 0,
    });
  };

  recognition.onend = () => onEnd?.();
  recognition.onerror = (event: any) => onError?.(event.error);

  recognition.start();

  return {
    stop: () => {
      try { recognition.stop(); } catch {}
    },
  };
}
