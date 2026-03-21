import { Audio } from 'expo-av';

let soundsLoaded = false;
const sounds: Record<string, Audio.Sound> = {};

// Sound configurations (will use system sounds as fallback)
const SOUND_CONFIG = {
  tap: { volume: 0.3 },
  save: { volume: 0.4 },
  complete: { volume: 0.5 },
  send: { volume: 0.3 },
  error: { volume: 0.4 },
  notification: { volume: 0.6 },
} as const;

export type SoundName = keyof typeof SOUND_CONFIG;

export async function initSounds() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });
    soundsLoaded = true;
  } catch (error) {
    console.error('Sound init error:', error);
  }
}

export async function playSound(name: SoundName) {
  // Since we don't have custom sound files bundled,
  // this is a no-op placeholder that can be wired up when sound assets are added.
  // The haptic feedback in the app already provides tactile responses.
  // To add real sounds:
  // 1. Add .wav/.mp3 files to assets/sounds/
  // 2. Load them in initSounds() with Audio.Sound.createAsync(require('...'))
  // 3. Play them here with sounds[name].replayAsync()

  if (!soundsLoaded) return;

  try {
    // Placeholder: Use system haptic as audio feedback
    // When sound files are added, replace this with:
    // if (sounds[name]) {
    //   await sounds[name].setVolumeAsync(SOUND_CONFIG[name].volume);
    //   await sounds[name].replayAsync();
    // }
  } catch (error) {
    console.error('Sound play error:', error);
  }
}

export async function cleanupSounds() {
  try {
    for (const sound of Object.values(sounds)) {
      await sound.unloadAsync();
    }
  } catch (error) {
    console.error('Sound cleanup error:', error);
  }
}
