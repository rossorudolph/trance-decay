let video;
let bodyPose;
let poses = [];
let connections;
let modelLoaded = false;
let poseDetectionStarted = false;

// Audio system
let audioInitialized = false;
let samplesLoaded = false;

// SAMPLE-BASED INSTRUMENTS
let bassSampler, arpeggioSampler, bellSampler, vocalChoirSampler;
let kickSampler, clapSampler, stringsSampler, handRaiseSynth;
let percussionLoop, sidechainedNoise;
let breakcoreKick;
let glitchBeat;

// NEW: Mic input and vocal processing
let micInput;
let micRecorder;
let voiceLoop;
let voiceGrainPlayer;
let voiceEffectsChain;
let isRecordingVoice = false;
let recordingStartTime = 0;
let maxRecordingTime = 4000; // 4 seconds max

// NEW: Pop sample hook (for New Jeans OMG style)
let popHookSampler;
let popHookActive = false;

// Effects
let brightnessFilter, motionFilter, palmFilter, masterReverb, masterDelay, masterDistortion;
let stringsGate, choirGate;
let stringsLFO;
let arpeggioLFO, arpeggioFlutterFilter;
let masterGain, dryGain;
let isPlaying = false;

// Breakcore system
let isBreakcoreActive = false;
let breakcoreStartTime = 0;
let breakCoreDuration = 4000;

// Jersey club system
let jerseyClubActive = false;
let jerseyClubStartTime = 0;
let jerseyClubDuration = 4000;

function startJerseyClubKick() {
  if (jerseyClubActive || !kickSampler || !kickSampler.loaded) return;
  
  jerseyClubActive = true;
  jerseyClubStartTime = millis();
  
  console.log("🏀 JERSEY CLUB KICK PATTERN!");
  
  const jerseyPattern = [0, 0.125, 0.25, 0.375, 0.5, 0.75, 1.0, 1.125, 1.25, 1.5, 1.75];
  
  jerseyPattern.forEach(beat => {
    Tone.getTransport().schedule((time) => {
      if (kickSampler && kickSampler.loaded) {
        kickSampler.triggerAttackRelease("C1", "32n", time, 0.8);
      }
    }, `+${beat}`);
  });
  
  setTimeout(() => {
    jerseyClubActive = false;
    console.log("Jersey club kick ended");
  }, jerseyClubDuration);
}

// Movement tracking
let previousPoses = [];
let armStretch = 0;
let motionAmount = 0;
let motionAmountRaw = 0;
let armStretchSmooth = 0;
let motionAmountSmooth = 0;
let motionDecayRate = 0.02;
let handHeight = 0;
let handHeightSmooth = 0;
let palmDirection = 0;
let lastTwinkleTime = 0;

let motionHistory = [];
let motionAverage = 0;

// Jump detection - FIXED CALCULATION
let jumpAmount = 0;
let jumpThreshold = 0.4; // LOWERED from 0.8 - more sensitive
let lastJumpTime = 0;
let jumpHistory = [];
let lastGroundLevel = 0; // Track consistent ground level

// Audio parameters
let brightnessFreq = 400;
let motionResonance = 1;
let palmFreq = 800;

// Visual system
let audioAnalyzer;
let visualMode = 1;
let visualModes = ['Lissajous Scale', 'Spectral Flow'];
let bodyCenter = {x: 640, y: 480};
let bodyCenterSmooth = {x: 640, y: 480};
let bodyRotation = 0;
let traceBuffer;

// Voice visualization
let voiceWaveform = [];
let voiceVisualsActive = false;

// NEW: Floating voice visualization
let voiceWavePosition = {x: 0, y: 0};
let voiceWaveTarget = {x: 0, y: 0};
let voiceWavePoints = [];

// NEW: Blob tracking system
let bodyBoundingBox = {x: 0, y: 0, width: 0, height: 0};
let trackingPoints = [];
let blobTrackingActive = false;

let leftHandSmooth = {x: 0, y: 0};
let rightHandSmooth = {x: 0, y: 0};

// Sample paths - UPDATED WITH NEW SAMPLES
const samplePaths = {
  bass: "samples/ZEN_SIC_bass_synth_sub_one_shot_vibecity_C.wav",
  arpeggio: "samples/Srm_Crystal_falls2.wav",
  bell: "samples/bell_d4.wav",
  vocalChoir: "samples/epic_choir_f4.wav",
  kick: "samples/FSS_SHDEV1_Kick_Silver.wav",
  clap: "samples/FSS_SHDEV2_Clap_Clean.wav",
  strings: "samples/Srm_lush_strings.wav",
  percussionLoop: "samples/PLX_140_percussion_loop_brain.wav",
  sidechainedNoise: "samples/03_Audiotent_-_UNF_-_Sidechained_Noise_-_127bpm.wav",
  handRaise: "samples/FSS_RKHSOD_150_synth_screech_loop_gatedshortfour.wav",
  breakcoreKick: "samples/FSS_SHDEV1_Hard_Kick_Whiteroom_B.wav",
  glitchBeat: "samples/RU_TD_135_textures_fx_glitch_minimal.wav",
  // NEW: Add a pop hook sample (you'll need to add this file)
  popHook: "samples/newjeans_omg_hook_processed.wav" // Processed version of New Jeans hook
};

// Chord progression (Bb minor key to match New Jeans OMG transposed)
const chordProgression = [
  ["Bb2", "D3", "F3", "Ab3"],   // Bb minor 7
  ["F2", "Ab2", "C3", "Eb3"],   // F minor 7  
  ["Db3", "F3", "Ab3", "C4"],   // Db major 7
  ["Eb2", "G2", "Bb2", "D3"]    // Eb minor 7
];

// Energetic repeating melodies
const repeatingMelodies = [
  {
    notes: ["F4", "Bb4", "D5", "F5", "Ab4", "F4", "Bb4", "D4", "F4", "Bb4"],
    timings: [0, 0.25, 0.5, 0.75, 1.0, 1.5, 1.75, 2.0, 2.5, 3.0],
    repeat: true
  },
  {
    notes: ["C5", "F4", "Ab4", "C5", "Eb5", "Ab4", "F4", "C4", "F4", "Ab4"],
    timings: [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.75, 2.0, 2.25, 2.75],
    repeat: true
  },
  {
    notes: ["Ab4", "Db5", "F5", "Ab5", "C5", "Ab4", "Db4", "F4", "Ab4", "Db5"],
    timings: [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.25, 2.5],
    repeat: true
  },
  {
    notes: ["Bb4", "Eb5", "G4", "Bb4", "D5", "Bb4", "Eb4", "G4", "Bb4", "D5"],
    timings: [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5],
    repeat: true
  }
];

// Hymnal vocal chanting patterns (in Bb minor key)
const hymnalChanting = [
  {
    notes: ["Bb4", "F4"],
    timings: [0.5, 2.5],
    duration: "2m"
  },
  {
    notes: ["F4", "C5"],  
    timings: [1.0, 3.0],
    duration: "2m"
  },
  {
    notes: ["Db5", "Ab4"],
    timings: [0.0, 2.0],
    duration: "2m"
  },
  {
    notes: ["Eb4", "Bb4"],
    timings: [1.5, 3.5],
    duration: "2m"
  }
];

// Strings melodies
const stringsMelodies = [
  {
    notes: ["Bb3", "D4", "F3", "Ab3", "Bb3", "F3"],
    timings: [0, 1.0, 2.0, 3.0, 4.0, 5.0],
    duration: "2n"
  },
  {
    notes: ["F3", "Ab3", "C4", "Eb3", "F3", "C4"],
    timings: [0, 1.0, 2.0, 3.0, 4.0, 5.0],
    duration: "2n"
  },
  {
    notes: ["Db4", "F3", "Ab3", "C4", "Db4", "Ab3"],
    timings: [0, 1.0, 2.0, 3.0, 4.0, 5.0],
    duration: "2n"
  },
  {
    notes: ["Eb3", "G3", "Bb3", "D4", "Eb3", "Bb3"],
    timings: [0, 1.0, 2.0, 3.0, 4.0, 5.0],
    duration: "2n"
  }
];

let currentChordIndex = 0;

function setup() {
  // FULL SCREEN SETUP - maintain aspect ratio
  let canvasWidth = windowWidth;
  let canvasHeight = windowHeight;
  
  // Maintain 16:9 aspect ratio for video compatibility
  if (canvasWidth / canvasHeight > 16/9) {
    canvasWidth = canvasHeight * (16/9);
  } else {
    canvasHeight = canvasWidth * (9/16);
  }
  
  createCanvas(canvasWidth, canvasHeight);
  
  // Create trace buffer with same dimensions
  traceBuffer = createGraphics(canvasWidth, canvasHeight);
  
  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    console.log("Mobile device detected");
    showMobileInstructions();
    video = createCapture(VIDEO, videoReady);
    video.size(canvasWidth, canvasHeight);
  } else {
    video = createCapture(VIDEO, videoReady);
    video.size(canvasWidth, canvasHeight);
  }
  
  video.hide();
  
  console.log('Creating bodyPose...');
  try {
    bodyPose = ml5.bodyPose('BlazePose', modelReady);
  } catch (error) {
    console.error('Error creating bodyPose:', error);
  }
  
  // Initialize voice wave position
  voiceWavePosition = {x: width / 2, y: height / 2};
  voiceWaveTarget = {x: width / 2, y: height / 2};
  
  console.log("ENHANCED IDM POSE CONTROLLER - FINAL VERSION");
  console.log("✓ FIXED: Voice now stores and plays back recordings");
  console.log("✓ NEW: Floating meandering voice waveform visualization");
  console.log("✓ ENHANCED: Pop hook with glitchy effects + sped up snippets");
  console.log("✓ REFINED: Thinner white blob tracking (removed yellow dots)");
  console.log("✓ IMPROVED: Faster oscilloscope fading for cleaner lines");
  console.log("⚠️  USE HEADPHONES to prevent mic feedback!");
  console.log("SPACE=Voice recording, V=Glitchy pop hook, B=Blob tracking");
}

