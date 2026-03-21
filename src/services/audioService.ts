import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let isSpeaking = false;
let isPaused = false;

export function isCurrentlySpeaking(): boolean {
  return isSpeaking;
}

export function isCurrentlyPaused(): boolean {
  return isPaused;
}

export async function speakText(
  text: string,
  options?: {
    language?: string;
    pitch?: number;
    rate?: number;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: any) => void;
  }
): Promise<void> {
  try {
    // Stop any current speech
    if (isSpeaking) {
      await stopSpeaking();
    }

    isSpeaking = true;
    isPaused = false;

    await Speech.speak(text, {
      language: options?.language || 'en-US',
      pitch: options?.pitch || 1.0,
      rate: options?.rate || 0.85, // Slightly slower for devotional reading
      onStart: () => {
        isSpeaking = true;
        options?.onStart?.();
      },
      onDone: () => {
        isSpeaking = false;
        isPaused = false;
        options?.onDone?.();
      },
      onStopped: () => {
        isSpeaking = false;
        isPaused = false;
        options?.onStopped?.();
      },
      onError: (error) => {
        isSpeaking = false;
        isPaused = false;
        console.error('Speech error:', error);
        options?.onError?.(error);
      },
    });
  } catch (error) {
    isSpeaking = false;
    isPaused = false;
    console.error('TTS error:', error);
  }
}

export async function speakDevotional(
  verseReference: string,
  verseText: string,
  reflection: string,
  prayer: string,
  callbacks?: {
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
  }
): Promise<void> {
  const fullText = `Today's verse: ${verseReference}. ${verseText}. ... Reflection: ${reflection}. ... Prayer: ${prayer}. ... Amen.`;

  await speakText(fullText, {
    rate: 0.8,
    ...callbacks,
  });
}

export async function pauseSpeaking(): Promise<void> {
  if (isSpeaking && !isPaused) {
    await Speech.pause();
    isPaused = true;
  }
}

export async function resumeSpeaking(): Promise<void> {
  if (isPaused) {
    await Speech.resume();
    isPaused = false;
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
    isSpeaking = false;
    isPaused = false;
  } catch (error) {
    console.error('Stop speech error:', error);
  }
}

export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch {
    return [];
  }
}

// Check if TTS is available on device
export async function isTTSAvailable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch {
    return false;
  }
}
