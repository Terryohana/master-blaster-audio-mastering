// Initialize Telegram WebApp
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Settings storage
const SETTINGS_KEY = 'masterBlasterSettings';
let settings = {
    eq: {
        bypass: true,
        low: 0,
        mid: 0,
        high: 0
    },
    compressor: {
        bypass: true,
        threshold: -24,
        ratio: 4,
        makeupGain: 0
    }
};

// Load settings from local storage
function loadSettings() {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            settings = { ...settings, ...parsedSettings };
        } catch (e) {
            console.error('Error parsing saved settings', e);
        }
    }
}

// Save settings to local storage
function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Audio Context and nodes
let audioContext;
let audioBuffer;
let sourceNode;
let analyserNode;
let lowEQ;
let midEQ;
let highEQ;
let compressor;
let makeupGainNode;
let isPlaying = false;
let startTime = 0;
let pauseTime = 0;
let playheadInterval;

// Try to load settings
try {
    loadSettings();
} catch (e) {
    console.error('Error loading settings', e);
}

// DOM Elements
const importButton = document.getElementById('importButton');
const fileInput = document.getElementById('fileInput');
const audioControls = document.getElementById('audioControls');
const waveformCanvas = document.getElementById('waveform');
const waveformCtx = waveformCanvas.getContext('2d');
const eqCurveCanvas = document.getElementById('eqCurve');
const eqCurveCtx = eqCurveCanvas.getContext('2d');
const playhead = document.getElementById('playhead');
const playPauseButton = document.getElementById('playPauseButton');
const rewindButton = document.getElementById('rewindButton');
const forwardButton = document.getElementById('forwardButton');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const eqTab = document.getElementById('eqTab');
const compressorTab = document.getElementById('compressorTab');
const eqContent = document.getElementById('eqContent');
const compressorContent = document.getElementById('compressorContent');
const eqBypass = document.getElementById('eqBypass');
const compressorBypass = document.getElementById('compressorBypass');
const lowGainSlider = document.getElementById('lowGain');
const midGainSlider = document.getElementById('midGain');
const highGainSlider = document.getElementById('highGain');
const lowGainValue = document.getElementById('lowGainValue');
const midGainValue = document.getElementById('midGainValue');
const highGainValue = document.getElementById('highGainValue');
const thresholdSlider = document.getElementById('threshold');
const ratioSlider = document.getElementById('ratio');
const makeupGainSlider = document.getElementById('makeupGain');
const thresholdValue = document.getElementById('thresholdValue');
const ratioValue = document.getElementById('ratioValue');
const makeupGainValue = document.getElementById('makeupGainValue');
const compMeterFill = document.getElementById('compMeterFill');
const exportButton = document.getElementById('exportButton');

// Initialize audio context
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyzer node
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 2048;
        
        // Create EQ nodes
        lowEQ = audioContext.createBiquadFilter();
        lowEQ.type = 'lowshelf';
        lowEQ.frequency.value = 200;
        lowEQ.gain.value = settings.eq.low;
        
        midEQ = audioContext.createBiquadFilter();
        midEQ.type = 'peaking';
        midEQ.frequency.value = 1000;
        midEQ.Q.value = 1;
        midEQ.gain.value = settings.eq.mid;
        
        highEQ = audioContext.createBiquadFilter();
        highEQ.type = 'highshelf';
        highEQ.frequency.value = 5000;
        highEQ.gain.value = settings.eq.high;
        
        // Create compressor node
        compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = settings.compressor.threshold;
        compressor.ratio.value = settings.compressor.ratio;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        
        // Create makeup gain node
        makeupGainNode = audioContext.createGain();
        makeupGainNode.gain.value = Math.pow(10, settings.compressor.makeupGain / 20); // Convert dB to linear gain
        
        // Connect nodes
        lowEQ.connect(midEQ);
        midEQ.connect(highEQ);
        highEQ.connect(compressor);
        compressor.connect(makeupGainNode);
        makeupGainNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
        
        // Apply saved settings to UI
        applySettingsToUI();
    }
}

// Load audio file
function loadAudioFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const audioData = e.target.result;
        
        initAudioContext();
        
        audioContext.decodeAudioData(audioData)
            .then(buffer => {
                audioBuffer = buffer;
                drawWaveform(buffer);
                updateTotalTime(buffer.duration);
                audioControls.style.display = 'block';
                
                // If we were playing, stop the previous source
                if (isPlaying && sourceNode) {
                    sourceNode.stop();
                    isPlaying = false;
                    playPauseButton.textContent = '▶';
                    clearInterval(playheadInterval);
                }
                
                pauseTime = 0;
                updatePlayhead(0);
            })
            .catch(error => {
                console.error('Error decoding audio data', error);
                alert('Error loading audio file. Please try another file.');
            });
    };
    
    reader.onerror = function() {
        alert('Error reading file');
    };
    
    reader.readAsArrayBuffer(file);
}