function modelReady() {
  console.log('✓ BlazePose model loaded successfully!');
  modelLoaded = true;
  
  try {
    connections = bodyPose.getSkeleton();
    console.log('✓ Skeleton connections loaded:', connections ? connections.length : 'none');
  } catch (error) {
    console.error('Error getting skeleton:', error);
    connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]
    ];
  }
  
  if (video && video.elt && video.elt.readyState === 4) {
    startPoseDetection();
  }
}

function videoReady() {
  console.log('✓ Video ready');
  if (modelLoaded && !poseDetectionStarted) {
    startPoseDetection();
  }
}

function startPoseDetection() {
  if (poseDetectionStarted || !modelLoaded || !video) return;
  
  console.log('Starting pose detection...');
  try {
    bodyPose.detectStart(video, gotPoses);
    poseDetectionStarted = true;
    console.log('✓ Pose detection started successfully');
  } catch (error) {
    console.error('Error starting pose detection:', error);
  }
}

function showMobileInstructions() {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    const instructionDiv = document.createElement('div');
    instructionDiv.id = 'mobile-instructions';
    instructionDiv.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9); color: white; padding: 30px; border-radius: 15px;
      font-family: Arial, sans-serif; text-align: center; z-index: 1000;
      max-width: 300px;
    `;
    instructionDiv.innerHTML = `
      <h2>🎵 Enhanced IDM Controller</h2>
      <p>Voice + Movement + Glitch</p>
      <p><strong>TAP TO START</strong></p>
      <p style="font-size: 12px; margin-top: 20px;">
        • Allow camera + mic access<br>
        • <strong>USE HEADPHONES!</strong><br>
        • Turn up volume<br>
        • Move and speak to control music<br>
        • Now with blob tracking + voice loops!
      </p>
    `;
    document.body.appendChild(instructionDiv);
  }
}

async function initializeAudio() {
  if (audioInitialized) return;
  
  console.log("Initializing enhanced audio system...");
  
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  try {
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }
    await Tone.start();
    console.log("✓ Tone.js started successfully");
    
  } catch (error) {
    console.error("Audio initialization error:", error);
    if (isMobile) {
      alert(`Mobile audio failed. Please:\n1. Turn up volume\n2. Turn off silent mode\n3. Use Chrome or Safari`);
    }
    return;
  }
  
  // Create master gain and analyzer
  masterGain = new Tone.Gain(1).toDestination();
  dryGain = new Tone.Gain(1).connect(masterGain); // Direct path for drums
  audioAnalyzer = new Tone.Analyser('fft', 512);
  masterGain.connect(audioAnalyzer);
  
  // NEW: Initialize microphone input with feedback prevention
  try {
    micInput = new Tone.UserMedia();
    await micInput.open();
    console.log("✓ Microphone access granted");
    
    // FEEDBACK PREVENTION: Add noise gate and aggressive filtering
    const voiceGate = new Tone.Gate(-30, 0.1); // Gate at -30dB to prevent feedback
    const voiceHighPass = new Tone.Filter(300, "highpass"); // Remove low freq feedback
    const voiceCompressor = new Tone.Compressor(-24, 3); // Compress to control levels
    const voiceDelay = new Tone.FeedbackDelay("8n", 0.4); // Reduced feedback
    const voiceDistortion = new Tone.Distortion(0.3); // Reduced distortion
    const voiceFilter = new Tone.Filter(800, "lowpass");
    const voiceBitCrusher = new Tone.BitCrusher(4);
    
    voiceEffectsChain = micInput.connect(voiceGate);
    voiceGate.connect(voiceHighPass);
    voiceHighPass.connect(voiceCompressor);
    voiceCompressor.connect(voiceDistortion);
    voiceDistortion.connect(voiceBitCrusher);
    voiceBitCrusher.connect(voiceFilter);
    voiceFilter.connect(voiceDelay);
    voiceDelay.connect(masterGain);
    
    // Create grain player for voice loops
    voiceGrainPlayer = new Tone.GrainPlayer({
      grainSize: 0.1,
      overlap: 0.1,
      volume: -18 // Quieter to prevent feedback
    }).connect(voiceEffectsChain);
    
    console.log("✓ Voice processing chain created with feedback prevention");
    console.warn("⚠️ USE HEADPHONES to prevent microphone feedback!");
    
  } catch (error) {
    console.warn("Microphone not available:", error);
  }
  
  // LFO for arpeggio flutter  
  arpeggioLFO = new Tone.LFO({
    frequency: 6,
    type: "sine",
    min: 200,
    max: 2000
  }).start();
  
  arpeggioFlutterFilter = new Tone.Filter({
    frequency: 800,
    type: "lowpass",
    Q: 3
  });
  
  arpeggioLFO.connect(arpeggioFlutterFilter.frequency);
  
  // Create effects chain
  masterDistortion = new Tone.Distortion({
    distortion: 0.1,
    wet: 0.2
  });
  
  masterReverb = new Tone.Reverb({
    roomSize: 0.8,
    decay: 4,
    wet: 0.3
  });
  
  masterDelay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.4,
    wet: 0.2
  });
  
  masterDistortion.connect(masterDelay);
  masterDelay.connect(masterReverb);
  masterReverb.connect(masterGain);
  
  // Filter chain
  brightnessFilter = new Tone.Filter({
    frequency: 400,
    type: "lowpass",
    rolloff: -24,
    Q: 2
  }).connect(masterDistortion);
  
  motionFilter = new Tone.Filter({
    frequency: 800,
    type: "bandpass",
    rolloff: -12,
    Q: 1
  }).connect(brightnessFilter);
  
  palmFilter = new Tone.Filter({
    frequency: 1200,
    type: "highpass",
    rolloff: -12,
    Q: 3
  }).connect(motionFilter);
  
  // Gating effects
  stringsGate = new Tone.Tremolo({
    frequency: 4,
    depth: 0
  }).connect(palmFilter);
  
  choirGate = new Tone.Tremolo({
    frequency: 6,
    depth: 0
  }).connect(palmFilter);
  
  // Evolving LFO for strings
  stringsLFO = new Tone.LFO({
    frequency: 0.2,
    type: "sine",
    min: 0.1,
    max: 0.8
  }).start();
  
  // Load samples
  await loadSamples();
  
  Tone.getTransport().bpm.value = 125;
  audioInitialized = true;
  console.log("✓ Enhanced audio system ready");
}

async function loadSamples() {
  console.log("Loading samples...");
  
  try {
    // BASS SAMPLER
    bassSampler = new Tone.Sampler({
      urls: {
        "C2": samplePaths.bass
      },
      volume: 0,
      attack: 0.1,
      release: 4,
      curve: "exponential"
    }).connect(brightnessFilter);
    
    // ARPEGGIO SAMPLER - quieter
    arpeggioSampler = new Tone.Sampler({
      urls: {
        "C3": samplePaths.arpeggio
      },
      volume: -12,
      attack: 0.1,
      release: 1.0,
      onload: () => {
        console.log("✓ ARPEGGIO SAMPLE LOADED");
        if (arpeggioFlutterFilter && brightnessFilter) {
          arpeggioSampler.connect(arpeggioFlutterFilter);
          arpeggioFlutterFilter.connect(brightnessFilter);
        } else {
          arpeggioSampler.connect(brightnessFilter);
        }
      }
    });
    
    // BELL SAMPLER
    bellSampler = new Tone.Sampler({
      urls: {
        "D4": samplePaths.bell
      },
      volume: -6
    }).connect(masterReverb);
    
    // VOCAL CHOIR SAMPLER - very loud
    vocalChoirSampler = new Tone.Sampler({
      urls: {
        "F4": samplePaths.vocalChoir
      },
      volume: 6,
      attack: 0.5,
      release: 2,
      onload: () => {
        console.log("✓ Vocal choir sample loaded");
      }
    }).connect(choirGate);
    
    // KICK SAMPLER - dry path
    kickSampler = new Tone.Sampler({
      urls: {
        "C1": samplePaths.kick
      },
      volume: -6,
      onload: () => {
        console.log("✓ Kick loaded - connecting to dry gain");
        kickSampler.connect(dryGain);
      }
    });
    
    // CLAP SAMPLER - dry path
    clapSampler = new Tone.Sampler({
      urls: {
        "C3": samplePaths.clap
      },
      volume: -12,
      onload: () => {
        console.log("✓ Clap loaded - connecting to dry gain");
        clapSampler.connect(dryGain);
      }
    });
    
    // STRINGS SAMPLER with evolving LFO
    stringsSampler = new Tone.Sampler({
      urls: {
        "G3": samplePaths.strings
      },
      volume: 3,
      attack: 1.5,
      release: 4,
      onload: () => {
        console.log("✓ Strings sample loaded");
        if (stringsLFO) {
          stringsLFO.connect(stringsSampler.volume);
        }
      }
    }).connect(stringsGate);
    
    // HAND RAISE SYNTH - NEW: Harmonic version
    handRaiseSynth = new Tone.Sampler({
      urls: {
        "C3": samplePaths.handRaise
      },
      volume: -6
    }).connect(palmFilter);
    
    // BREAKCORE KICK
    breakcoreKick = new Tone.Sampler({
      urls: {
        "C1": samplePaths.breakcoreKick
      },
      volume: -3,
      onload: () => {
        console.log("✓ Breakcore kick loaded");
      }
    }).connect(masterDistortion);
    
    // PERCUSSION LOOP
    percussionLoop = new Tone.Player({
      url: samplePaths.percussionLoop,
      loop: true,
      volume: -12,
      onload: () => {
        console.log("✓ Percussion loop loaded");
      }
    }).connect(motionFilter);
    
    // SIDECHAINED NOISE
    sidechainedNoise = new Tone.Player({
      url: samplePaths.sidechainedNoise,
      loop: true,
      volume: -9,
      onload: () => {
        console.log("✓ Sidechained noise loaded");
        sidechainedNoise.playbackRate = 0.984;
      }
    }).connect(palmFilter);
    
    // GLITCH BEAT - MUCH LOUDER NOW
    glitchBeat = new Tone.Player({
      url: samplePaths.glitchBeat,
      loop: true,
      volume: 3, // BOOSTED from 0 to +3dB for better audibility
      onload: () => {
        console.log("✓ Glitchy minimal beat loaded - BOOSTED VOLUME");
        glitchBeat.connect(dryGain); // Connect to dry gain for clarity
      }
    });
    
    // NEW: POP HOOK SAMPLER (New Jeans OMG style)
    popHookSampler = new Tone.Sampler({
      urls: {
        "Bb3": samplePaths.popHook // Assuming processed to Bb minor
      },
      volume: -3,
      attack: 0.05,
      release: 2,
      onload: () => {
        console.log("✓ Pop hook sample loaded");
      }
    }).connect(masterReverb);
    
    await Tone.loaded();
    samplesLoaded = true;
    console.log("✓ All samples loaded successfully");
    
  } catch (error) {
    console.error("Error loading samples:", error);
    alert("Error loading audio samples. Some samples may be missing.");
  }
}

// NEW: Voice recording functions - FIXED TO ACTUALLY STORE AND PLAYBACK
function startVoiceRecording() {
  if (!micInput || isRecordingVoice) return;
  
  isRecordingVoice = true;
  recordingStartTime = millis();
  
  console.log("🎤 Recording voice...");
  
  // Stop any existing voice loop first
  if (voiceGrainPlayer && voiceGrainPlayer.state === 'started') {
    voiceGrainPlayer.stop();
  }
  
  // Record for up to 4 seconds
  micRecorder = new Tone.Recorder();
  micInput.connect(micRecorder);
  micRecorder.start();
  
  setTimeout(() => {
    if (isRecordingVoice) {
      stopVoiceRecording();
    }
  }, maxRecordingTime);
}

async function stopVoiceRecording() {
  if (!isRecordingVoice || !micRecorder) return;
  
  isRecordingVoice = false;
  
  try {
    const recording = await micRecorder.stop();
    console.log("✓ Voice recorded, creating stored loop...");
    
    // Disconnect live mic from effects chain during playback
    if (micInput && voiceEffectsChain) {
      micInput.disconnect(voiceEffectsChain);
    }
    
    // Create a NEW grain player with the stored recording
    if (voiceGrainPlayer) {
      voiceGrainPlayer.dispose(); // Clean up old one
    }
    
    voiceGrainPlayer = new Tone.GrainPlayer({
      url: recording,
      loop: true,
      grainSize: 0.15,
      overlap: 0.2,
      volume: -9
    });
    
    // Connect to effects chain for glitchy playback
    voiceGrainPlayer.connect(voiceEffectsChain);
    voiceGrainPlayer.start();
    voiceVisualsActive = true;
    
    console.log("🔄 Voice loop started from stored recording");
    
    // Auto-stop after 30 seconds and reconnect live mic
    setTimeout(() => {
      if (voiceGrainPlayer) {
        voiceGrainPlayer.stop();
        voiceGrainPlayer.dispose();
        voiceVisualsActive = false;
        // Reconnect live mic for next recording
        if (micInput && voiceEffectsChain) {
          micInput.connect(voiceEffectsChain);
        }
        console.log("Voice loop ended, live mic reconnected");
      }
    }, 30000);
    
  } catch (error) {
    console.error("Error processing voice recording:", error);
  }
}

// NEW: Enhanced pop hook trigger with glitch effects
function triggerPopHook() {
  if (!popHookSampler || !popHookSampler.loaded || popHookActive) return;
  
  popHookActive = true;
  console.log("🎵 Triggering enhanced glitchy pop hook...");
  
  // Main hook playback with heavy glitch effects
  const currentChord = chordProgression[currentChordIndex];
  
  // Create glitch effects chain for main hook
  const bitCrusher = new Tone.BitCrusher(6);
  const chorus = new Tone.Chorus(4, 2.5, 0.5);
  const tremolo = new Tone.Tremolo(8, 0.7);
  const filter = new Tone.Filter(1200, "lowpass");
  
  // Chain the effects
  popHookSampler.chain(bitCrusher, chorus, tremolo, filter, masterReverb);
  
  // Play main hook (slow vaporwave version)
  popHookSampler.triggerAttackRelease(currentChord[0], "4m", "+0", 0.7);
  
  // NEW: Sped up glitchy snippet
  const speedyHook = new Tone.GrainPlayer({
    url: popHookSampler.buffer,
    loop: true,
    grainSize: 0.05, // Very small grains for glitch
    overlap: 0.1,
    playbackRate: 2.5, // Much faster
    volume: -12
  });
  
  // Glitch effects for speedy version
  const speedyBitCrusher = new Tone.BitCrusher(4);
  const speedyReverb = new Tone.Reverb({
    roomSize: 0.9,
    decay: 2,
    wet: 0.8
  });
  const speedyDelay = new Tone.PingPongDelay("16n", 0.3);
  
  speedyHook.chain(speedyBitCrusher, speedyDelay, speedyReverb, masterGain);
  
  // Start speedy hook with delay
  setTimeout(() => {
    if (speedyHook) {
      speedyHook.start();
      console.log("🚀 Speedy glitch hook started");
    }
  }, 2000); // Start after 2 seconds
  
  setTimeout(() => {
    popHookActive = false;
    
    // Clean up effects
    setTimeout(() => {
      bitCrusher.dispose();
      chorus.dispose();
      tremolo.dispose();
      filter.dispose();
      speedyHook.dispose();
      speedyBitCrusher.dispose();
      speedyReverb.dispose();
      speedyDelay.dispose();
    }, 1000);
    
  }, 16000); // 4 measures
}

function startAmbientMusic() {
  if (isPlaying || !samplesLoaded) return;
  isPlaying = true;
  
  console.log("Starting enhanced ambient music...");
  if (window.updateStatus) window.updateStatus("Playing");
  
  // Bass chords
  Tone.getTransport().scheduleRepeat((time) => {
    const currentChord = chordProgression[currentChordIndex];
    bassSampler.triggerAttackRelease(currentChord[0], "2m", time, 0.8);
    
    Tone.getTransport().schedule((time2) => {
      bassSampler.triggerAttackRelease(currentChord[0], "1m", time2, 0.4);
    }, `+1m`);
    
    currentChordIndex = (currentChordIndex + 1) % chordProgression.length;
  }, "2m");
  
  // Fast repeating melodies + strings + chanting
  let melodyChordIndex = 0;
  
  Tone.getTransport().scheduleRepeat((time) => {
    const currentMelody = repeatingMelodies[melodyChordIndex];
    const currentStrings = stringsMelodies[melodyChordIndex];
    const currentChanting = hymnalChanting[melodyChordIndex];
    
    // Arpeggio melody
    currentMelody.notes.forEach((note, index) => {
      const noteTime = currentMelody.timings[index];
      
      if (noteTime < 4.0) {
        Tone.getTransport().schedule((scheduleTime) => {
          if (arpeggioSampler && arpeggioSampler.loaded) {
            const velocity = 0.4 + Math.random() * 0.1;
            arpeggioSampler.triggerAttackRelease(note, "16n", scheduleTime, velocity);
          }
        }, `+${noteTime * 0.5}`);
      }
    });
    
    // Strings melody
    currentStrings.notes.forEach((note, index) => {
      const stringTime = currentStrings.timings[index];
      
      Tone.getTransport().schedule((scheduleTime) => {
        if (stringsSampler && stringsSampler.loaded) {
          const velocity = 0.5 + Math.random() * 0.1;
          stringsSampler.triggerAttackRelease(note, currentStrings.duration, scheduleTime, velocity);
        }
      }, `+${stringTime * 0.5}`);
    });
    
    // Hymnal chanting
    currentChanting.notes.forEach((note, index) => {
      const chantTime = currentChanting.timings[index];
      
      Tone.getTransport().schedule((scheduleTime) => {
        if (vocalChoirSampler && vocalChoirSampler.loaded) {
          const velocity = 0.7 + Math.random() * 0.1;
          vocalChoirSampler.triggerAttackRelease(note, currentChanting.duration, scheduleTime, velocity);
        }
      }, `+${chantTime}`);
    });
    
    melodyChordIndex = (melodyChordIndex + 1) % repeatingMelodies.length;
  }, "2m");
  
  // Subtle kick and clap rhythm
  Tone.getTransport().scheduleRepeat((time) => {
    kickSampler.triggerAttackRelease("C1", "8n", time, 0.3);
  }, "1m");
  
  Tone.getTransport().scheduleRepeat((time) => {
    if (Math.random() > 0.7) {
      clapSampler.triggerAttackRelease("C3", "8n", time, 0.2);
    }
  }, "2n");
  
  // Strings with evolving LFO
  const stringChords = [
    ["G3", "D4", "G4"],
    ["C3", "G3", "C4"],
    ["D3", "A3", "D4"],
    ["F3", "C4", "F4"]
  ];
  let stringChordIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    const chord = stringChords[stringChordIndex % stringChords.length];
    if (stringsSampler && stringsSampler.loaded) {
      chord.forEach((note, index) => {
        stringsSampler.triggerAttackRelease(note, "2m", time + (index * 0.05), 0.6);
      });
    }
    stringChordIndex++;
  }, "2m");
  
  // Start loops
  if (percussionLoop && percussionLoop.loaded) {
    percussionLoop.sync().start(0);
  }
  
  if (sidechainedNoise && sidechainedNoise.loaded) {
    sidechainedNoise.sync().start("0:0:0");
  }
  
  if (glitchBeat && glitchBeat.loaded) {
    glitchBeat.sync().start("0:0:0");
  }
  
  Tone.getTransport().start();
}

function startBreakcore() {
  if (isBreakcoreActive || !samplesLoaded || !breakcoreKick || !breakcoreKick.loaded) {
    return;
  }
  
  isBreakcoreActive = true;
  breakcoreStartTime = millis();
  
  console.log("🔥 GABBER BREAKCORE ACTIVATED!");
  
  const breakcorePattern = [
    0, 0.125, 0.25, 0.5, 0.625, 0.75, 1.0, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.875,
    2.0, 2.0625, 2.125, 2.1875, 2.25, 2.3125, 2.375, 2.4375, 2.5, 2.5625, 2.625, 2.75, 2.875,
    3.0, 3.125, 3.25, 3.375, 3.4375, 3.5, 3.5625, 3.625, 3.6875, 3.75, 3.8125, 3.875, 3.9375
  ];
  
  breakcorePattern.forEach(beat => {
    Tone.getTransport().schedule((time) => {
      if (breakcoreKick && breakcoreKick.loaded) {
        breakcoreKick.triggerAttackRelease("C1", "32n", time, 0.9);
      }
    }, `+${beat}`);
  });
  
  setTimeout(() => {
    isBreakcoreActive = false;
    console.log("Gabber breakcore ended");
  }, breakCoreDuration);
}

function stopMusic() {
  if (!isPlaying) return;
  isPlaying = false;
  
  try {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    
    if (percussionLoop && percussionLoop.state === 'started') {
      percussionLoop.stop();
    }
    
    if (sidechainedNoise && sidechainedNoise.state === 'started') {
      sidechainedNoise.stop();
    }
    
    if (glitchBeat && glitchBeat.state === 'started') {
      glitchBeat.stop();
    }
    
    if (voiceGrainPlayer && voiceGrainPlayer.state === 'started') {
      voiceGrainPlayer.stop();
      voiceVisualsActive = false;
    }
    
    // Release all samplers
    if (bassSampler) bassSampler.releaseAll();
    if (arpeggioSampler) arpeggioSampler.releaseAll();
    if (stringsSampler) stringsSampler.releaseAll();
    if (vocalChoirSampler) vocalChoirSampler.releaseAll();
    
    isBreakcoreActive = false;
    console.log('✓ All music stopped');
    if (window.updateStatus) window.updateStatus("Stopped");
  } catch (error) {
    console.error('Error stopping music:', error);
  }
}

// All gesture calculation functions remain the same...
function calculateJumpAmount(pose) {
  const leftAnkle = pose.keypoints[27];
  const rightAnkle = pose.keypoints[28];
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  const leftHip = pose.keypoints[23];
  const rightHip = pose.keypoints[24];
  
  if (leftAnkle && rightAnkle && leftShoulder && rightShoulder && leftHip && rightHip &&
      leftAnkle.confidence > 0.6 && rightAnkle.confidence > 0.6 && 
      leftShoulder.confidence > 0.6 && rightShoulder.confidence > 0.6) {
    
    // Calculate body center and dimensions
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    const bodyHeight = avgAnkleY - avgShoulderY;
    
    // More lenient body proportion check
    if (bodyHeight < 150 || bodyHeight > 600) {
      return 0;
    }
    
    // Check if person is reasonably centered
    const avgBodyX = (leftShoulder.x + rightShoulder.x) / 2;
    if (avgBodyX < width * 0.2 || avgBodyX > width * 0.8) {
      return 0;
    }
    
    // IMPROVED: Use hip-to-ankle distance for more stable ground reference
    const hipToAnkleDistance = avgAnkleY - avgHipY;
    const expectedHipToAnkle = bodyHeight * 0.4; // Roughly 40% of body height
    
    // Calculate elevation based on hip-ankle ratio
    const elevationRatio = (expectedHipToAnkle - hipToAnkleDistance) / expectedHipToAnkle;
    const rawJump = constrain(elevationRatio * 2, 0, 2); // Scale up for sensitivity
    
    // Add to jump history for consistency
    jumpHistory.push(rawJump);
    if (jumpHistory.length > 3) { // Shorter history for faster response
      jumpHistory.shift();
    }
    
    // Only consider it a jump if consistently elevated
    const avgJump = jumpHistory.reduce((sum, val) => sum + val, 0) / jumpHistory.length;
    const consistentJump = jumpHistory.filter(j => j > 0.3).length >= 2; // 2 out of 3 frames
    
    console.log(`Jump calc: hip-ankle=${hipToAnkleDistance.toFixed(1)}, expected=${expectedHipToAnkle.toFixed(1)}, raw=${rawJump.toFixed(2)}, avg=${avgJump.toFixed(2)}, consistent=${consistentJump}`);
    
    return consistentJump ? avgJump : 0;
  }
  
  return 0;
}

// NEW: Calculate blob tracking bounding box
function calculateBlobTracking(pose) {
  if (!pose.keypoints) return;
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let validPoints = 0;
  
  // Find bounding box of all visible keypoints
  for (let i = 0; i < pose.keypoints.length; i++) {
    const keypoint = pose.keypoints[i];
    if (keypoint && keypoint.confidence > 0.3) {
      minX = Math.min(minX, keypoint.x);
      maxX = Math.max(maxX, keypoint.x);
      minY = Math.min(minY, keypoint.y);
      maxY = Math.max(maxY, keypoint.y);
      validPoints++;
    }
  }
  
  if (validPoints > 5) { // Need enough points for valid tracking
    bodyBoundingBox = {
      x: minX - 20, // Add padding
      y: minY - 20,
      width: (maxX - minX) + 40,
      height: (maxY - minY) + 40
    };
    blobTrackingActive = true;
    
    // Update tracking points for glitch effect
    trackingPoints = [];
    for (let i = 0; i < 8; i++) {
      trackingPoints.push({
        x: minX + (maxX - minX) * Math.random(),
        y: minY + (maxY - minY) * Math.random(),
        age: 0
      });
    }
  } else {
    blobTrackingActive = false;
  }
}

function calculateArmStretch(pose) {
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  
  if (leftShoulder && rightShoulder && leftWrist && rightWrist &&
      leftShoulder.confidence > 0.5 && rightShoulder.confidence > 0.5 &&
      leftWrist.confidence > 0.5 && rightWrist.confidence > 0.5) {
    
    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const centerY = (leftShoulder.y + rightShoulder.y) / 2;
    bodyCenter = {x: centerX, y: centerY};
    
    bodyCenterSmooth.x = lerp(bodyCenterSmooth.x, centerX, 0.15);
    bodyCenterSmooth.y = lerp(bodyCenterSmooth.y, centerY, 0.15);
    
    bodyRotation = atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
    
    const leftDistance = dist(centerX, centerY, leftWrist.x, leftWrist.y);
    const rightDistance = dist(centerX, centerY, rightWrist.x, rightWrist.y);
    const avgDistance = (leftDistance + rightDistance) / 2;
    
    const shoulderWidth = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
    const normalizedDistance = avgDistance / (shoulderWidth * 1.8);
    
    return constrain(normalizedDistance, 0, 1);
  }
  
  return armStretch;
}

function calculateHandHeight(pose) {
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  const nose = pose.keypoints[0];
  
  if (leftWrist && rightWrist && nose &&
      leftWrist.confidence > 0.5 && rightWrist.confidence > 0.5 && nose.confidence > 0.5) {
    
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;
    const handHeightRaw = nose.y - avgWristY;
    
    return constrain(handHeightRaw / 400, -1, 1);
  }
  
  return handHeight;
}

function calculatePalmDirection(pose) {
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  
  if (leftShoulder && rightShoulder && leftWrist && rightWrist &&
      leftShoulder.confidence > 0.5 && rightShoulder.confidence > 0.5 &&
      leftWrist.confidence > 0.5 && rightWrist.confidence > 0.5) {
    
    const handDistance = Math.abs(rightWrist.x - leftWrist.x);
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const normalizedWidth = constrain((handDistance - shoulderWidth * 0.5) / (shoulderWidth * 1.5), 0, 1);
    
    return normalizedWidth;
  }
  
  return palmDirection;
}

function calculateMotionAmount(currentPose) {
  if (previousPoses.length === 0) {
    previousPoses.push(currentPose);
    return 0;
  }
  
  const prevPose = previousPoses[previousPoses.length - 1];
  let totalMotion = 0;
  let validPoints = 0;
  
  const majorBodyPoints = [11, 12, 23, 24];
  
  for (let i of majorBodyPoints) {
    const current = currentPose.keypoints[i];
    const previous = prevPose.keypoints[i];
    
    if (current && previous && current.confidence > 0.7 && previous.confidence > 0.7) {
      const distance = dist(current.x, current.y, previous.x, previous.y);
      totalMotion += distance;
      validPoints++;
    }
  }
  
  previousPoses.push(currentPose);
  if (previousPoses.length > 8) {
    previousPoses.shift();
  }
  
  const avgMotion = validPoints > 0 ? totalMotion / validPoints : 0;
  motionAmountRaw = constrain(avgMotion / 20, 0, 1);
  
  return motionAmountRaw;
}

function updateAudioFilters() {
  if (!audioInitialized || !samplesLoaded) return;
  
  armStretchSmooth = lerp(armStretchSmooth, armStretch, 0.1);
  
  if (motionAmountRaw > motionAmountSmooth) {
    motionAmountSmooth = lerp(motionAmountSmooth, motionAmountRaw, 0.3);
  } else {
    motionAmountSmooth = lerp(motionAmountSmooth, motionAmountRaw, motionDecayRate);
  }
  
  motionHistory.push(motionAmountSmooth);
  if (motionHistory.length > 30) {
    motionHistory.shift();
  }
  
  motionAverage = motionHistory.reduce((sum, val) => sum + val, 0) / motionHistory.length;
  
  handHeightSmooth = lerp(handHeightSmooth, handHeight, 0.1);
  
  // ARM STRETCH → BRIGHTNESS FILTER
  brightnessFreq = map(armStretchSmooth, 0, 1, 8000, 500);
  brightnessFilter.frequency.rampTo(brightnessFreq, 0.5);
  
  // MOTION AVERAGE → PERCUSSION LOOP VOLUME
  const percVol = map(motionAverage, 0, 0.4, -20, -6);
  if (percussionLoop && percussionLoop.loaded) {
    percussionLoop.volume.rampTo(percVol, 0.3);
  }
  
  // MOTION → GLITCH BEAT VOLUME (boosted)
  const glitchVol = map(palmDirection, 0, 1, 3, 9); // BOOSTED range: +3dB to +9dB
  if (glitchBeat && glitchBeat.loaded) {
    glitchBeat.volume.rampTo(glitchVol, 0.3);
  }
  
  // PALM DIRECTION → HIGH-PASS FILTER
  palmFreq = map(palmDirection, 0, 1, 200, 3000);
  palmFilter.frequency.rampTo(palmFreq, 0.8);
  
  // HAND HEIGHT → GATING EFFECT
  const gateDepth = map(Math.abs(handHeightSmooth), 0, 1, 0, 0.95);
  const gateRate = map(Math.abs(handHeightSmooth), 0, 1, 1, 20);
  
  if (stringsGate) {
    stringsGate.depth.rampTo(gateDepth, 0.2);
    stringsGate.frequency.rampTo(gateRate, 0.2);
  }
  
  if (choirGate) {
    choirGate.depth.rampTo(gateDepth, 0.2);
    choirGate.frequency.rampTo(gateRate * 1.5, 0.2);
  }
  
  // HAND HEIGHT → HARMONIC HAND RAISE SYNTH + KICK
  if (handHeightSmooth > 0.4 && millis() - lastTwinkleTime > 1000) {
    triggerHarmonicHandRaiseSynth();
    lastTwinkleTime = millis();
  }
  
  // HAND HEIGHT → JERSEY CLUB KICK
  if (handHeightSmooth > 0.6 && millis() - lastJumpTime > 4000 && !jerseyClubActive) {
    startJerseyClubKick();
    lastJumpTime = millis();
  }
  
  // JUMP → BREAKCORE TRIGGER
  if (jumpAmount > jumpThreshold && millis() - lastJumpTime > 5000 && !isBreakcoreActive) {
    startBreakcore();
    lastJumpTime = millis();
  }
}

// NEW: Harmonic hand raise synth (fits better with the music)
function triggerHarmonicHandRaiseSynth() {
  if (!audioInitialized) return;
  
  const handRangeNormalized = map(handHeightSmooth, 0.4, 1.0, 0.3, 1.0);
  const kickVelocity = constrain(handRangeNormalized, 0.3, 1.0);
  
  // Trigger kick
  if (kickSampler && kickSampler.loaded) {
    kickSampler.triggerAttackRelease("C1", "8n", "+0", kickVelocity);
  }
  
  if (handRaiseSynth && handRaiseSynth.loaded) {
    // Play in the current chord key for harmony
    const currentChord = chordProgression[currentChordIndex % chordProgression.length];
    const baseNote = currentChord[0]; // Get root note
    handRaiseSynth.triggerAttackRelease(baseNote.replace('2', '4'), "1n", "+0", kickVelocity);
  } else {
    // HARMONIC fallback synth in current key
    const harmonicSynth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { 
        attack: 0.01, 
        decay: 0.2, 
        sustain: 0.6, 
        release: 1.0 
      }
    });
    
    const harmonicFilter = new Tone.Filter({
      frequency: 2000,
      type: "lowpass",
      Q: 8
    });
    
    harmonicSynth.connect(harmonicFilter);
    harmonicFilter.connect(masterGain);
    
    // Play chord tones for harmony
    const currentChord = chordProgression[currentChordIndex % chordProgression.length];
    currentChord.forEach((note, index) => {
      const harmNote = note.replace('2', '5').replace('3', '5'); // Move to 5th octave
      harmonicSynth.triggerAttackRelease(harmNote, "4n", `+${index * 0.02}`, kickVelocity * 0.8);
    });
    
    setTimeout(() => {
      harmonicSynth.dispose();
      harmonicFilter.dispose();
    }, 3000);
  }
}

// NEW: Voice visualization (floating meandering waveform)
function drawVoiceVisualization() {
  if (!voiceVisualsActive) return;
  
  push();
  
  // Update floating position (slow meandering movement)
  if (frameCount % 120 === 0) { // Change target every 2 seconds
    voiceWaveTarget.x = random(width * 0.2, width * 0.8);
    voiceWaveTarget.y = random(height * 0.2, height * 0.8);
  }
  
  // Smooth movement toward target
  voiceWavePosition.x = lerp(voiceWavePosition.x, voiceWaveTarget.x, 0.02);
  voiceWavePosition.y = lerp(voiceWavePosition.y, voiceWaveTarget.y, 0.02);
  
  // Create waveform points
  if (voiceWavePoints.length === 0) {
    for (let i = 0; i < 40; i++) {
      voiceWavePoints.push({x: 0, y: 0});
    }
  }
  
  // Update waveform points with audio-reactive motion
  for (let i = 0; i < voiceWavePoints.length; i++) {
    let angle = (i / voiceWavePoints.length) * TWO_PI * 2;
    let baseRadius = 60;
    
    // Add voice activity modulation
    let voiceModulation = isRecordingVoice ? 20 : 10;
    let timeModulation = sin(millis() * 0.01 + i * 0.3) * voiceModulation;
    let radius = baseRadius + timeModulation;
    
    voiceWavePoints[i].x = voiceWavePosition.x + cos(angle) * radius;
    voiceWavePoints[i].y = voiceWavePosition.y + sin(angle) * radius;
  }
  
  // Draw the floating waveform
  stroke(255, 100, 255, 150); // Purple semi-transparent
  strokeWeight(1.5);
  noFill();
  
  beginShape();
  for (let i = 0; i < voiceWavePoints.length; i++) {
    let point = voiceWavePoints[i];
    
    // Add small random jitter for organic feel
    let jitterX = random(-2, 2);
    let jitterY = random(-2, 2);
    
    vertex(point.x + jitterX, point.y + jitterY);
  }
  endShape(CLOSE);
  
  // Add a second, inner waveform for complexity
  stroke(255, 100, 255, 80);
  strokeWeight(1);
  beginShape();
  for (let i = 0; i < voiceWavePoints.length; i += 2) {
    let point = voiceWavePoints[i];
    let innerX = voiceWavePosition.x + (point.x - voiceWavePosition.x) * 0.6;
    let innerY = voiceWavePosition.y + (point.y - voiceWavePosition.y) * 0.6;
    vertex(innerX, innerY);
  }
  endShape(CLOSE);
  
  // Recording indicator near the waveform
  if (isRecordingVoice) {
    fill(255, 50, 50, 200);
    noStroke();
    ellipse(voiceWavePosition.x, voiceWavePosition.y - 80, 12, 12);
    fill(255);
    textAlign(CENTER);
    textSize(8);
    text("REC", voiceWavePosition.x, voiceWavePosition.y - 75);
  } else if (voiceVisualsActive) {
    fill(100, 255, 100, 150);
    noStroke();
    ellipse(voiceWavePosition.x, voiceWavePosition.y - 80, 8, 8);
  }
  
  textAlign(LEFT); // Reset text alignment
  pop();
}

// NEW: Blob tracking visualization (TouchDesigner style) - REFINED
function drawBlobTracking() {
  if (!blobTrackingActive) return;
  
  push();
  
  // Mirror the bounding box to match video flip
  let mirroredBox = {
    x: width - (bodyBoundingBox.x + bodyBoundingBox.width),
    y: bodyBoundingBox.y,
    width: bodyBoundingBox.width,
    height: bodyBoundingBox.height
  };
  
  // Main bounding box with subtle glitch effect
  stroke(255, 255, 255, 180); // White lines as requested
  strokeWeight(1); // Thinner lines as requested
  noFill();
  
  // Subtle glitchy box effect
  let glitchOffset = sin(millis() * 0.02) * 2;
  rect(mirroredBox.x + glitchOffset, mirroredBox.y, mirroredBox.width, mirroredBox.height);
  
  // Corner brackets for tech aesthetic - also thinner
  strokeWeight(1.5);
  let cornerSize = 15;
  
  // Top-left corner
  line(mirroredBox.x, mirroredBox.y, mirroredBox.x + cornerSize, mirroredBox.y);
  line(mirroredBox.x, mirroredBox.y, mirroredBox.x, mirroredBox.y + cornerSize);
  
  // Top-right corner
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y, mirroredBox.x + mirroredBox.width - cornerSize, mirroredBox.y);
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y, mirroredBox.x + mirroredBox.width, mirroredBox.y + cornerSize);
  
  // Bottom-left corner
  line(mirroredBox.x, mirroredBox.y + mirroredBox.height, mirroredBox.x + cornerSize, mirroredBox.y + mirroredBox.height);
  line(mirroredBox.x, mirroredBox.y + mirroredBox.height, mirroredBox.x, mirroredBox.y + mirroredBox.height - cornerSize);
  
  // Bottom-right corner
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height, mirroredBox.x + mirroredBox.width - cornerSize, mirroredBox.y + mirroredBox.height);
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height, mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height - cornerSize);
  
  // Callout line to center of screen - thinner
  stroke(255, 255, 255, 120);
  strokeWeight(0.8);
  let boxCenterX = mirroredBox.x + mirroredBox.width / 2;
  let boxCenterY = mirroredBox.y + mirroredBox.height / 2;
  let screenCenterX = width / 2;
  let screenCenterY = height / 2;
  
  // Stepped callout line (more tech-like)
  line(boxCenterX, boxCenterY, screenCenterX, boxCenterY);
  line(screenCenterX, boxCenterY, screenCenterX, screenCenterY);
  
  // Info display at screen center
  fill(255, 255, 255, 180);
  noStroke();
  textAlign(CENTER);
  textSize(10);
  text(`TRACKING`, screenCenterX, screenCenterY - 8);
  text(`${mirroredBox.width.toFixed(0)}x${mirroredBox.height.toFixed(0)}`, screenCenterX, screenCenterY + 5);
  
  // Removed yellow tracking points as requested - too distracting
  
  pop();
}

// Visual drawing functions remain mostly the same, with additions...

function drawSubtleHandPattern(centerX, centerY, visualScale, reflect = false) {
  if (!audioAnalyzer) return;
  
  push();
  translate(centerX, centerY);
  rotate(bodyRotation);
  if (reflect) scale(-1, 1);
  
  const spectrum = audioAnalyzer.getValue();
  
  stroke(255, 120);
  strokeWeight(1.0 + visualScale * 0.01);
  noFill();
  
  beginShape();
  for (let i = 0; i < spectrum.length; i += 3) {
    let angle = map(i, 0, spectrum.length, 0, TWO_PI);
    let intensity = (spectrum[i] + 100) / 100;
    let radius = intensity * visualScale * 60;
    
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    
    vertex(x, y);
  }
  endShape(CLOSE);
  
  stroke(255, 80);
  strokeWeight(0.8);
  beginShape();
  for (let i = 0; i < spectrum.length; i += 6) {
    let angle = map(i, 0, spectrum.length, 0, TWO_PI);
    let intensity = (spectrum[i] + 100) / 100;
    let radius = intensity * visualScale * 90;
    
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    
    vertex(x, y);
  }
  endShape();
  
  pop();
}

function drawHandConnections(leftHandX, leftHandY, rightHandX, rightHandY, bodyX, bodyY) {
  if (!audioAnalyzer) return;
  
  const spectrum = audioAnalyzer.getValue();
  stroke(255, 60);
  strokeWeight(1.2);
  
  if (leftHandX && leftHandY) {
    for (let i = 0; i <= 20; i++) {
      let progress = i / 20;
      let x = lerp(leftHandX, bodyX, progress);
      let y = lerp(leftHandY, bodyY, progress);
      
      let specIndex = Math.floor(map(progress, 0, 1, 0, spectrum.length - 1));
      let intensity = (spectrum[specIndex] + 100) / 100;
      let distortion = intensity * 8;
      
      x += sin(progress * PI * 4 + millis() * 0.005) * distortion;
      y += cos(progress * PI * 4 + millis() * 0.005) * distortion;
      
      if (i > 0) {
        let prevProgress = (i - 1) / 20;
        let prevX = lerp(leftHandX, bodyX, prevProgress);
        let prevY = lerp(leftHandY, bodyY, prevProgress);
        let prevSpecIndex = Math.floor(map(prevProgress, 0, 1, 0, spectrum.length - 1));
        let prevIntensity = (spectrum[prevSpecIndex] + 100) / 100;
        let prevDistortion = prevIntensity * 8;
        
        prevX += sin(prevProgress * PI * 4 + millis() * 0.005) * prevDistortion;
        prevY += cos(prevProgress * PI * 4 + millis() * 0.005) * prevDistortion;
        
        line(prevX, prevY, x, y);
      }
    }
  }
  
  if (rightHandX && rightHandY) {
    for (let i = 0; i <= 20; i++) {
      let progress = i / 20;
      let x = lerp(rightHandX, bodyX, progress);
      let y = lerp(rightHandY, bodyY, progress);
      
      let specIndex = Math.floor(map(progress, 0, 1, 0, spectrum.length - 1));
      let intensity = (spectrum[specIndex] + 100) / 100;
      let distortion = intensity * 8;
      
      x += sin(progress * PI * 4 + millis() * 0.005 + PI) * distortion;
      y += cos(progress * PI * 4 + millis() * 0.005 + PI) * distortion;
      
      if (i > 0) {
        let prevProgress = (i - 1) / 20;
        let prevX = lerp(rightHandX, bodyX, prevProgress);
        let prevY = lerp(rightHandY, bodyY, prevProgress);
        let prevSpecIndex = Math.floor(map(prevProgress, 0, 1, 0, spectrum.length - 1));
        let prevIntensity = (spectrum[prevSpecIndex] + 100) / 100;
        let prevDistortion = prevIntensity * 8;
        
        prevX += sin(prevProgress * PI * 4 + millis() * 0.005 + PI) * prevDistortion;
        prevY += cos(prevProgress * PI * 4 + millis() * 0.005 + PI) * prevDistortion;
        
        line(prevX, prevY, x, y);
      }
    }
  }
}

function drawOscilloscopePatternToBuffer(buffer, centerX, centerY, visualScale) {
  if (!audioAnalyzer) return;
  
  buffer.push();
  buffer.translate(centerX, centerY);
  buffer.rotate(bodyRotation);
  
  const spectrum = audioAnalyzer.getValue();
  
  if (visualMode === 0) {
    drawLissajousScaleToBuffer(buffer, spectrum, visualScale);
  } else {
    drawSpectralFlowToBuffer(buffer, spectrum, visualScale);
  }
  
  buffer.pop();
}

function drawLissajousScaleToBuffer(buffer, spectrum, visualScale) {
  buffer.stroke(255, 100);
  buffer.strokeWeight(1 + visualScale * 0.01);
  buffer.noFill();
  
  buffer.beginShape();
  for (let i = 0; i < spectrum.length - 1; i++) {
    let x = (spectrum[i] + 100) / 100 * visualScale * 400;
    let y = (spectrum[i + 1] + 100) / 100 * visualScale * 400;
    
    let freqMod = (spectrum[i] + 100) / 100 * visualScale * 100;
    x += cos(i * 0.05) * freqMod;
    y += sin(i * 0.05) * freqMod;
    
    buffer.vertex(x, y);
  }
  buffer.endShape();
}

function drawSpectralFlowToBuffer(buffer, spectrum, visualScale) {
  buffer.stroke(255, 120);
  buffer.strokeWeight(1 + visualScale * 0.005);
  buffer.noFill();
  
  let segments = 16;
  
  for (let seg = 0; seg < segments; seg++) {
    let startIdx = Math.floor((spectrum.length / segments) * seg);
    let endIdx = Math.floor((spectrum.length / segments) * (seg + 1));
    
    let gestureInfluence = (armStretchSmooth + motionAmountSmooth + Math.abs(handHeightSmooth)) / 3;
    let rotationSpeed = 1 + gestureInfluence * 2;
    let complexityMod = 1 + palmDirection * 0.3;
    
    buffer.beginShape();
    for (let i = startIdx; i < endIdx; i++) {
      let progress = map(i, startIdx, endIdx, 0, 1);
      let intensity = (spectrum[i] + 100) / 100;
      
      let baseAngle = map(seg, 0, segments, 0, TWO_PI * rotationSpeed);
      let flowAngle = baseAngle + progress * PI * complexityMod;
      
      let radius = intensity * visualScale * (100 + gestureInfluence * 50);
      let spiralFactor = progress * gestureInfluence * 0.5;
      
      let x = cos(flowAngle) * (radius + spiralFactor * 30);
      let y = sin(flowAngle) * (radius + spiralFactor * 30);
      
      let harmonicFreq = 3 + Math.floor(gestureInfluence * 4);
      x += cos(flowAngle * harmonicFreq) * intensity * visualScale * (20 + gestureInfluence * 15);
      y += sin(flowAngle * harmonicFreq) * intensity * visualScale * (20 + gestureInfluence * 15);
      
      buffer.vertex(x, y);
    }
    buffer.endShape();
  }
}

function drawOscilloscopePattern(centerX, centerY, scale) {
  if (!audioAnalyzer) return;
  
  push();
  translate(centerX, centerY);
  rotate(bodyRotation);
  
  const spectrum = audioAnalyzer.getValue();
  
  if (visualMode === 0) {
    drawLissajousScale(spectrum, scale);
  } else {
    drawSpectralFlow(spectrum, scale);
  }
  
  pop();
}

function drawLissajousScale(spectrum, scale) {
  stroke(255, 200);
  strokeWeight(2 + scale * 0.02);
  noFill();
  
  beginShape();
  for (let i = 0; i < spectrum.length - 1; i++) {
    let x = (spectrum[i] + 100) / 100 * scale * 400;
    let y = (spectrum[i + 1] + 100) / 100 * scale * 400;
    
    let freqMod = (spectrum[i] + 100) / 100 * scale * 100;
    x += cos(i * 0.05) * freqMod;
    y += sin(i * 0.05) * freqMod;
    
    vertex(x, y);
  }
  endShape();
  
  stroke(255, 150);
  strokeWeight(1 + scale * 0.01);
  beginShape();
  for (let i = 0; i < spectrum.length - 1; i++) {
    let x = -(spectrum[i] + 100) / 100 * scale * 400;
    let y = -(spectrum[i + 1] + 100) / 100 * scale * 400;
    vertex(x, y);
  }
  endShape();
}

function drawSpectralFlow(spectrum, scale) {
  stroke(255, 180);
  strokeWeight(1.5 + scale * 0.01);
  noFill();
  
  let segments = 16;
  
  for (let seg = 0; seg < segments; seg++) {
    let startIdx = Math.floor((spectrum.length / segments) * seg);
    let endIdx = Math.floor((spectrum.length / segments) * (seg + 1));
    
    let gestureInfluence = (armStretchSmooth + motionAmountSmooth + Math.abs(handHeightSmooth)) / 3;
    let rotationSpeed = 1 + gestureInfluence * 2;
    let complexityMod = 1 + palmDirection * 0.3;
    
    beginShape();
    for (let i = startIdx; i < endIdx; i++) {
      let progress = map(i, startIdx, endIdx, 0, 1);
      let intensity = (spectrum[i] + 100) / 100;
      
      let baseAngle = map(seg, 0, segments, 0, TWO_PI * rotationSpeed);
      let flowAngle = baseAngle + progress * PI * complexityMod;
      
      let radius = intensity * scale * (100 + gestureInfluence * 50);
      let spiralFactor = progress * gestureInfluence * 0.5;
      
      let x = cos(flowAngle) * (radius + spiralFactor * 30);
      let y = sin(flowAngle) * (radius + spiralFactor * 30);
      
      let harmonicFreq = 3 + Math.floor(gestureInfluence * 4);
      x += cos(flowAngle * harmonicFreq) * intensity * scale * (20 + gestureInfluence * 15);
      y += sin(flowAngle * harmonicFreq) * intensity * scale * (20 + gestureInfluence * 15);
      
      vertex(x, y);
    }
    endShape();
    
    if (seg < segments - 1) {
      stroke(255, 60);
      strokeWeight(0.5);
      let angle1 = map(seg, 0, segments, 0, TWO_PI);
      let angle2 = map(seg + 1, 0, segments, 0, TWO_PI);
      let r = scale * 50;
      line(cos(angle1) * r, sin(angle1) * r, cos(angle2) * r, sin(angle2) * r);
    }
  }
}

function drawGestureMeters() {
  let meterX = 20;
  let meterY = 100;
  let meterWidth = 240;
  let meterHeight = 15;
  let spacing = 28;
  
  fill(0, 0, 0, 150);
  noStroke();
  rect(meterX - 10, meterY - 10, meterWidth + 20, spacing * 11 + 10); // More space for new meters
  
  // Arm Stretch Meter
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 100, 100);
  rect(meterX, meterY, meterWidth * armStretchSmooth, meterHeight);
  fill(255);
  textSize(11);
  text(`Arm Stretch: ${(armStretchSmooth * 100).toFixed(0)}% → Brightness`, meterX, meterY - 3);
  
  // Motion Amount Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(100, 255, 100);
  rect(meterX, meterY, meterWidth * motionAverage, meterHeight);
  fill(255);
  
  const currentPercVol = map(motionAverage, 0, 0.4, -20, -6);
  text(`Motion: ${(motionAverage * 100).toFixed(0)}% → Perc: ${currentPercVol.toFixed(1)}dB`, meterX, meterY - 3);
  
  // Hand Height Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  let handHeightDisplay = map(Math.abs(handHeightSmooth), 0, 1, 0, 1);
  
  if (handHeightSmooth > 0.4) {
    fill(255, 50, 50);
  } else {
    fill(100, 100, 255);
  }
  rect(meterX, meterY, meterWidth * handHeightDisplay, meterHeight);
  
  stroke(255, 255, 0);
  strokeWeight(2);
  let thresholdX = meterX + (meterWidth * 0.4);
  line(thresholdX, meterY, thresholdX, meterY + meterHeight);
  noStroke();
  
  fill(255);
  const currentHandVolume = map(handHeightSmooth, 0.4, 1.0, 0.3, 1.0);
  text(`Hands: ${handHeightSmooth > 0 ? 'UP' : 'DOWN'} ${handHeightSmooth.toFixed(2)} → Harmonic Synth${handHeightSmooth > 0.4 ? ' COMBO!' : ''}`, meterX, meterY - 3);
  
  // Palm Direction Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 255, 100);
  rect(meterX, meterY, meterWidth * palmDirection, meterHeight);
  fill(255);
  text(`Hand Width: ${(palmDirection * 100).toFixed(0)}% → Filter + Glitch Beat`, meterX, meterY - 3);
  
  // Glitch Beat Volume Meter (BOOSTED)
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 100, 255);
  rect(meterX, meterY, meterWidth * palmDirection, meterHeight);
  fill(255);
  const currentGlitchVol = map(palmDirection, 0, 1, 3, 9);
  text(`Glitch Beat: ${(palmDirection * 100).toFixed(0)}% → Vol: ${currentGlitchVol.toFixed(1)}dB (BOOSTED!)`, meterX, meterY - 3);
  
  // Jersey Club Kick Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  let handHeightForJersey = map(Math.abs(handHeightSmooth), 0, 1, 0, 1);
  if (handHeightSmooth > 0.6) {
    fill(255, 165, 0);
  } else {
    fill(100, 150, 255);
  }
  rect(meterX, meterY, meterWidth * handHeightForJersey, meterHeight);
  
  stroke(255, 165, 0);
  strokeWeight(2);
  let jerseyThresholdX = meterX + (meterWidth * 0.6);
  line(jerseyThresholdX, meterY, jerseyThresholdX, meterY + meterHeight);
  noStroke();
  
  fill(255);
  text(`Hand Height: ${(handHeightSmooth * 100).toFixed(0)}% → Jersey Club${handHeightSmooth > 0.6 ? ' BOUNCE!' : ''}`, meterX, meterY - 3);
  
  // Jump Detection Meter - UPDATED
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  // Show jump threshold line
  if (jumpAmount > jumpThreshold) {
    fill(255, 50, 50); // Red when jumping
  } else {
    fill(100, 255, 100); // Green normally
  }
  rect(meterX, meterY, meterWidth * (jumpAmount / 2), meterHeight);
  
  // Draw threshold line
  stroke(255, 255, 0);
  strokeWeight(2);
  let jumpThresholdX = meterX + (meterWidth * (jumpThreshold / 2));
  line(jumpThresholdX, meterY, jumpThresholdX, meterY + meterHeight);
  noStroke();
  
  fill(255);
  text(`Jump: ${(jumpAmount * 100).toFixed(0)}% → Gabber Breakcore${jumpAmount > jumpThreshold ? ' ACTIVE!' : ''}`, meterX, meterY - 3);
  
  // Gating Effect Display
  meterY += spacing;
  let gateAmount = map(Math.abs(handHeightSmooth), 0, 1, 0, 1);
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 150, 255);
  rect(meterX, meterY, meterWidth * gateAmount, meterHeight);
  fill(255);
  text(`Gating Effect: ${(gateAmount * 100).toFixed(0)}% → Strings/Choir Stutter`, meterX, meterY - 3);
  
  // NEW: Voice Recording Meter with feedback warning
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  if (isRecordingVoice) {
    fill(255, 50, 50);
    let recordProgress = (millis() - recordingStartTime) / maxRecordingTime;
    rect(meterX, meterY, meterWidth * recordProgress, meterHeight);
  } else if (voiceVisualsActive) {
    fill(100, 255, 100);
    rect(meterX, meterY, meterWidth, meterHeight);
  }
  
  fill(255);
  let voiceText = isRecordingVoice ? 'RECORDING...' : voiceVisualsActive ? 'LOOPING' : 'SPACE=record (USE HEADPHONES!)';
  text(`Voice: ${voiceText}`, meterX, meterY - 3);
  
  // NEW: Pop Hook Status
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  if (popHookActive) {
    fill(255, 100, 255);
    rect(meterX, meterY, meterWidth, meterHeight);
  }
  
  fill(255);
  text(`Pop Hook: ${popHookActive ? 'PLAYING' : 'Press V to trigger'}`, meterX, meterY - 3);
  
  // Sample Status
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  let arpeggioLoaded = arpeggioSampler && arpeggioSampler.loaded;
  let stringsLoaded = stringsSampler && stringsSampler.loaded;
  let glitchLoaded = glitchBeat && glitchBeat.loaded;
  let popLoaded = popHookSampler && popHookSampler.loaded;
  
  if (arpeggioLoaded && stringsLoaded && glitchLoaded && popLoaded) {
    fill(50, 255, 50);
  } else if (arpeggioLoaded && stringsLoaded && glitchLoaded) {
    fill(255, 255, 50);
  } else {
    fill(255, 50, 50);
  }
  
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255);
  
  let statusText = "";
  if (arpeggioLoaded && stringsLoaded && glitchLoaded && popLoaded) {
    statusText = "✓ All Enhanced Samples Ready";
  } else if (arpeggioLoaded && stringsLoaded && glitchLoaded) {
    statusText = "⚠️ Core OK, Pop Hook Missing";
  } else {
    statusText = "❌ Key Samples Missing";
  }
  
  text(statusText, meterX, meterY - 3);
}

function draw() {
  background(0);
  
  // Video overlay (darker for better graphics visibility)
  push();
  tint(255, 40);
  if (video) {
    scale(-1, 1);
    image(video, -width, 0, width, height);
  }
  pop();
  
  if (poses.length === 0) {
    fill(255, 100);
    textAlign(CENTER);
    textSize(18);
    text("Move into camera view", width/2, height/2);
    textAlign(LEFT);
    return;
  }
  
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    
    armStretch = calculateArmStretch(pose);
    handHeight = calculateHandHeight(pose);
    palmDirection = calculatePalmDirection(pose);
    motionAmount = calculateMotionAmount(pose);
    motionAmountRaw = motionAmount;
    jumpAmount = calculateJumpAmount(pose);
    
    // NEW: Calculate blob tracking
    calculateBlobTracking(pose);
    
    updateAudioFilters();
    
    // Draw skeleton (higher visibility)
    if (connections && pose.keypoints) {
      push();
      scale(-1, 1);
      stroke(255, 120);
      strokeWeight(1.5);
      
      for (let j = 0; j < connections.length; j++) {
        let pointAIndex = connections[j][0];
        let pointBIndex = connections[j][1];
        let pointA = pose.keypoints[pointAIndex];
        let pointB = pose.keypoints[pointBIndex];
        
        if (pointA && pointB && pointA.confidence > 0.1 && pointB.confidence > 0.1) {
          line(pointA.x, pointA.y, pointB.x, pointB.y);
        }
      }
      pop();
    }
    
    // Draw main oscilloscope pattern + trace buffer
    if (audioInitialized && isPlaying && samplesLoaded) {
      let visualScale = map(armStretchSmooth + motionAmountSmooth, 0, 2, 0.8, 2.5);
      
      // NEW: Faster fading for cleaner oscilloscope lines
      // More aggressive fading to prevent blurred shapes
      let fadeAmount = map(motionAmountSmooth, 0, 0.5, 80, 35); // Faster fading: 80 when still, 35 when moving
      traceBuffer.fill(0, 0, 0, fadeAmount);
      traceBuffer.rect(0, 0, width, height);
      
      if (isBreakcoreActive) {
        visualScale *= 1.5;
        push();
        let mirroredCenterX = width - bodyCenterSmooth.x;
        translate(mirroredCenterX, bodyCenterSmooth.y);
        stroke(255, 0, 0, 100);
        strokeWeight(3);
        noFill();
        let breakRadius = sin(millis() * 0.01) * 50 + 100;
        ellipse(0, 0, breakRadius, breakRadius);
        
        traceBuffer.push();
        traceBuffer.translate(mirroredCenterX, bodyCenterSmooth.y);
        traceBuffer.stroke(255, 0, 0, 100);
        traceBuffer.strokeWeight(3);
        traceBuffer.noFill();
        traceBuffer.ellipse(0, 0, breakRadius, breakRadius);
        traceBuffer.pop();
        pop();
      }
      
      let mirroredCenterX = width - bodyCenterSmooth.x;
      
      // Draw to both main canvas and trace buffer
      drawOscilloscopePattern(mirroredCenterX, bodyCenterSmooth.y, visualScale);
      drawOscilloscopePatternToBuffer(traceBuffer, mirroredCenterX, bodyCenterSmooth.y, visualScale);
      
      // Draw hands + connecting lines
      const leftWrist = pose.keypoints[15];
      const rightWrist = pose.keypoints[16];
      
      let leftHandValid = false, rightHandValid = false;
      let leftHandX = 0, leftHandY = 0, rightHandX = 0, rightHandY = 0;
      
      if (leftWrist && leftWrist.confidence > 0.5) {
        let targetLeftX = width - leftWrist.x;
        leftHandSmooth.x = lerp(leftHandSmooth.x, targetLeftX, 0.1);
        leftHandSmooth.y = lerp(leftHandSmooth.y, leftWrist.y, 0.1);
        
        let handScale = visualScale * 0.4;
        drawSubtleHandPattern(leftHandSmooth.x, leftHandSmooth.y, handScale, false);
        
        leftHandValid = true;
        leftHandX = leftHandSmooth.x;
        leftHandY = leftHandSmooth.y;
      }
      
      if (rightWrist && rightWrist.confidence > 0.5) {
        let targetRightX = width - rightWrist.x;
        rightHandSmooth.x = lerp(rightHandSmooth.x, targetRightX, 0.1);
        rightHandSmooth.y = lerp(rightHandSmooth.y, rightWrist.y, 0.1);
        
        let handScale = visualScale * 0.4;
        drawSubtleHandPattern(rightHandSmooth.x, rightHandSmooth.y, handScale, true);
        
        rightHandValid = true;
        rightHandX = rightHandSmooth.x;
        rightHandY = rightHandSmooth.y;
      }
      
      // Draw connecting lines
      if (leftHandValid || rightHandValid) {
        drawHandConnections(
          leftHandValid ? leftHandX : null, 
          leftHandValid ? leftHandY : null,
          rightHandValid ? rightHandX : null, 
          rightHandValid ? rightHandY : null,
          mirroredCenterX, 
          bodyCenterSmooth.y
        );
      }
      
      // Draw the trace buffer
      tint(255, 180);
      image(traceBuffer, 0, 0);
      noTint();
    }
    
    // NEW: Draw blob tracking visualization
    if (blobTrackingActive) {
      drawBlobTracking();
    }
  }
  
  // NEW: Draw voice visualization
  drawVoiceVisualization();
  
  if (audioInitialized) {
    drawGestureMeters();
  }
  
  // Visual mode info
  fill(255, 150);
  textAlign(RIGHT);
  textSize(12);
  text(`Visual: ${visualModes[visualMode]} (M to change)`, width - 20, height - 20);
  
  textSize(10);
  text(`NEW: Stored voice loops + floating waveforms + glitchy pop effects`, width - 20, height - 40);
  text(`NEW: Refined blob tracking + faster oscilloscope fading`, width - 20, height - 55);
  text(`SPACE=Record voice, V=Glitchy pop hook, B=Toggle blob tracking`, width - 20, height - 70);
  textAlign(LEFT);
}

// NEW: Enhanced window resize handling
function windowResized() {
  let canvasWidth = windowWidth;
  let canvasHeight = windowHeight;
  
  // Maintain 16:9 aspect ratio
  if (canvasWidth / canvasHeight > 16/9) {
    canvasWidth = canvasHeight * (16/9);
  } else {
    canvasHeight = canvasWidth * (9/16);
  }
  
  resizeCanvas(canvasWidth, canvasHeight);
  
  if (traceBuffer) {
    traceBuffer.resizeCanvas(canvasWidth, canvasHeight);
  }
  
  if (video) {
    video.size(canvasWidth, canvasHeight);
  }
  
  // Update voice wave position to stay centered
  if (voiceWavePosition) {
    voiceWavePosition = {x: width / 2, y: height / 2};
    voiceWaveTarget = {x: width / 2, y: height / 2};
  }
}

async function startAppInteraction() {
  const mobileInstructions = document.getElementById('mobile-instructions');
  if (mobileInstructions) {
    mobileInstructions.remove();
  }
  
  if (!audioInitialized) {
    try {
      await initializeAudio();
      
      const checkSamples = setInterval(() => {
        if (samplesLoaded) {
          clearInterval(checkSamples);
          startAmbientMusic();
          console.log("✓ Enhanced music started");
        }
      }, 100);
      
    } catch (error) {
      console.error("Audio initialization failed:", error);
      alert("Failed to initialize enhanced audio system.");
    }
  } else {
    if (isPlaying) {
      stopMusic();
    } else {
      startAmbientMusic();
    }
  }
}

function mousePressed() {
  startAppInteraction();
}

function touchStarted() {
  startAppInteraction();
  return false;
}

function keyPressed() {
  if (key.toLowerCase() === 'm') {
    visualMode = (visualMode + 1) % visualModes.length;
    console.log('Visual mode:', visualModes[visualMode]);
  }
  
  if (key.toLowerCase() === 'b' && audioInitialized && !isBreakcoreActive) {
    startBreakcore();
  }
  
  if (key.toLowerCase() === 'j' && audioInitialized && !jerseyClubActive) {
    console.log("🏀 TESTING JERSEY CLUB PATTERN");
    startJerseyClubKick();
  }
  
  // NEW: Voice recording
  if (key === ' ' && audioInitialized) {
    if (!isRecordingVoice) {
      startVoiceRecording();
    } else {
      stopVoiceRecording();
    }
  }
  
  // NEW: Pop hook trigger
  if (key.toLowerCase() === 'v' && audioInitialized) {
    triggerPopHook();
  }
  
  // NEW: Toggle blob tracking
  if (key.toLowerCase() === 'b') {
    blobTrackingActive = !blobTrackingActive;
    console.log('Blob tracking:', blobTrackingActive ? 'ON' : 'OFF');
  }
  
  // Test functions
  if (key.toLowerCase() === 'a' && audioInitialized) {
    console.log("🎵 TESTING ENHANCED MELODY SYSTEM");
    
    if (arpeggioSampler && arpeggioSampler.loaded) {
      const testMelody = repeatingMelodies[0];
      testMelody.notes.forEach((note, index) => {
        const timing = testMelody.timings[index];
        setTimeout(() => {
          const velocity = 0.4 + Math.random() * 0.1;
          arpeggioSampler.triggerAttackRelease(note, "16n", "+0", velocity);
        }, timing * 125);
      });
      
      if (stringsSampler && stringsSampler.loaded) {
        const testStrings = stringsMelodies[0];
        testStrings.notes.forEach((note, index) => {
          const timing = testStrings.timings[index];
          setTimeout(() => {
            const velocity = 0.5 + Math.random() * 0.1;
            stringsSampler.triggerAttackRelease(note, testStrings.duration, "+0", velocity);
          }, timing * 125);
        });
      }
      
      if (vocalChoirSampler && vocalChoirSampler.loaded) {
        const testChanting = hymnalChanting[0];
        testChanting.notes.forEach((note, index) => {
          const timing = testChanting.timings[index];
          setTimeout(() => {
            const velocity = 0.7 + Math.random() * 0.1;
            vocalChoirSampler.triggerAttackRelease(note, testChanting.duration, "+0", velocity);
          }, timing * 250);
        });
      }
    }
  }
  
  if (key.toLowerCase() === 'h' && audioInitialized) {
    console.log("🔥 TESTING HARMONIC HAND RAISE SYNTH");
    triggerHarmonicHandRaiseSynth();
  }
}

function gotPoses(results) {
  try {
    if (results && results.length > 0) {
      poses = results;
      if (results[0] && results[0].keypoints && !window.debugLogged) {
        console.log('✓ Pose detected!');
        window.debugLogged = true;
      }
    } else {
      poses = [];
    }
  } catch (error) {
    console.error('Error in gotPoses:', error);
    poses = [];
  }
}