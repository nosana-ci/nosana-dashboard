import { onBeforeUnmount, ref } from "vue";

// TypeScript's DOM lib has no speech recognition types; this is the bit used here.
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0?: { transcript: string } }>;
}

type RecognitionCtor = new () => Recognition;

/** Chrome's speech recognition, where it exists; the mic button hides otherwise. */
const recognitionCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/**
 * Dictation into the prompt and reading a reply aloud, both with the browser's own
 * speech APIs. Nothing leaves the machine beyond what the browser itself does.
 */
export const usePlaygroundSpeech = (onText: (text: string) => void) => {
  const canListen = ref(recognitionCtor() !== null);
  const canSpeak = ref(
    typeof window !== "undefined" && "speechSynthesis" in window,
  );
  const listening = ref(false);
  const speaking = ref(false);
  let recognition: Recognition | null = null;

  function startListening() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event: RecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) onText(result[0]?.transcript ?? "");
      }
    };
    recognition.onend = () => (listening.value = false);
    recognition.onerror = () => (listening.value = false);
    recognition.start();
    listening.value = true;
  }

  function stopListening() {
    recognition?.stop();
    recognition = null;
    listening.value = false;
  }

  const toggleListening = () =>
    listening.value ? stopListening() : startListening();

  /** Reads text aloud, or stops if it is already reading. */
  function speak(text: string) {
    if (!canSpeak.value) return;
    if (speaking.value) {
      window.speechSynthesis.cancel();
      speaking.value = false;
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => (speaking.value = false);
    utterance.onerror = () => (speaking.value = false);
    speaking.value = true;
    window.speechSynthesis.speak(utterance);
  }

  onBeforeUnmount(() => {
    stopListening();
    if (speaking.value) window.speechSynthesis.cancel();
  });

  return { canListen, canSpeak, listening, speaking, toggleListening, speak };
};