// Draw waveform
function drawWaveform(buffer) {
    const width = waveformCanvas.width = waveformCanvas.offsetWidth * window.devicePixelRatio;
    const height = waveformCanvas.height = waveformCanvas.offsetHeight * window.devicePixelRatio;
    
    waveformCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;
    
    waveformCtx.clearRect(0, 0, width, height);
    waveformCtx.beginPath();
    waveformCtx.moveTo(0, amp);
    
    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        waveformCtx.lineTo(i, (1 + min) * amp);
        waveformCtx.lineTo(i, (1 + max) * amp);
    }
    
    waveformCtx.strokeStyle = '#007AFF';
    waveformCtx.stroke();
}

// Draw EQ curve
function drawEQCurve() {
    const width = eqCurveCanvas.width = eqCurveCanvas.offsetWidth * window.devicePixelRatio;
    const height = eqCurveCanvas.height = eqCurveCanvas.offsetHeight * window.devicePixelRatio;
    
    eqCurveCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    eqCurveCtx.clearRect(0, 0, width, height);
    
    if (!eqBypass.checked) {
        eqCurveCtx.beginPath();
        eqCurveCtx.moveTo(0, height / 2);
        eqCurveCtx.lineTo(width, height / 2);
        eqCurveCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        eqCurveCtx.stroke();
        return;
    }
    
    // Simple approximation of the EQ curve
    const lowGain = parseFloat(lowGainSlider.value);
    const midGain = parseFloat(midGainSlider.value);
    const highGain = parseFloat(highGainSlider.value);
    
    eqCurveCtx.beginPath();
    
    // Draw a simplified EQ curve
    eqCurveCtx.moveTo(0, height / 2 - (lowGain * height / 30));
    
    // Low to mid transition
    eqCurveCtx.bezierCurveTo(
        width * 0.3, height / 2 - (lowGain * height / 30),
        width * 0.3, height / 2 - (midGain * height / 30),
        width * 0.5, height / 2 - (midGain * height / 30)
    );
    
    // Mid to high transition
    eqCurveCtx.bezierCurveTo(
        width * 0.7, height / 2 - (midGain * height / 30),
        width * 0.7, height / 2 - (highGain * height / 30),
        width, height / 2 - (highGain * height / 30)
    );
    
    eqCurveCtx.strokeStyle = '#007AFF';
    eqCurveCtx.lineWidth = 2;
    eqCurveCtx.stroke();
    
    // Draw center line
    eqCurveCtx.beginPath();
    eqCurveCtx.moveTo(0, height / 2);
    eqCurveCtx.lineTo(width, height / 2);
    eqCurveCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    eqCurveCtx.lineWidth = 1;
    eqCurveCtx.stroke();
}

// Format time in seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update total time display
function updateTotalTime(duration) {
    totalTimeDisplay.textContent = formatTime(duration);
}

// Update current time display and playhead position
function updatePlayhead(currentTime) {
    if (!audioBuffer) return;
    
    const duration = audioBuffer.duration;
    const position = (currentTime / duration) * 100;
    
    playhead.style.left = `${position}%`;
    currentTimeDisplay.textContent = formatTime(currentTime);
}

// Play audio
function playAudio() {
    if (!audioBuffer) return;
    
    // Create a new source node
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    
    // Connect the source to the first node in our chain
    if (eqBypass.checked) {
        sourceNode.connect(lowEQ);
    } else {
        sourceNode.connect(compressorBypass.checked ? compressor : makeupGainNode);
    }
    
    // Calculate the start position
    const offset = pauseTime;
    
    // Start playback
    sourceNode.start(0, offset);
    startTime = audioContext.currentTime - offset;
    isPlaying = true;
    
    // Update playhead
    playheadInterval = setInterval(() => {
        const currentTime = audioContext.currentTime - startTime;
        
        if (currentTime >= audioBuffer.duration) {
            stopAudio();
            pauseTime = 0;
            updatePlayhead(0);
            playPauseButton.textContent = '▶';
        } else {
            updatePlayhead(currentTime);
            
            // Update compressor meter (simplified)
            if (compressorBypass.checked) {
                // Simulate gain reduction (in a real app, you'd get this from the compressor node)
                const reduction = Math.min(100, Math.max(0, 
                    (thresholdSlider.value - (-60)) / (-60 - thresholdSlider.value) * 
                    (ratioSlider.value - 1) / 19 * 100
                ));
                compMeterFill.style.width = `${reduction}%`;
            } else {
                compMeterFill.style.width = '0%';
            }
        }
    }, 30);
}

