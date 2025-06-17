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

// FIXED: Mic input - NO LIVE FEEDBACK
let micInput;
let micRecorder;
let voiceLoop;
let voiceGrainPlayer;
let voiceEffectsChain;
let isRecordingVoice = false;
let recordingStartTime = 0;
let maxRecordingTime = 6000; // 6 seconds

// Enhanced granular synthesis for New Jeans samples
let popHookSampler;
let popHookActive = false;
let granularDecaySystem;
let decayStartTime = 0;
let decayDuration = 60000; // 60 seconds for full decay cycle

// NEW: Pose trigger detection for New Jeans sample
let newJeansPoseActive = false;
let lastNewJeansTrigger = 0;

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

// Movement tracking - ENHANCED for hips
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

// NEW: Hip motion tracking
let hipMotionAmount = 0;
let hipMotionSmooth = 0;
let previousHipPosition = {x: 0, y: 0};

let motionHistory = [];
let motionAverage = 0;

// Jump detection
let jumpAmount = 0;
let jumpThreshold = 0.55;
let lastJumpTime = 0;
let jumpHistory = [];
let baselineBodyY = 0;

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
let voiceWavePosition = {x: 0, y: 0};
let voiceWaveTarget = {x: 0, y: 0};
let voiceWavePoints = [];

// Blob tracking system
let bodyBoundingBox = {x: 0, y: 0, width: 0, height: 0};
let trackingPoints = [];
let blobTrackingActive = false;

// ENHANCED: Hand tracking for new visuals
let leftHandSmooth = {x: 0, y: 0};
let rightHandSmooth = {x: 0, y: 0};
let handDistance = 0;
let handDistanceSmooth = 0;

// Sample paths
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
  popHook: "samples/newjeans_omg_hook_processed.wav"
};

// Chord progression (Bb minor key)
const chordProgression = [
  ["Bb2", "D3", "F3", "Ab3"],
  ["F2", "Ab2", "C3", "Eb3"],
  ["Db3", "F3", "Ab3", "C4"],
  ["Eb2", "G2", "Bb2", "D3"]
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

// Hymnal vocal chanting patterns
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
  let canvasWidth = windowWidth;
  let canvasHeight = windowHeight;
  
  if (canvasWidth / canvasHeight > 16/9) {
    canvasWidth = canvasHeight * (16/9);
  } else {
    canvasHeight = canvasWidth * (9/16);
  }
  
  createCanvas(canvasWidth, canvasHeight);
  traceBuffer = createGraphics(canvasWidth, canvasHeight);
  
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  console.log("🎥 Setting up video capture...");
  
  if (isMobile) {
    console.log("📱 Mobile device detected");
    showMobileInstructions();
    video = createCapture({
      video: {
        width: 640,
        height: 480,
        facingMode: "user"
      }
    }, videoReady);
  } else {
    console.log("💻 Desktop device detected");
    video = createCapture({
      video: {
        width: 1280,
        height: 960,
        facingMode: "user"
      }
    }, videoReady);
  }
  
  if (video) {
    video.hide();
    console.log("✓ Video capture created");
  }
  
  voiceWavePosition = {x: width / 2, y: height / 2};
  voiceWaveTarget = {x: width / 2, y: height / 2};
  
  console.log("🤖 Creating ML5 bodyPose model...");
  try {
    bodyPose = ml5.bodyPose('BlazePose', modelReady);
    console.log("✓ ML5 bodyPose creation initiated");
  } catch (error) {
    console.error('❌ Error creating bodyPose:', error);
  }
  
  console.log("ENHANCED TRANCE-DECAY INSTALLATION");
  console.log("✓ FIXED: Mic only records on spacebar (no live feedback)");
  console.log("✓ NEW: Hand-to-hand visual connections");
  console.log("✓ NEW: Hip motion tracking with body aura");
  console.log("✓ NEW: Enhanced granular synthesis with burial-style decay");
  console.log("✓ NEW: Color-coded hand height visualization");
}

function modelReady() {
  console.log('🤖 BlazePose model loaded successfully!');
  modelLoaded = true;
  
  try {
    connections = bodyPose.getSkeleton();
    console.log('✓ Skeleton connections loaded:', connections ? connections.length : 'none');
  } catch (error) {
    console.error('⚠️ Error getting skeleton, using fallback:', error);
    connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]
    ];
  }
  
  if (video && video.elt && video.elt.readyState === 4) {
    console.log("✓ Video is ready, starting pose detection");
    startPoseDetection();
  }
}

function videoReady() {
  console.log('🎥 Video ready callback triggered');
  
  if (modelLoaded && !poseDetectionStarted) {
    console.log("✓ Model already loaded, starting pose detection now");
    startPoseDetection();
  }
}

