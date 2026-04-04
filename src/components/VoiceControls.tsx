import React, { useState, useCallback, useRef } from 'react';
import { speakHint, stopSpeaking, startDictation, getVoiceCapabilities, type DictationResult } from '@/lib/voice-engine';

interface TTSButtonProps {
  text: string;
  onEvent?: (event: string, payload?: Record<string, any>) => void;
  questionId?: string;
}

export const TTSHintButton: React.FC<TTSButtonProps> = ({ text, onEvent, questionId }) => {
  const [playing, setPlaying] = useState(false);
  const startTime = useRef(0);

  const handlePlay = useCallback(() => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      const duration = Date.now() - startTime.current;
      onEvent?.('audio_hint_stopped', { questionId, duration });
      return;
    }

    startTime.current = Date.now();
    setPlaying(true);
    onEvent?.('audio_hint_played', { questionId, hintLength: text.length });

    speakHint(
      text,
      undefined,
      () => {
        setPlaying(false);
        const duration = Date.now() - startTime.current;
        onEvent?.('audio_hint_completed', { questionId, duration });
      }
    );
  }, [playing, text, onEvent, questionId]);

  const caps = getVoiceCapabilities();
  if (!caps.ttsSupported) return null;

  return (
    <button
      onClick={handlePlay}
      className={`px-2.5 py-1.5 rounded-xl text-xs font-heading border transition-all ${
        playing
          ? 'bg-primary/20 border-primary/50 text-primary animate-pulse'
          : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80'
      }`}
    >
      {playing ? '⏹ Stop' : '🔊 Listen'}
    </button>
  );
};

interface DictationButtonProps {
  onTranscript: (text: string) => void;
  onEvent?: (event: string, payload?: Record<string, any>) => void;
}

export const DictationButton: React.FC<DictationButtonProps> = ({ onTranscript, onEvent }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  const caps = getVoiceCapabilities();

  const handleToggle = useCallback(() => {
    if (listening) {
      stopRef.current?.();
      stopRef.current = null;
      setListening(false);
      if (transcript) {
        onTranscript(transcript);
        onEvent?.('voice_answer_used', { transcript_length: transcript.length });
      }
      return;
    }

    const handle = startDictation(
      (result: DictationResult) => {
        setTranscript(result.transcript);
      },
      () => {
        setListening(false);
        if (transcript) {
          onTranscript(transcript);
        }
      },
      (error) => {
        setListening(false);
        onEvent?.('voice_error', { error });
      }
    );

    if (handle) {
      stopRef.current = handle.stop;
      setListening(true);
      setTranscript('');
      onEvent?.('voice_dictation_started', { supported: true });
    }
  }, [listening, transcript, onTranscript, onEvent]);

  if (!caps.sttSupported) {
    return (
      <div className="text-[10px] text-muted-foreground italic">
        🎙 Voice dictation not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold border transition-all ${
          listening
            ? 'bg-destructive/10 border-destructive/40 text-destructive animate-pulse'
            : 'bg-accent/10 border-accent/30 text-foreground hover:bg-accent/20'
        }`}
      >
        {listening ? '⏹ Stop Listening' : '🎙 Answer by Voice'}
      </button>
      {listening && transcript && (
        <span className="text-xs text-muted-foreground italic truncate max-w-48">"{transcript}"</span>
      )}
    </div>
  );
};