// Pause audio
function pauseAudio() {
    if (sourceNode) {
        sourceNode.stop();
        pauseTime = audioContext.currentTime - startTime;
        isPlaying = false;
        clearInterval(playheadInterval);
    }
}

// Stop audio
function stopAudio() {
    if (sourceNode) {
        sourceNode.stop();
        isPlaying = false;
        clearInterval(playheadInterval);
    }
}

// Seek audio
function seekAudio(event) {
    if (!audioBuffer) return;
    
    const rect = waveformCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const duration = audioBuffer.duration;
    
    const seekTime = (x / width) * duration;
    pauseTime = seekTime;
    
    updatePlayhead(seekTime);
    
    if (isPlaying) {
        stopAudio();
        playAudio();
    }
}

// Export audio (simplified for MVP)
function exportAudio() {
    if (!audioBuffer) return;
    
    alert('Export functionality will be implemented in the next version.');
    
    // In a real implementation, you would:
    // 1. Create an offline audio context
    // 2. Set up the same audio processing chain
    // 3. Render the audio to a new buffer
    // 4. Convert to WAV/MP3
    // 5. Provide download or sharing options
}

// Event listeners
importButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadAudioFile(e.target.files[0]);
    }
});

// Add demo button event listener
const demoButton = document.getElementById('demoButton');
demoButton.addEventListener('click', () => {
    loadDemoAudio();
});

playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
        pauseAudio();
        playPauseButton.textContent = '▶';
    } else {
        playAudio();
        playPauseButton.textContent = '⏸';
    }
});

rewindButton.addEventListener('click', () => {
    pauseTime = 0;
    updatePlayhead(0);
    
    if (isPlaying) {
        stopAudio();
        playAudio();
    }
});

forwardButton.addEventListener('click', () => {
    if (!audioBuffer) return;
    
    pauseTime = Math.min(audioBuffer.duration, pauseTime + 10);
    updatePlayhead(pauseTime);
    
    if (isPlaying) {
        stopAudio();
        playAudio();
    }
});

waveformCanvas.addEventListener('click', seekAudio);

eqTab.addEventListener('click', () => {
    eqTab.classList.add('active');
    compressorTab.classList.remove('active');
    eqContent.classList.add('active');
    compressorContent.classList.remove('active');
});

compressorTab.addEventListener('click', () => {
    compressorTab.classList.add('active');
    eqTab.classList.remove('active');
    compressorContent.classList.add('active');
    eqContent.classList.remove('active');
});

eqBypass.addEventListener('change', () => {
    if (!sourceNode || !isPlaying) return;
    
    // Reconnect the audio chain based on bypass settings
    sourceNode.disconnect();
    
    if (eqBypass.checked) {
        sourceNode.connect(lowEQ);
    } else {
        sourceNode.connect(compressorBypass.checked ? compressor : makeupGainNode);
    }
    
    drawEQCurve();
});

compressorBypass.addEventListener('change', () => {
    if (!sourceNode || !isPlaying) return;
    
    // Update the audio chain if needed
    if (eqBypass.checked) {
        highEQ.disconnect();
        if (compressorBypass.checked) {
            highEQ.connect(compressor);
        } else {
            highEQ.connect(makeupGainNode);
        }
    }
});

lowGainSlider.addEventListener('input', () => {
    const gain = parseFloat(lowGainSlider.value);
    lowEQ.gain.value = gain;
    lowGainValue.textContent = `${gain.toFixed(1)} dB`;
    drawEQCurve();
});

midGainSlider.addEventListener('input', () => {
    const gain = parseFloat(midGainSlider.value);
    midEQ.gain.value = gain;
    midGainValue.textContent = `${gain.toFixed(1)} dB`;
    drawEQCurve();
});

highGainSlider.addEventListener('input', () => {
    const gain = parseFloat(highGainSlider.value);
    highEQ.gain.value = gain;
    highGainValue.textContent = `${gain.toFixed(1)} dB`;
    drawEQCurve();
});

thresholdSlider.addEventListener('input', () => {
    const threshold = parseFloat(thresholdSlider.value);
    compressor.threshold.value = threshold;
    thresholdValue.textContent = `${threshold.toFixed(0)} dB`;
});

ratioSlider.addEventListener('input', () => {
    const ratio = parseFloat(ratioSlider.value);
    compressor.ratio.value = ratio;
    ratioValue.textContent = `${ratio.toFixed(1)}:1`;
});

makeupGainSlider.addEventListener('input', () => {
    const gain = parseFloat(makeupGainSlider.value);
    makeupGainNode.gain.value = Math.pow(10, gain / 20); // Convert dB to linear gain
    makeupGainValue.textContent = `${gain.toFixed(1)} dB`;
});