function startPoseDetection() {
  if (poseDetectionStarted || !modelLoaded || !video) return;
  
  console.log('🚀 Starting pose detection...');
  
  try {
    bodyPose.detectStart(video, gotPoses);
    poseDetectionStarted = true;
    console.log('✅ Pose detection started successfully');
  } catch (error) {
    console.error('❌ Error starting pose detection:', error);
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
      <h2>🌀 Trance-Decay</h2>
      <p>Movement + Voice + Decay</p>
      <p><strong>TAP TO START</strong></p>
      <p style="font-size: 12px; margin-top: 20px;">
        • Allow camera + mic access<br>
        • Turn up volume<br>
        • Move hands and body to control sound<br>
        • SPACEBAR to record voice loops<br>
        • Experience Burial-style granular decay
      </p>
    `;
    document.body.appendChild(instructionDiv);
  }
}

async function initializeAudio() {
  if (audioInitialized) return;
  
  console.log("Initializing enhanced audio system...");
  
  try {
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }
    await Tone.start();
    console.log("✓ Tone.js started successfully");
  } catch (error) {
    console.error("Audio initialization error:", error);
    return;
  }
  
  masterGain = new Tone.Gain(1).toDestination();
  dryGain = new Tone.Gain(1).connect(masterGain);
  audioAnalyzer = new Tone.Analyser('fft', 512);
  masterGain.connect(audioAnalyzer);
  
  // FIXED: Initialize microphone WITHOUT live feedback
  try {
    micInput = new Tone.UserMedia();
    await micInput.open();
    console.log("✓ Microphone access granted - NO LIVE FEEDBACK");
    
    // Create effects chain but DON'T connect mic yet
    const voiceGate = new Tone.Gate(-35, 0.05);
    const voiceHighPass = new Tone.Filter(400, "highpass");
    const voiceCompressor = new Tone.Compressor(-30, 2);
    const voiceDelay = new Tone.FeedbackDelay("8n", 0.3);
    const voiceDistortion = new Tone.Distortion(0.2);
    const voiceFilter = new Tone.Filter(1200, "lowpass");
    const voiceBitCrusher = new Tone.BitCrusher(6);
    
    voiceEffectsChain = voiceGate;
    voiceGate.connect(voiceHighPass);
    voiceHighPass.connect(voiceCompressor);
    voiceCompressor.connect(voiceDistortion);
    voiceDistortion.connect(voiceBitCrusher);
    voiceBitCrusher.connect(voiceFilter);
    voiceFilter.connect(voiceDelay);
    voiceDelay.connect(masterGain);
    
    console.log("✓ Voice processing chain ready (mic disconnected until recording)");
    
  } catch (error) {
    console.warn("Microphone not available:", error);
  }
  
  // Create granular decay system for enhanced burial-style processing
  granularDecaySystem = {
    grainPlayer: null,
    reverb: new Tone.Reverb({
      roomSize: 0.9,
      decay: 8,
      wet: 0.6
    }),
    delay: new Tone.FeedbackDelay({
      delayTime: "8n.",
      feedback: 0.7,
      wet: 0.4
    }),
    filter: new Tone.Filter({
      frequency: 2000,
      type: "lowpass",
      rolloff: -24,
      Q: 2
    }),
    bitCrusher: new Tone.BitCrusher(6),
    chorus: new Tone.Chorus(4, 2.5, 0.5)
  };
  
  // Chain the granular effects
  granularDecaySystem.filter.connect(granularDecaySystem.bitCrusher);
  granularDecaySystem.bitCrusher.connect(granularDecaySystem.chorus);
  granularDecaySystem.chorus.connect(granularDecaySystem.delay);
  granularDecaySystem.delay.connect(granularDecaySystem.reverb);
  granularDecaySystem.reverb.connect(masterGain);
  
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
  
  stringsGate = new Tone.Tremolo({
    frequency: 4,
    depth: 0
  }).connect(palmFilter);
  
  choirGate = new Tone.Tremolo({
    frequency: 6,
    depth: 0
  }).connect(palmFilter);
  
  stringsLFO = new Tone.LFO({
    frequency: 0.2,
    type: "sine",
    min: 0.1,
    max: 0.8
  }).start();
  
  await loadSamples();
  
  Tone.getTransport().bpm.value = 125;
  audioInitialized = true;
  console.log("✓ Enhanced audio system ready");
}

async function loadSamples() {
  console.log("Loading samples...");
  
  try {
    bassSampler = new Tone.Sampler({
      urls: {
        "C2": samplePaths.bass
      },
      volume: 0,
      attack: 0.1,
      release: 4,
      curve: "exponential"
    }).connect(brightnessFilter);
    
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
    
    bellSampler = new Tone.Sampler({
      urls: {
        "D4": samplePaths.bell
      },
      volume: -6
    }).connect(masterReverb);
    
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
    
    kickSampler = new Tone.Sampler({
      urls: {
        "C1": samplePaths.kick
      },
      volume: -6,
      onload: () => {
        console.log("✓ Kick loaded");
        kickSampler.connect(dryGain);
      }
    });
    
    clapSampler = new Tone.Sampler({
      urls: {
        "C3": samplePaths.clap
      },
      volume: -12,
      onload: () => {
        console.log("✓ Clap loaded");
        clapSampler.connect(dryGain);
      }
    });
    
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
    
    handRaiseSynth = new Tone.Sampler({
      urls: {
        "C3": samplePaths.handRaise
      },
      volume: -6
    }).connect(palmFilter);
    
    breakcoreKick = new Tone.Sampler({
      urls: {
        "C1": samplePaths.breakcoreKick
      },
      volume: -3,
      onload: () => {
        console.log("✓ Breakcore kick loaded");
      }
    }).connect(masterDistortion);
    
    percussionLoop = new Tone.Player({
      url: samplePaths.percussionLoop,
      loop: true,
      volume: -12,
      onload: () => {
        console.log("✓ Percussion loop loaded");
      }
    }).connect(motionFilter);
    
    sidechainedNoise = new Tone.Player({
      url: samplePaths.sidechainedNoise,
      loop: true,
      volume: -9,
      onload: () => {
        console.log("✓ Sidechained noise loaded");
        sidechainedNoise.playbackRate = 0.984;
      }
    }).connect(palmFilter);
    
    glitchBeat = new Tone.Player({
      url: samplePaths.glitchBeat,
      loop: true,
      volume: 3,
      onload: () => {
        console.log("✓ Glitchy minimal beat loaded");
        glitchBeat.connect(dryGain);
      }
    });
    
    // ENHANCED: Pop hook with granular synthesis
    popHookSampler = new Tone.GrainPlayer({
      url: samplePaths.popHook,
      grainSize: 0.2,
      overlap: 0.5,
      volume: -3,
      onload: () => {
        console.log("✓ Pop hook sample loaded with granular synthesis");
        popHookSampler.connect(granularDecaySystem.filter);
      },
      onerror: (error) => {
        console.error("❌ Pop hook sample failed to load:", error);
      }
    });
    
    await Tone.loaded();
    samplesLoaded = true;
    console.log("✓ All samples loaded successfully");
    
  } catch (error) {
    console.error("Error loading samples:", error);
  }
}

// FIXED: Voice recording - only when spacebar pressed
function startVoiceRecording() {
  if (!micInput || isRecordingVoice) return;
  
  const nextBeat = Tone.getTransport().nextSubdivision("4n");
  
  Tone.getTransport().schedule((time) => {
    isRecordingVoice = true;
    recordingStartTime = millis();
    
    console.log("🎤 Recording voice (NO LIVE FEEDBACK)...");
    
    if (voiceGrainPlayer && voiceGrainPlayer.state === 'started') {
      voiceGrainPlayer.stop();
      voiceGrainPlayer.disconnect();
    }
    
    // ONLY connect mic during recording (not before)
    if (micInput && voiceEffectsChain) {
      micInput.connect(voiceEffectsChain);
      console.log("Mic connected ONLY for recording");
    }
    
    micRecorder = new Tone.Recorder();
    if (micInput) {
      micInput.connect(micRecorder);
      micRecorder.start(time);
    }
    
    const stopTime = time + Tone.Time("2m").toSeconds();
    Tone.getTransport().schedule(() => {
      if (isRecordingVoice) {
        stopVoiceRecording();
      }
    }, stopTime);
    
  }, nextBeat);
}

async function stopVoiceRecording() {
  if (!isRecordingVoice || !micRecorder) return;
  
  isRecordingVoice = false;
  
  try {
    const recording = await micRecorder.stop();
    micRecorder.dispose();
    console.log("✓ Voice recorded, disconnecting mic...");
    
    // IMMEDIATELY disconnect mic to prevent feedback
    if (micInput) {
      micInput.disconnect();
      console.log("✓ Mic disconnected - no more live feedback");
    }
    
    if (voiceGrainPlayer) {
      voiceGrainPlayer.dispose();
    }
    
    const audioBuffer = new Tone.ToneAudioBuffer(recording);
    
    await new Promise((resolve) => {
      audioBuffer.onload = resolve;
    });
    
    voiceGrainPlayer = new Tone.GrainPlayer({
      grainSize: 0.125,
      overlap: 0.25,
      volume: -6
    });
    
    voiceGrainPlayer.buffer = audioBuffer;
    
    const voiceTestFilter = new Tone.Filter(1000, "highpass");
    const voiceTestGain = new Tone.Gain(2);
    
    voiceGrainPlayer.connect(voiceTestFilter);
    voiceTestFilter.connect(voiceTestGain);
    voiceTestGain.connect(masterGain);
    
    const nextBeat = Tone.getTransport().nextSubdivision("4n");
    voiceGrainPlayer.loop = true;
    voiceGrainPlayer.sync().start(nextBeat);
    voiceVisualsActive = true;
    
    console.log("🔄 VOICE LOOP STARTED (mic stays disconnected)");
    
    const stopTime = nextBeat + Tone.Time("8m").toSeconds();
    Tone.getTransport().schedule(() => {
      if (voiceGrainPlayer) {
        voiceGrainPlayer.stop();
        voiceGrainPlayer.dispose();
        voiceTestFilter.dispose();
        voiceTestGain.dispose();
        voiceVisualsActive = false;
        console.log("Voice loop ended");
      }
    }, stopTime);
    
  } catch (error) {
    console.error("Error processing voice recording:", error);
    if (micInput) {
      micInput.disconnect();
    }
  }
}

// ENHANCED: Granular synthesis with burial-style decay
function triggerEnhancedPopHook() {
  if (!popHookSampler || !popHookSampler.loaded || popHookActive) return;
  
  popHookActive = true;
  decayStartTime = millis();
  console.log("🌀 Triggering burial-style granular decay...");
  
  const nextMeasure = Tone.getTransport().nextSubdivision("1m");
  
  Tone.getTransport().schedule((time) => {
    // Start the granular decay cycle
    popHookSampler.loop = true;
    popHookSampler.playbackRate = 1.0; // Start at normal speed
    popHookSampler.sync().start(time);
    
    console.log("🎵 Granular decay cycle started - 60 seconds of evolution");
    
    // Schedule the decay evolution over 60 seconds
    const evolutionInterval = setInterval(() => {
      if (!popHookActive) {
        clearInterval(evolutionInterval);
        return;
      }
      
      const elapsed = millis() - decayStartTime;
      const progress = Math.min(elapsed / decayDuration, 1.0);
      
      // Evolving parameters for burial-style decay
      const grainSize = map(progress, 0, 1, 0.1, 0.8); // Larger grains over time
      const playbackRate = map(progress, 0, 1, 1.0, 0.3); // Slower over time
      const filterFreq = map(progress, 0, 1, 2000, 300); // Darker over time
      const reverbWet = map(progress, 0, 1, 0.3, 0.9); // More reverb
      const delayFeedback = map(progress, 0, 1, 0.4, 0.8); // More delay
      const bitCrushLevel = Math.floor(map(progress, 0, 1, 8, 3)); // More crushed
      
      // Apply the evolving parameters
      if (popHookSampler) {
        popHookSampler.grainSize = grainSize;
        popHookSampler.playbackRate = playbackRate;
      }
      
      if (granularDecaySystem.filter) {
        granularDecaySystem.filter.frequency.rampTo(filterFreq, 2);
      }
      if (granularDecaySystem.reverb) {
        granularDecaySystem.reverb.wet.rampTo(reverbWet, 2);
      }
      if (granularDecaySystem.delay) {
        granularDecaySystem.delay.feedback.rampTo(delayFeedback, 2);
      }
      if (granularDecaySystem.bitCrusher) {
        granularDecaySystem.bitCrusher.bits = bitCrushLevel;
      }
      
      console.log(`🌀 Decay progress: ${(progress * 100).toFixed(1)}% - Grain: ${grainSize.toFixed(2)}, Rate: ${playbackRate.toFixed(2)}, Filter: ${filterFreq.toFixed(0)}Hz`);
      
      if (progress >= 1.0) {
        // Fade to pure atmospheric noise
        setTimeout(() => {
          if (popHookSampler) {
            popHookSampler.stop();
            popHookActive = false;
            console.log("🌀 Decay cycle complete - sample dissolved into noise");
          }
        }, 5000);
        clearInterval(evolutionInterval);
      }
      
    }, 1000); // Update every second
    
  }, nextMeasure);
}

function startJerseyClubKick() {
  if (jerseyClubActive || !kickSampler || !kickSampler.loaded) return;
  
  jerseyClubActive = true;
  jerseyClubStartTime = millis();
  
  console.log("🏀 JERSEY CLUB KICK PATTERN!");
  
  const nextMeasure = Tone.getTransport().nextSubdivision("1m");
  
  Tone.getTransport().schedule((time) => {
    const jerseyPattern = [
      "0:0:0", "0:1:0", "0:2:0", "0:3:0",
      "1:0:0", "1:1:2", "1:2:0", "1:3:2",
      "2:0:0", "2:0:3", "2:2:0", "2:3:0",
      "3:0:0", "3:1:0", "3:2:2", "3:3:0",
      "4:0:0", "4:2:0",
      "5:0:0", "5:1:2", "5:3:0",
      "6:0:0", "6:0:3", "6:2:0",
      "7:0:0", "7:2:0", "7:3:0"
    ];
    
    jerseyPattern.forEach(beatTime => {
      const scheduleTime = time + Tone.Time(beatTime).toSeconds();
      Tone.getTransport().schedule((triggerTime) => {
        if (kickSampler && kickSampler.loaded && jerseyClubActive) {
          kickSampler.triggerAttackRelease("C1", "32n", triggerTime, 0.5);
        }
      }, scheduleTime);
    });
    
  }, nextMeasure);
  
  setTimeout(() => {
    jerseyClubActive = false;
    console.log("Jersey club kick ended");
  }, Tone.Time("8m").toSeconds() * 1000);
}

// NEW: Calculate hip motion for body aura visualization
function calculateHipMotion(pose) {
  const leftHip = pose.keypoints[23];
  const rightHip = pose.keypoints[24];
  
  if (leftHip && rightHip && leftHip.confidence > 0.5 && rightHip.confidence > 0.5) {
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    
    if (previousHipPosition.x === 0 && previousHipPosition.y === 0) {
      previousHipPosition = {x: hipCenterX, y: hipCenterY};
      return 0;
    }
    
    const hipMovement = dist(hipCenterX, hipCenterY, previousHipPosition.x, previousHipPosition.y);
    previousHipPosition = {x: hipCenterX, y: hipCenterY};
    
    return constrain(hipMovement / 30, 0, 1); // Normalize movement
  }
  
  return 0;
}

function calculateJumpAmount(pose) {
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  const leftHip = pose.keypoints[23];
  const rightHip = pose.keypoints[24];
  
  if (leftShoulder && rightShoulder && leftHip && rightHip &&
      leftShoulder.confidence > 0.4 && rightShoulder.confidence > 0.4 &&
      leftHip.confidence > 0.4 && rightHip.confidence > 0.4) {
    
    const bodyCenterY = ((leftShoulder.y + rightShoulder.y) / 2 + (leftHip.y + rightHip.y) / 2) / 2;
    
    if (baselineBodyY === 0) {
      baselineBodyY = bodyCenterY;
      return 0;
    }
    
    baselineBodyY = lerp(baselineBodyY, bodyCenterY, 0.01);
    
    const elevation = baselineBodyY - bodyCenterY;
    const normalizedElevation = elevation / 100;
    
    jumpHistory.push(Math.max(0, normalizedElevation));
    if (jumpHistory.length > 10) {
      jumpHistory.shift();
    }
    
    const avgElevation = jumpHistory.reduce((sum, val) => sum + val, 0) / jumpHistory.length;
    
    return constrain(avgElevation, 0, 1);
  }
  
  return 0;
}

function calculateNewJeansPose(pose) {
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  const nose = pose.keypoints[0];
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  
  if (leftWrist && rightWrist && nose && leftShoulder && rightShoulder &&
      leftWrist.confidence > 0.6 && rightWrist.confidence > 0.6 && 
      nose.confidence > 0.6 && leftShoulder.confidence > 0.6 && rightShoulder.confidence > 0.6) {
    
    const headY = nose.y;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    
    const leftHandNearHead = Math.abs(leftWrist.y - headY) < 80 && Math.abs(leftWrist.x - nose.x) < 100;
    const rightHandNearHead = Math.abs(rightWrist.y - headY) < 80 && Math.abs(rightWrist.x - nose.x) < 100;
    
    let handOnHead = false;
    let handPointingAway = false;
    
    if (leftHandNearHead) {
      handOnHead = true;
      const rightHandDown = rightWrist.y > shoulderCenterY + 100;
      const rightHandAway = Math.abs(rightWrist.x - shoulderCenterX) > 80;
      handPointingAway = rightHandDown && rightHandAway;
    } else if (rightHandNearHead) {
      handOnHead = true;
      const leftHandDown = leftWrist.y > shoulderCenterY + 100;
      const leftHandAway = Math.abs(leftWrist.x - shoulderCenterX) > 80;
      handPointingAway = leftHandDown && leftHandAway;
    }
    
    return handOnHead && handPointingAway;
  }
  
  return false;
}

function calculateBlobTracking(pose) {
  if (!pose.keypoints) return;
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let validPoints = 0;
  
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
  
  if (validPoints > 5) {
    bodyBoundingBox = {
      x: minX - 40,
      y: minY - 40,
      width: (maxX - minX) + 80,
      height: (maxY - minY) + 80
    };
    blobTrackingActive = true;
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
    
    // NEW: Calculate hand distance for hand-to-hand visualization
    handDistance = dist(leftWrist.x, leftWrist.y, rightWrist.x, rightWrist.y);
    handDistanceSmooth = lerp(handDistanceSmooth, handDistance, 0.1);
    
    return constrain(normalizedDistance, 0, 1);
  }
  
  return armStretch;
}

function calculateHandHeight(pose) {
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  const leftHip = pose.keypoints[23];
  const rightHip = pose.keypoints[24];
  
  if (leftWrist && rightWrist && leftShoulder && rightShoulder && leftHip && rightHip &&
      leftWrist.confidence > 0.4 && rightWrist.confidence > 0.4 &&
      leftShoulder.confidence > 0.4 && rightShoulder.confidence > 0.4) {
    
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const bodyHeight = Math.abs((leftHip.y + rightHip.y) / 2 - (leftShoulder.y + rightShoulder.y) / 2);
    
    const referenceBodyHeight = 150;
    const distanceScale = Math.max(0.3, Math.min(3.0, referenceBodyHeight / bodyHeight));
    
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    
    const handHeightRaw = (shoulderY - avgWristY) * distanceScale;
    
    return constrain(handHeightRaw / 200, -1, 2);
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
  
  // NEW: Update hip motion smooth
  hipMotionSmooth = lerp(hipMotionSmooth, hipMotionAmount, 0.2);
  
  motionHistory.push(motionAmountSmooth);
  if (motionHistory.length > 30) {
    motionHistory.shift();
  }
  
  motionAverage = motionHistory.reduce((sum, val) => sum + val, 0) / motionHistory.length;
  
  handHeightSmooth = lerp(handHeightSmooth, handHeight, 0.1);
  
  brightnessFreq = map(armStretchSmooth, 0, 1, 8000, 500);
  brightnessFilter.frequency.rampTo(brightnessFreq, 0.5);
  
  const percVol = map(motionAverage, 0, 0.4, -20, -6);
  if (percussionLoop && percussionLoop.loaded) {
    percussionLoop.volume.rampTo(percVol, 0.3);
  }
  
  const glitchVol = map(palmDirection, 0, 1, 3, 9);
  if (glitchBeat && glitchBeat.loaded) {
    glitchBeat.volume.rampTo(glitchVol, 0.3);
  }
  
  palmFreq = map(palmDirection, 0, 1, 200, 3000);
  palmFilter.frequency.rampTo(palmFreq, 0.8);
  
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
  
  if (handHeightSmooth > 0.4 && millis() - lastTwinkleTime > 1000) {
    triggerHarmonicHandRaiseSynth();
    lastTwinkleTime = millis();
  }
  
  if (handHeightSmooth > 0.6 && millis() - lastJumpTime > 4000 && !jerseyClubActive) {
    startJerseyClubKick();
    lastJumpTime = millis();
  }
  
  if (newJeansPoseActive && millis() - lastNewJeansTrigger > 8000 && !popHookActive) {
    triggerEnhancedPopHook(); // Use enhanced version
    lastNewJeansTrigger = millis();
    console.log("📸 New Jeans pose detected - triggering enhanced granular decay!");
  }
  
  if (jumpAmount > jumpThreshold && millis() - lastJumpTime > 5000 && !isBreakcoreActive) {
    startBreakcore();
    lastJumpTime = millis();
  }
}

function triggerHarmonicHandRaiseSynth() {
  if (!audioInitialized) return;
  
  const handRangeNormalized = map(handHeightSmooth, 0.4, 1.0, 0.3, 1.0);
  const kickVelocity = constrain(handRangeNormalized, 0.3, 1.0);
  
  const nextOffBeat = Tone.getTransport().nextSubdivision("8n");
  
  Tone.getTransport().schedule((time) => {
    if (kickSampler && kickSampler.loaded) {
      kickSampler.triggerAttackRelease("C1", "16n", time, kickVelocity * 0.6);
    }
    
    if (handRaiseSynth && handRaiseSynth.loaded) {
      const currentChord = chordProgression[currentChordIndex % chordProgression.length];
      const harmNote = currentChord[2];
      handRaiseSynth.triggerAttackRelease(harmNote.replace('2', '5').replace('3', '5'), "8n", time, kickVelocity * 0.7);
    }
  }, nextOffBeat);
}

// NEW: Enhanced hand-to-hand connection visualization
function drawHandToHandConnection(leftHandX, leftHandY, rightHandX, rightHandY) {
  if (!audioAnalyzer || !leftHandX || !leftHandY || !rightHandX || !rightHandY) return;
  
  const spectrum = audioAnalyzer.getValue();
  
  // Calculate hand distance for intensity
  const distance = dist(leftHandX, leftHandY, rightHandX, rightHandY);
  const normalizedDistance = map(distance, 50, 300, 1, 0); // Closer = more intense
  const intensity = constrain(normalizedDistance, 0, 1);
  
  // Color gradient based on hand height: white=neutral, red=up, blue=down
  let connectionColor;
  if (handHeightSmooth > 0.1) {
    // Hands raised - red gradient
    const redIntensity = map(handHeightSmooth, 0.1, 1, 0, 255);
    connectionColor = [255, 255 - redIntensity, 255 - redIntensity];
  } else if (handHeightSmooth < -0.1) {
    // Hands lowered - blue gradient
    const blueIntensity = map(Math.abs(handHeightSmooth), 0.1, 1, 0, 255);
    connectionColor = [255 - blueIntensity, 255 - blueIntensity, 255];
  } else {
    // Neutral - white
    connectionColor = [255, 255, 255];
  }
  
  // Number of connection threads based on intensity
  const numThreads = Math.floor(map(intensity, 0, 1, 1, 8));
  
  for (let thread = 0; thread < numThreads; thread++) {
    stroke(connectionColor[0], connectionColor[1], connectionColor[2], 120 * intensity);
    strokeWeight(map(intensity, 0, 1, 0.5, 2.5));
    
    // Create squiggly waveform between hands
    let segments = 20;
    let prevX = leftHandX;
    let prevY = leftHandY;
    
    for (let i = 1; i <= segments; i++) {
      let progress = i / segments;
      let baseX = lerp(leftHandX, rightHandX, progress);
      let baseY = lerp(leftHandY, rightHandY, progress);
      
      // Add waveform distortion based on audio and intensity
      let specIndex = Math.floor(map(progress, 0, 1, 0, spectrum.length - 1));
      let audioIntensity = (spectrum[specIndex] + 100) / 100;
      
      // More intense squiggling when hands are closer
      let waveformAmount = intensity * audioIntensity * 20;
      let waveOffset = sin(progress * PI * 4 + millis() * 0.01 + thread * 0.5) * waveformAmount;
      
      // Perpendicular offset for thread separation
      let angle = atan2(rightHandY - leftHandY, rightHandX - leftHandX) + PI/2;
      let threadOffset = thread * 8 - (numThreads * 4);
      
      let x = baseX + cos(angle) * threadOffset + sin(progress * PI * 6) * waveOffset;
      let y = baseY + sin(angle) * threadOffset + cos(progress * PI * 6) * waveOffset;
      
      line(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }
  }
}

// NEW: Hip motion body aura visualization
function drawHipMotionAura(centerX, centerY) {
  if (!audioAnalyzer || hipMotionSmooth < 0.1) return;
  
  const spectrum = audioAnalyzer.getValue();
  
  push();
  translate(centerX, centerY);
  
  // Create subtle parentheses/aura around body that intensifies with hip motion
  const auraIntensity = hipMotionSmooth;
  const auraSize = map(auraIntensity, 0, 1, 100, 250);
  
  stroke(255, 150, 100, 100 * auraIntensity); // Warm orange glow
  strokeWeight(1 + auraIntensity * 2);
  noFill();
  
  // Left parenthesis
  beginShape();
  for (let angle = PI * 0.2; angle < PI * 1.8; angle += 0.1) {
    let r = auraSize;
    
    // Add audio-reactive distortion
    let specIndex = Math.floor(map(angle, 0, TWO_PI, 0, spectrum.length - 1));
    let audioDistortion = (spectrum[specIndex] + 100) / 100 * auraIntensity * 15;
    
    r += sin(angle * 3 + millis() * 0.005) * audioDistortion;
    
    let x = cos(angle) * r - auraSize * 0.3; // Offset for parenthesis effect
    let y = sin(angle) * r;
    
    vertex(x, y);
  }
  endShape();
  
  // Right parenthesis
  beginShape();
  for (let angle = -PI * 0.8; angle < PI * 0.8; angle += 0.1) {
    let r = auraSize;
    
    let specIndex = Math.floor(map(angle + PI, 0, TWO_PI, 0, spectrum.length - 1));
    let audioDistortion = (spectrum[specIndex] + 100) / 100 * auraIntensity * 15;
    
    r += sin(angle * 3 + millis() * 0.005 + PI) * audioDistortion;
    
    let x = cos(angle) * r + auraSize * 0.3; // Offset for parenthesis effect
    let y = sin(angle) * r;
    
    vertex(x, y);
  }
  endShape();
  
  // Inner subtle oscilloscope lines
  stroke(255, 100, 150, 80 * auraIntensity);
  strokeWeight(0.8);
  
  for (let ring = 0; ring < 3; ring++) {
    beginShape();
    for (let angle = 0; angle < TWO_PI; angle += 0.2) {
      let r = auraSize * (0.4 + ring * 0.2);
      
      let specIndex = Math.floor(map(angle, 0, TWO_PI, 0, spectrum.length - 1));
      let audioWave = (spectrum[specIndex] + 100) / 100 * auraIntensity * 8;
      
      r += sin(angle * 5 + millis() * 0.008 + ring * PI) * audioWave;
      
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      
      vertex(x, y);
    }
    endShape(CLOSE);
  }
  
  pop();
}

function drawVoiceVisualization() {
  if (!voiceVisualsActive) return;
  
  push();
  
  if (frameCount % 120 === 0) {
    voiceWaveTarget.x = random(width * 0.2, width * 0.8);
    voiceWaveTarget.y = random(height * 0.2, height * 0.8);
  }
  
  voiceWavePosition.x = lerp(voiceWavePosition.x, voiceWaveTarget.x, 0.02);
  voiceWavePosition.y = lerp(voiceWavePosition.y, voiceWaveTarget.y, 0.02);
  
  if (voiceWavePoints.length === 0) {
    for (let i = 0; i < 40; i++) {
      voiceWavePoints.push({x: 0, y: 0});
    }
  }
  
  for (let i = 0; i < voiceWavePoints.length; i++) {
    let angle = (i / voiceWavePoints.length) * TWO_PI * 2;
    let baseRadius = 60;
    
    let voiceModulation = isRecordingVoice ? 20 : 10;
    let timeModulation = sin(millis() * 0.01 + i * 0.3) * voiceModulation;
    let radius = baseRadius + timeModulation;
    
    voiceWavePoints[i].x = voiceWavePosition.x + cos(angle) * radius;
    voiceWavePoints[i].y = voiceWavePosition.y + sin(angle) * radius;
  }
  
  stroke(255, 100, 255, 150);
  strokeWeight(1.5);
  noFill();
  
  beginShape();
  for (let i = 0; i < voiceWavePoints.length; i++) {
    let point = voiceWavePoints[i];
    
    let jitterX = random(-2, 2);
    let jitterY = random(-2, 2);
    
    vertex(point.x + jitterX, point.y + jitterY);
  }
  endShape(CLOSE);
  
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
  
  textAlign(LEFT);
  pop();
}

function drawBlobTracking() {
  if (!blobTrackingActive) return;
  
  push();
  
  let mirroredBox = {
    x: width - (bodyBoundingBox.x + bodyBoundingBox.width),
    y: bodyBoundingBox.y,
    width: bodyBoundingBox.width,
    height: bodyBoundingBox.height
  };
  
  stroke(120, 120, 120, 160);
  strokeWeight(0.8);
  noFill();
  
  let glitchOffset = sin(millis() * 0.02) * 1.5;
  rect(mirroredBox.x + glitchOffset, mirroredBox.y, mirroredBox.width, mirroredBox.height);
  
  strokeWeight(1);
  let cornerSize = 12;
  
  // Corner brackets
  line(mirroredBox.x, mirroredBox.y, mirroredBox.x + cornerSize, mirroredBox.y);
  line(mirroredBox.x, mirroredBox.y, mirroredBox.x, mirroredBox.y + cornerSize);
  
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y, mirroredBox.x + mirroredBox.width - cornerSize, mirroredBox.y);
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y, mirroredBox.x + mirroredBox.width, mirroredBox.y + cornerSize);
  
  line(mirroredBox.x, mirroredBox.y + mirroredBox.height, mirroredBox.x + cornerSize, mirroredBox.y + mirroredBox.height);
  line(mirroredBox.x, mirroredBox.y + mirroredBox.height, mirroredBox.x, mirroredBox.y + mirroredBox.height - cornerSize);
  
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height, mirroredBox.x + mirroredBox.width - cornerSize, mirroredBox.y + mirroredBox.height);
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height, mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height - cornerSize);
  
  stroke(120, 120, 120, 120);
  strokeWeight(0.6);
  let boxCenterX = mirroredBox.x + mirroredBox.width / 2;
  let boxCenterY = mirroredBox.y + mirroredBox.height / 2;
  
  let calloutEndX = boxCenterX + 60;
  let calloutEndY = boxCenterY - 40;
  
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y, calloutEndX, calloutEndY);
  
  fill(120, 120, 120, 180);
  noStroke();
  textAlign(LEFT);
  textSize(9);
  text(`TRACKING`, calloutEndX + 5, calloutEndY - 5);
  text(`${mirroredBox.width.toFixed(0)}x${mirroredBox.height.toFixed(0)}`, calloutEndX + 5, calloutEndY + 8);
  
  textAlign(LEFT);
  
  pop();
}

function drawSubtleHandPattern(centerX, centerY, visualScale, reflect = false, colorOverride = null) {
  if (!audioAnalyzer) return;
  
  push();
  translate(centerX, centerY);
  rotate(bodyRotation);
  if (reflect) scale(-1, 1);
  
  const spectrum = audioAnalyzer.getValue();
  
  let handColor = colorOverride || (newJeansPoseActive ? [255, 100, 255] : [255, 255, 255]);
  
  stroke(handColor[0], handColor[1], handColor[2], 120);
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
  
  stroke(handColor[0], handColor[1], handColor[2], 80);
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
  strokeWeight(0.8 + scale * 0.005);
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
  strokeWeight(0.4 + scale * 0.003);
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
  strokeWeight(0.8 + scale * 0.003);
  noFill();
  
  let segments = 16;
  
  for (let seg = 0; seg < segments; seg++) {
    let startIdx = Math.floor((spectrum.length / segments) * seg);
    let endIdx = Math.floor((spectrum.length / segments) * (seg + 1));
    
    let gestureInfluence = (armStretchSmooth + motionAmountSmooth + Math.abs(handHeightSmooth)) / 3;
    let rotationSpeed = 1 + gestureInfluence * 2;
    let complexityMod = 1 + palmDirection * 0.3;
    
    stroke(255, 180);
    strokeWeight(0.8 + scale * 0.003);
    
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
      stroke(255, 40);
      strokeWeight(0.2);
      let angle1 = map(seg, 0, segments, 0, TWO_PI);
      let angle2 = map(seg + 1, 0, segments, 0, TWO_PI);
      let r = scale * 30;
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
  rect(meterX - 10, meterY - 10, meterWidth + 20, spacing * 13 + 10);
  
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
  
  // NEW: Hip Motion Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 150, 100);
  rect(meterX, meterY, meterWidth * hipMotionSmooth, meterHeight);
  fill(255);
  text(`Hip Motion: ${(hipMotionSmooth * 100).toFixed(0)}% → Body Aura`, meterX, meterY - 3);
  
  // Hand Height Meter with color coding
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
  text(`Hands: ${handHeightSmooth > 0 ? 'UP (RED)' : 'DOWN (BLUE)'} ${handHeightSmooth.toFixed(2)} → Color + Effects`, meterX, meterY - 3);
  
  // NEW: Hand Distance Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  let handDistanceNorm = map(handDistanceSmooth, 50, 300, 1, 0);
  fill(255, 255, 100);
  rect(meterX, meterY, meterWidth * handDistanceNorm, meterHeight);
  fill(255);
  text(`Hand Distance: ${handDistanceSmooth.toFixed(0)}px → Connection Intensity`, meterX, meterY - 3);
  
  // Palm Direction Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 255, 100);
  rect(meterX, meterY, meterWidth * palmDirection, meterHeight);
  fill(255);
  text(`Hand Width: ${(palmDirection * 100).toFixed(0)}% → Filter + Glitch Beat`, meterX, meterY - 3);
  
  // Jump Detection Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  if (jumpAmount > jumpThreshold) {
    fill(255, 50, 50);
  } else {
    fill(100, 255, 100);
  }
  rect(meterX, meterY, meterWidth * jumpAmount, meterHeight);
  
  stroke(255, 255, 0);
  strokeWeight(2);
  let jumpThresholdX = meterX + (meterWidth * jumpThreshold);
  line(jumpThresholdX, meterY, jumpThresholdX, meterY + meterHeight);
  noStroke();
  
  fill(255);
  text(`Jump: ${(jumpAmount * 100).toFixed(0)}% → Gabber Breakcore${jumpAmount > jumpThreshold ? ' ACTIVE!' : ''}`, meterX, meterY - 3);
  
  // Voice Recording Meter - FIXED
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
  let voiceText = isRecordingVoice ? 'RECORDING (NO FEEDBACK)...' : voiceVisualsActive ? 'LOOPING' : 'SPACE=Record (FIXED - no feedback!)';
  text(`Voice: ${voiceText}`, meterX, meterY - 3);
  
  // New Jeans Pose Detection Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  if (newJeansPoseActive) {
    fill(255, 100, 255);
    rect(meterX, meterY, meterWidth, meterHeight);
  }
  
  fill(255);
  text(`New Jeans Pose: ${newJeansPoseActive ? 'DETECTED - Granular decay!' : 'Hand on head + point away'}`, meterX, meterY - 3);
  
  // Enhanced Pop Hook Status
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  if (popHookActive) {
    fill(255, 100, 255);
    let decayProgress = popHookActive && decayStartTime > 0 ? (millis() - decayStartTime) / decayDuration : 0;
    rect(meterX, meterY, meterWidth * decayProgress, meterHeight);
  }
  
  fill(255);
  let hookText = popHookActive ? `DECAYING ${((millis() - decayStartTime) / 1000).toFixed(0)}s/60s` : 'Press V or use pose';
  text(`Granular Decay: ${hookText}`, meterX, meterY - 3);
  
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
    statusText = "⚠️ Core OK, Granular Hook Missing";
  } else {
    statusText = "❌ Key Samples Missing";
  }
  
  text(statusText, meterX, meterY - 3);
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
          vocalChoirSampler.triggerAttackRelease(note, "4m", scheduleTime, velocity);
        }
      }, `+${chantTime * 1.5}`);
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

function windowResized() {
  let canvasWidth = windowWidth;
  let canvasHeight = windowHeight;
  
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
  
  // FIXED: Voice recording ONLY on spacebar
  if (key === ' ' && audioInitialized) {
    if (!isRecordingVoice) {
      startVoiceRecording();
    } else {
      stopVoiceRecording();
    }
  }
  
  // Enhanced granular pop hook trigger
  if (key.toLowerCase() === 'v' && audioInitialized) {
    triggerEnhancedPopHook();
  }
  
  // Toggle blob tracking
  if (key.toLowerCase() === 'g') {
    blobTrackingActive = !blobTrackingActive;
    console.log('Blob tracking:', blobTrackingActive ? 'ON' : 'OFF');
  }
  
  // Test functions
  if (key.toLowerCase() === 't' && audioInitialized) {
    console.log("🔔 TESTING AUDIO SYSTEM");
    console.log("Playing test tone to verify audio output works...");
    
    const testOsc = new Tone.Oscillator(880, "sine");
    testOsc.connect(masterGain);
    testOsc.start();
    setTimeout(() => {
      testOsc.stop();
      testOsc.dispose();
      console.log("✓ Test tone finished - if you heard it, audio output works");
    }, 1000);
  }
  
  if (key.toLowerCase() === 'h' && audioInitialized) {
    console.log("🔥 TESTING HARMONIC HAND RAISE SYNTH");
    triggerHarmonicHandRaiseSynth();
  }
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
    text("Move into camera view", width/2, height/2 - 60);
    
    // Show debugging information
    textSize(12);
    fill(255, 150);
    text("🔍 Debugging Info:", width/2, height/2 - 20);
    
    // Check video status
    if (!video) {
      fill(255, 100, 100);
      text("❌ Video not initialized", width/2, height/2);
    } else if (!video.elt) {
      fill(255, 100, 100);
      text("❌ Video element missing", width/2, height/2);
    } else if (video.elt.readyState < 4) {
      fill(255, 200, 100);
      text(`⏳ Video loading... (state: ${video.elt.readyState}/4)`, width/2, height/2);
    } else if (!modelLoaded) {
      fill(255, 200, 100);
      text("⏳ AI model loading...", width/2, height/2);
    } else if (!poseDetectionStarted) {
      fill(255, 200, 100);
      text("⏳ Starting pose detection...", width/2, height/2);
    } else {
      fill(255, 200, 100);
      text("👤 Please move into camera view", width/2, height/2);
      text("Make sure you're well-lit and facing the camera", width/2, height/2 + 20);
    }
    
    // Show system status
    textSize(10);
    fill(255, 100);
    text(`Model: ${modelLoaded ? '✓' : '❌'} | Video: ${video && video.elt && video.elt.readyState === 4 ? '✓' : '❌'} | Detection: ${poseDetectionStarted ? '✓' : '❌'}`, width/2, height/2 + 50);
    
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
    
    // NEW: Calculate hip motion for body aura
    hipMotionAmount = calculateHipMotion(pose);
    
    // NEW: Calculate New Jeans pose trigger
    newJeansPoseActive = calculateNewJeansPose(pose);
    
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
      
      // Enhanced fading for crisp oscilloscope lines
      let fadeAmount = map(motionAmountSmooth, 0, 0.5, 120, 60);
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
      
      // NEW: Draw hip motion body aura
      if (hipMotionSmooth > 0.1) {
        drawHipMotionAura(mirroredCenterX, bodyCenterSmooth.y);
      }
      
      // Draw hands + NEW hand-to-hand connections
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
      
      // NEW: Draw hand-to-hand connections instead of hand-to-body
      if (leftHandValid && rightHandValid) {
        drawHandToHandConnection(leftHandX, leftHandY, rightHandX, rightHandY);
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
  text(`TRANCE-DECAY: Burial-style granular synthesis + enhanced hand tracking`, width - 20, height - 40);
  text(`FIXED: No mic feedback + Hand-to-hand visuals + Hip motion aura`, width - 20, height - 55);
  text(`SPACE=Voice (no feedback), V=Granular decay, Try New Jeans pose!`, width - 20, height - 70);
  textAlign(LEFT);
}

function gotPoses(results) {
  try {
    if (results && results.length > 0) {
      poses = results;
      
      // Log first successful detection
      if (results[0] && results[0].keypoints && !window.debugLogged) {
        console.log('🎯 FIRST POSE DETECTED!');
        console.log('Keypoints found:', results[0].keypoints.length);
        console.log('Sample keypoint confidences:', {
          nose: results[0].keypoints[0] ? results[0].keypoints[0].confidence : 'missing',
          leftShoulder: results[0].keypoints[11] ? results[0].keypoints[11].confidence : 'missing',
          rightShoulder: results[0].keypoints[12] ? results[0].keypoints[12].confidence : 'missing'
        });
        window.debugLogged = true;
        
        // Remove any error messages
        const existingErrors = document.querySelectorAll('[id*="error"], [class*="error"]');
        existingErrors.forEach(el => el.remove());
      }
      
      // Periodic status logging
      if (frameCount % 300 === 0) { // Every 10 seconds at 30fps
        console.log(`📊 Pose detection status: ${results.length} poses detected, frame ${frameCount}`);
      }
      
    } else {
      poses = [];
      
      // Log if we suddenly stop detecting poses
      if (window.debugLogged && frameCount % 60 === 0) {
        console.log('⚠️ No poses detected in current frame');
      }
    }
  } catch (error) {
    console.error('❌ Error in gotPoses:', error);
    poses = [];
  }
}