# Audio EQ Separation Architecture

This document explains the architecture implemented for the Master Blaster audio processing application to solve the issue of toggling between normal audio playback and EQ-processed audio.

## Problem Statement

When implementing Web Audio API processing on an HTML audio element, the audio element gets "hijacked" by the Web Audio API, making it difficult to switch back to normal playback. This creates issues when users want to toggle between processed and unprocessed audio.

## Solution: Dual Audio Element Architecture

We've implemented a dual audio element approach that maintains two separate audio elements:

1. **Normal Audio Element**: For standard HTML5 audio playback without processing
2. **EQ Audio Element**: Connected to the Web Audio API for real-time processing

### Key Components

- **Two Audio Elements**: `normalAudioRef` and `eqAudioRef`
- **Audio Mode State**: Tracks which audio element is currently active
- **State Synchronization**: Ensures seamless transitions between modes
- **Isolated Web Audio Chain**: Only applied to the EQ audio element

### How It Works

1. **Normal Mode (Default)**:
   - Only the normal audio element is playing
   - Web Audio API is not initialized
   - All EQ controls are disabled

2. **EQ Mode (When Enabled)**:
   - Normal audio is paused
   - EQ audio takes over at the same position
   - Web Audio API chain is initialized
   - All EQ controls become active

3. **Switching Between Modes**:
   - Current playback state (time, volume, play/pause) is synchronized
   - Audio contexts are properly created or cleaned up
   - Only one audio element plays at a time

### Benefits

- ✅ **Consistent Toggle Behavior**: EQ can be enabled/disabled reliably
- ✅ **Proper Separation**: Normal playback and EQ processing are completely isolated
- ✅ **Seamless Transitions**: State is preserved when switching between modes
- ✅ **Predictable Defaults**: Always starts in normal mode, EQ is opt-in
- ✅ **Robust Error Handling**: Fallback to normal mode if EQ processing fails

## Implementation Details

### State Management

```javascript
// Two separate audio elements
const normalAudioRef = useRef<HTMLAudioElement>(null);
const eqAudioRef = useRef<HTMLAudioElement>(null);
const [activeAudioMode, setActiveAudioMode] = useState<'normal' | 'eq'>('normal');
```

### State Synchronization

```javascript
const syncAudioState = useCallback((fromRef, toRef) => {
  if (!fromRef.current || !toRef.current) return;
  
  const from = fromRef.current;
  const to = toRef.current;
  
  // Sync playback state
  to.currentTime = from.currentTime;
  to.volume = from.volume;
  to.playbackRate = from.playbackRate;
  
  // Handle play state
  if (!from.paused) {
    to.play().catch(console.error);
  } else {
    to.pause();
  }
}, []);
```

### Mode Switching

```javascript
const switchToEQMode = useCallback(async () => {
  if (activeAudioMode === 'eq') return;
  
  // Sync state from normal to EQ
  syncAudioState(normalAudioRef, eqAudioRef);
  
  // Pause normal audio
  normalAudioRef.current?.pause();
  
  // Initialize Web Audio chain
  await initializeEQProcessing(eqAudioRef.current);
  
  setActiveAudioMode('eq');
  setIsLiveEQEnabled(true);
}, [activeAudioMode, syncAudioState]);

const switchToNormalMode = useCallback(() => {
  if (activeAudioMode === 'normal') return;
  
  // Sync state from EQ to normal
  syncAudioState(eqAudioRef, normalAudioRef);
  
  // Cleanup Web Audio
  cleanupEQProcessing();
  
  // Pause EQ audio
  eqAudioRef.current?.pause();
  
  setActiveAudioMode('normal');
  setIsLiveEQEnabled(false);
}, [activeAudioMode, syncAudioState]);
```

### Web Audio Chain Management

```javascript
const initializeEQProcessing = useCallback(async (audioElement) => {
  if (!audioElement || audioContextRef.current) return;
  
  audioContextRef.current = new AudioContext();
  
  if (audioContextRef.current.state === 'suspended') {
    await audioContextRef.current.resume();
  }
  
  sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
  
  // Create processing chain
  // ...
}, []);

const cleanupEQProcessing = useCallback(() => {
  if (audioContextRef.current) {
    audioContextRef.current.close();
    audioContextRef.current = null;
    sourceRef.current = null;
    filtersRef.current = [];
    compressorRef.current = null;
    analyserRef.current = null;
  }
}, []);
```

## Testing

The architecture has been tested with various scenarios:

1. **New Project Flow**:
   - Upload audio → Normal playback available
   - Enable EQ → Seamless switch to EQ processing
   - Disable EQ → Return to normal playback
   - Repeat toggle → Consistent behavior

2. **Existing Project Flow**:
   - Load project → Audio loads in normal mode
   - Enable EQ → Switch to EQ processing with project settings
   - Disable EQ → Return to normal playback
   - Save changes → Settings preserved

3. **Edge Cases**:
   - Browser audio policy restrictions → Graceful degradation
   - AudioContext creation failures → Fallback to normal mode
   - Network issues during loading → Error handling with retry
   - Rapid toggle operations → Debounced state management

## Components

- **LiveAudioProcessorDual.tsx**: Main implementation of the dual audio element architecture
- **LiveAudioProcessorDualTest.tsx**: Simple test component to verify the architecture works