exportButton.addEventListener('click', exportAudio);

// Handle window resize
window.addEventListener('resize', () => {
    if (audioBuffer) {
        drawWaveform(audioBuffer);
    }
    drawEQCurve();
});

// Apply settings to UI
function applySettingsToUI() {
    // Apply EQ settings
    eqBypass.checked = settings.eq.bypass;
    lowGainSlider.value = settings.eq.low;
    midGainSlider.value = settings.eq.mid;
    highGainSlider.value = settings.eq.high;
    lowGainValue.textContent = `${settings.eq.low.toFixed(1)} dB`;
    midGainValue.textContent = `${settings.eq.mid.toFixed(1)} dB`;
    highGainValue.textContent = `${settings.eq.high.toFixed(1)} dB`;
    
    // Apply compressor settings
    compressorBypass.checked = settings.compressor.bypass;
    thresholdSlider.value = settings.compressor.threshold;
    ratioSlider.value = settings.compressor.ratio;
    makeupGainSlider.value = settings.compressor.makeupGain;
    thresholdValue.textContent = `${settings.compressor.threshold.toFixed(0)} dB`;
    ratioValue.textContent = `${settings.compressor.ratio.toFixed(1)}:1`;
    makeupGainValue.textContent = `${settings.compressor.makeupGain.toFixed(1)} dB`;
    
    // Update visualizations
    drawEQCurve();
}

// Save current settings
function updateSettings() {
    settings.eq.bypass = eqBypass.checked;
    settings.eq.low = parseFloat(lowGainSlider.value);
    settings.eq.mid = parseFloat(midGainSlider.value);
    settings.eq.high = parseFloat(highGainSlider.value);
    
    settings.compressor.bypass = compressorBypass.checked;
    settings.compressor.threshold = parseFloat(thresholdSlider.value);
    settings.compressor.ratio = parseFloat(ratioSlider.value);
    settings.compressor.makeupGain = parseFloat(makeupGainSlider.value);
    
    saveSettings();
}

// Load demo audio
function loadDemoAudio() {
    initAudioContext();
    
    // Create a simple sine wave oscillator for demo
    const sampleRate = audioContext.sampleRate;
    const duration = 4; // 4 seconds
    const buffer = audioContext.createBuffer(2, sampleRate * duration, sampleRate);
    
    // Fill the buffer with a simple melody (sine waves)
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const noteDuration = duration / frequencies.length;
        
        for (let i = 0; i < data.length; i++) {
            const time = i / sampleRate;
            const noteIndex = Math.floor(time / noteDuration);
            const freq = frequencies[Math.min(noteIndex, frequencies.length - 1)];
            
            // Create a simple ADSR envelope
            const noteTime = time % noteDuration;
            const attack = 0.1;
            const decay = 0.1;
            const sustain = 0.7;
            const release = 0.2;
            
            let amplitude = 0;
            if (noteTime < attack) {
                amplitude = noteTime / attack;
            } else if (noteTime < attack + decay) {
                amplitude = 1.0 - (1.0 - sustain) * ((noteTime - attack) / decay);
            } else if (noteTime < noteDuration - release) {
                amplitude = sustain;
            } else {
                amplitude = sustain * (1 - (noteTime - (noteDuration - release)) / release);
            }
            
            data[i] = Math.sin(2 * Math.PI * freq * time) * amplitude * 0.5;
        }
    }
    
    audioBuffer = buffer;
    drawWaveform(buffer);
    updateTotalTime(buffer.duration);
    audioControls.style.display = 'block';
    
    // If we were playing, stop the previous source
    if (isPlaying && sourceNode) {
        sourceNode.stop();
        isPlaying = false;
        playPauseButton.textContent = '▶';
        clearInterval(playheadInterval);
    }
    
    pauseTime = 0;
    updatePlayhead(0);
}

// Initialize EQ curve
drawEQCurve();

// Update settings when controls change
lowGainSlider.addEventListener('change', updateSettings);
midGainSlider.addEventListener('change', updateSettings);
highGainSlider.addEventListener('change', updateSettings);
eqBypass.addEventListener('change', updateSettings);
thresholdSlider.addEventListener('change', updateSettings);
ratioSlider.addEventListener('change', updateSettings);
makeupGainSlider.addEventListener('change', updateSettings);
compressorBypass.addEventListener('change', updateSettings);

// If Telegram WebApp is available, set up the main button
if (tg) {
    tg.MainButton.setText('SHARE AUDIO');
    tg.MainButton.onClick(() => {
        if (audioBuffer) {
            alert('Sharing functionality will be implemented in the next version.');
            // In a real implementation, you would export the audio and share it via Telegram
        }
    });
}