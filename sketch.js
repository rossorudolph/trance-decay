let video;
let bodyPose;
let poses = [];
let connections;
let modelLoaded = false;
let poseDetectionStarted = false;

// Audio system - NOW SAMPLE BASED
let audioInitialized = false;
let samplesLoaded = false;

// SAMPLE-BASED INSTRUMENTS
let bassSampler, arpeggioSampler, bellSampler, vocalChoirSampler;
let kickSampler, clapSampler, stringsSampler, handRaiseSynth;
let percussionLoop, sidechainedNoise;
let breakcoreKick; // Gabber kick for breakcore

// Effects
let brightnessFilter, motionFilter, palmFilter, masterReverb, masterDelay, masterDistortion;
let stringsGate, choirGate; // NEW: Gating effects for hand height
let isPlaying = false;

// Breakcore system
let isBreakcoreActive = false;
let breakcoreStartTime = 0;
let breakCoreDuration = 4000;

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

// NEW: Motion averaging for percussion
let motionHistory = [];
let motionAverage = 0;

// Jump detection
let jumpAmount = 0;
let jumpThreshold = 0.6; // INCREASED from 0.3 - less sensitive
let lastJumpTime = 0;

// Audio parameters
let brightnessFreq = 400;
let motionResonance = 1;
let palmFreq = 800;

// Visual system
let audioAnalyzer;
let visualMode = 1;
let visualModes = ['Lissajous Scale', 'Spectral Flow'];
let bodyCenter = {x: 640, y: 480};

// Sample paths (in samples/ folder) - UPDATED NAMES
const samplePaths = {
  bass: "samples/ZEN_SIC_bass_synth_sub_one_shot_vibecity_C.wav",
  arpeggio: "samples/Srm_Crystal_falls2.wav",
  //arpeggio: "samples/Srm_PD_D_Pad2.wav",
  bell: "samples/bell_d4.wav",
  vocalChoir: "samples/epic_choir_f4.wav",
  kick: "samples/FSS_SHDEV1_Kick_Silver.wav",
  clap: "samples/FSS_SHDEV2_Clap_Clean.wav",
  strings: "samples/Srm_lush_strings.wav",
  percussionLoop: "samples/PLX_140_percussion_loop_brain.wav",
  sidechainedNoise: "samples/03_Audiotent_-_UNF_-_Sidechained_Noise_-_127bpm.wav",
  handRaise: "samples/FSS_RKHSOD_150_synth_screech_loop_gatedshortfour.wav",
  breakcoreKick: "samples/FSS_SHDEV1_Hard_Kick_Whiteroom_B.wav"
};

// Chord progression (now using sample pitches)
const chordProgression = [
  ["Bb2", "D3", "F3", "Ab3"],   // Bb minor 7
  ["F2", "Ab2", "C3", "Eb3"],   // F minor 7
  ["Db3", "F3", "Ab3", "C4"],   // Db major 7
  ["Eb2", "G2", "Bb2", "D3"]    // Eb minor 7
];

// Arpeggio patterns (will be played with sample pitching)
const arpeggioPatterns = [
  ["Bb3", "D4", "F4", "Ab4", "Bb4", "Ab4", "F4", "D4"],
  ["F3", "Ab3", "C4", "Eb4", "F4", "Eb4", "C4", "Ab3"],
  ["Db4", "F4", "Ab4", "C5", "F5", "C5", "Ab4", "F4"],
  ["Eb4", "G4", "Bb4", "D5", "Eb5", "D5", "Bb4", "G4"]
];

let currentChordIndex = 0;

function setup() {
  createCanvas(1280, 960);
  
  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    console.log("Mobile device detected");
    showMobileInstructions();
    resizeCanvas(640, 480);
    video = createCapture(VIDEO, videoReady);
    video.size(640, 480);
  // NEW: Test hand raise synth manually
  if (key.toLowerCase() === 'h' && audioInitialized) {
    console.log("🔥 TESTING HAND RAISE SYNTH MANUALLY");
    triggerHandRaiseSynth();
  }
} else {
    video = createCapture(VIDEO, videoReady);
    video.size(1280, 960);
  }
  
  video.hide();
  
  console.log('Creating bodyPose...');
  try {
    bodyPose = ml5.bodyPose('BlazePose', modelReady);
  } catch (error) {
    console.error('Error creating bodyPose:', error);
  }
  
  console.log("SAMPLE-BASED VERSION - DRAMATIC CHANGES");
  console.log("Click to start/stop ambient music with samples");
  console.log("Press 'A' arpeggio natural pitch, 'V' vocal harmonies, 'S' strings, 'H' aggressive synth");
  console.log("PERCUSSION: Now -25dB to 0dB range (MUCH more dramatic!)");
  console.log("VOCALS: Now plays 3 octaves simultaneously for richness");
  console.log("HAND SYNTH: Much more aggressive FM + distortion when hands raised!");
  console.log("Raise hands above 40% threshold to trigger synth");
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

function videoError(err) {
  console.error('❌ Video error:', err);
  if (err && err.message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px;
      font-family: Arial, sans-serif; text-align: center; z-index: 1000;
    `;
    errorDiv.innerHTML = `
      <h3>Camera Access Required</h3>
      <p>Please allow camera access and refresh the page.</p>
      <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">Refresh</button>
    `;
    document.body.appendChild(errorDiv);
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
      <h2>🎵 Trance-Decay</h2>
      <p>Interactive sample-based music</p>
      <p><strong>TAP TO START</strong></p>
      <p style="font-size: 12px; margin-top: 20px;">
        • Allow camera access<br>
        • Turn up volume<br>
        • Move to control the music<br>
        • Now with high-quality samples!
      </p>
    `;
    document.body.appendChild(instructionDiv);
  }
}

async function initializeAudio() {
  if (audioInitialized) return;
  
  console.log("Initializing sample-based audio system...");
  
  // Mobile fixes
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
  
  // Create audio analyzer
  let masterGain = new Tone.Gain(1).toDestination();
  audioAnalyzer = new Tone.Analyser('fft', 512);
  masterGain.connect(audioAnalyzer);
  
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
  
  // NEW: Gating effects for hand height control
  stringsGate = new Tone.Tremolo({
    frequency: 4,     // Base tremolo rate
    depth: 0         // Will be controlled by hand height
  }).connect(palmFilter);
  
  choirGate = new Tone.Tremolo({
    frequency: 6,     // Faster tremolo for choir
    depth: 0         // Will be controlled by hand height  
  }).connect(palmFilter);
  
  // Load samples and create samplers
  await loadSamples();
  
  Tone.getTransport().bpm.value = 125;
  audioInitialized = true;
  console.log("✓ Sample-based audio system ready");
}

async function loadSamples() {
  console.log("Loading samples...");
  
  try {
    // BASS SAMPLER (C root note) - LOUDER
    bassSampler = new Tone.Sampler({
      urls: {
        "C2": samplePaths.bass
      },
      volume: 0, // INCREASED from -3 to 0dB
      attack: 0.1,
      release: 4,
      curve: "exponential"
    }).connect(brightnessFilter);
    
    // ARPEGGIO SAMPLER (C3 root note) - ENHANCED DEBUGGING
    arpeggioSampler = new Tone.Sampler({
      urls: {
        "C3": samplePaths.arpeggio
      },
      volume: -1,
      attack: 0.1,
      release: 1.0,
      baseUrl: "", // Ensure no base URL conflicts
      onload: () => {
        console.log("✓ ARPEGGIO SAMPLE LOADED:");
        console.log("  File path:", samplePaths.arpeggio);
        console.log("  Expected: Soft fluttering 7-second sample");
        console.log("  If it sounds like synth, the file may not be loading correctly");
      },
      onerror: (error) => {
        console.error("❌ ARPEGGIO SAMPLE FAILED:");
        console.error("  Error:", error);
        console.error("  File path:", samplePaths.arpeggio);
        console.error("  Check: 1) File exists 2) Correct name 3) Audio format supported");
      }
    }).connect(brightnessFilter);
    
    // BELL SAMPLER (D4 root note)
    bellSampler = new Tone.Sampler({
      urls: {
        "D4": samplePaths.bell
      },
      volume: -6
    }).connect(masterReverb);
    
    // VOCAL CHOIR SAMPLER (F4 root note) - SUPER LOUD
    vocalChoirSampler = new Tone.Sampler({
      urls: {
        "F4": samplePaths.vocalChoir
      },
      volume: 6, // MASSIVE INCREASE from 0 to +6dB
      attack: 0.5,
      release: 2,
      onload: () => {
        console.log("✓ Vocal choir sample loaded - VERY LOUD now (+6dB)");
      }
    }).connect(choirGate);
    
    // KICK SAMPLER (low volume for now)
    kickSampler = new Tone.Sampler({
      urls: {
        "C1": samplePaths.kick
      },
      volume: -12
    }).connect(masterDistortion);
    
    // CLAP SAMPLER (low volume for now)
    clapSampler = new Tone.Sampler({
      urls: {
        "C3": samplePaths.clap
      },
      volume: -12
    }).connect(masterDistortion);
    
    // LUSH STRINGS SAMPLER (G3 root note) - VERY LOUD
    stringsSampler = new Tone.Sampler({
      urls: {
        "G3": samplePaths.strings
      },
      volume: 3, // INCREASED back to +3dB (very loud)
      attack: 1.5,
      release: 4,
      onload: () => {
        console.log("✓ Strings sample loaded - VERY LOUD (+3dB) for testing");
      }
    }).connect(masterReverb); // BYPASS gating for now
    
    // HAND RAISE SYNTH (thick screech)
    handRaiseSynth = new Tone.Sampler({
      urls: {
        "C3": samplePaths.handRaise
      },
      volume: -3
    }).connect(palmFilter);
    
    // BREAKCORE GABBER KICK - with loaded check
    breakcoreKick = new Tone.Sampler({
      urls: {
        "C1": samplePaths.breakcoreKick
      },
      volume: -3,
      onload: () => {
        console.log("✓ Breakcore kick loaded");
      }
    }).connect(masterDistortion);
    
    // PERCUSSION LOOP (will be triggered manually)
    percussionLoop = new Tone.Player({
      url: samplePaths.percussionLoop,
      loop: true,
      volume: -12, // Start very quiet
      onload: () => {
        console.log("✓ Percussion loop loaded");
      }
    }).connect(motionFilter);
    
    // SIDECHAINED NOISE (127bpm, ~4s) - MANUAL SYNC
    sidechainedNoise = new Tone.Player({
      url: samplePaths.sidechainedNoise,
      loop: true,
      volume: -9,
      onload: () => {
        console.log("✓ Sidechained noise loaded");
        // Manual sync: if the sample is 4 seconds at 127bpm
        // At 125bpm transport, we need to slow it down to maintain musical sync
        // 127bpm = 2.117 beats per second
        // 125bpm = 2.083 beats per second  
        // Ratio = 2.083/2.117 = 0.984
        sidechainedNoise.playbackRate = 0.984;
        console.log("Noise playback rate set to 0.984 for 125bpm sync");
      }
    }).connect(palmFilter);
    
    // Wait for all samples to load
    await Tone.loaded();
    samplesLoaded = true;
    console.log("✓ All samples loaded successfully");
    
  } catch (error) {
    console.error("Error loading samples:", error);
    alert("Error loading audio samples. Please check that sample files are in the 'samples/' folder with correct names.");
  }
}

function startAmbientMusic() {
  if (isPlaying || !samplesLoaded) return;
  isPlaying = true;
  
  console.log("Starting sample-based ambient music...");
  if (window.updateStatus) window.updateStatus("Playing");
  
  // Bass chords (OVERLAPPING for longer sustain)
  Tone.getTransport().scheduleRepeat((time) => {
    const currentChord = chordProgression[currentChordIndex];
    // Play bass root note with overlap for sustained effect
    bassSampler.triggerAttackRelease(currentChord[0], "4m", time, 0.8); // MUCH LONGER - 4 measures
    
    // Add a second trigger halfway through for sustain
    Tone.getTransport().schedule((time2) => {
      bassSampler.triggerAttackRelease(currentChord[0], "2m", time2, 0.4); // Quieter overlap
    }, `+1m`);
    
    currentChordIndex = (currentChordIndex + 1) % chordProgression.length;
  }, "2m");
  
  // Arpeggio patterns (ACTUAL QUICK ARPEGGIOS - multiple notes)
  const quickArpeggioPatterns = [
    ["C3", "Eb3", "G3", "Bb3", "C4", "Bb3", "G3", "Eb3"], // Bb minor arpeggio
    ["F3", "Ab3", "C4", "Eb4", "F4", "Eb4", "C4", "Ab3"], // F minor arpeggio  
    ["Db3", "F3", "Ab3", "C4", "Db4", "C4", "Ab3", "F3"], // Db major arpeggio
    ["Eb3", "G3", "Bb3", "D4", "Eb4", "D4", "Bb3", "G3"]  // Eb minor arpeggio
  ];
  
  let arpeggioNoteIndex = 0;
  let arpeggioPatternIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    const currentPattern = quickArpeggioPatterns[arpeggioPatternIndex];
    const note = currentPattern[arpeggioNoteIndex % currentPattern.length];
    
    if (arpeggioSampler && arpeggioSampler.loaded) {
      // Quick arpeggio notes - shorter duration for rapid feel
      arpeggioSampler.triggerAttackRelease(note, "8n", time, 0.5);
      console.log(`🎵 Quick arpeggio: ${note} (pattern ${arpeggioPatternIndex})`);
    }
    
    arpeggioNoteIndex++;
    if (arpeggioNoteIndex % 8 === 0) { // Every 2 measures (8 eighth notes)
      arpeggioNoteIndex = 0;
      arpeggioPatternIndex = (arpeggioPatternIndex + 1) % quickArpeggioPatterns.length;
    }
  }, "8n"); // 8th notes for quick arpeggio feel
  
  // Subtle kick and clap rhythm (low volume)
  Tone.getTransport().scheduleRepeat((time) => {
    kickSampler.triggerAttackRelease("C1", "8n", time, 0.3);
  }, "1m"); // Every measure
  
  Tone.getTransport().scheduleRepeat((time) => {
    if (Math.random() > 0.7) { // Sparse claps
      clapSampler.triggerAttackRelease("C3", "8n", time, 0.2);
    }
  }, "2n"); // Half notes
  
  // Lush strings (SYNCED WITH BASS TIMING)
  const stringChords = [
    ["G3", "D4", "G4"],    // G major chord
    ["C3", "G3", "C4"],    // C major chord  
    ["D3", "A3", "D4"],    // D major chord
    ["F3", "C4", "F4"]     // F major chord
  ];
  let stringChordIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    const chord = stringChords[stringChordIndex % stringChords.length];
    if (stringsSampler && stringsSampler.loaded) {
      // Play all notes of the chord simultaneously, synced with bass
      chord.forEach((note, index) => {
        stringsSampler.triggerAttackRelease(note, "2m", time + (index * 0.05), 0.6);
      });
      console.log(`🎻 String chord: ${chord.join(', ')} - SYNCED with bass`);
    }
    stringChordIndex++;
  }, "2m"); // SYNCED with bass chord changes (every 2 measures)
  
  // Vocal choir (FULL 3+ SECOND DURATION + LOWER OCTAVES)
  const choirNotes = ["F4", "Ab4", "Bb4", "C5"];
  let choirIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    if (Math.random() > 0.3) { // 70% chance
      const note = choirNotes[choirIndex % choirNotes.length];
      if (vocalChoirSampler && vocalChoirSampler.loaded) {
        // Play original note
        vocalChoirSampler.triggerAttackRelease(note, "4m", time, 0.8);
        
        // Add lower octaves for richness (same sample, pitched down)
        const lowerNote1 = note.slice(0, -1) + (parseInt(note.slice(-1)) - 1); // One octave down
        const lowerNote2 = note.slice(0, -1) + (parseInt(note.slice(-1)) - 2); // Two octaves down
        
        vocalChoirSampler.triggerAttackRelease(lowerNote1, "4m", time + 0.1, 0.6); // Slightly delayed
        vocalChoirSampler.triggerAttackRelease(lowerNote2, "4m", time + 0.2, 0.4); // More delayed, quieter
        
        console.log(`👥 Playing vocal choir: ${note} + ${lowerNote1} + ${lowerNote2} (rich harmonies)`);
      }
      choirIndex++;
    }
  }, "2m"); // Every 2 measures to avoid overlap
  
  // Start percussion loop and sidechained noise - PROPERLY SYNCED
  if (percussionLoop && percussionLoop.loaded) {
    percussionLoop.sync().start(0);
    console.log("✓ Percussion loop started synced");
  }
  
  if (sidechainedNoise && sidechainedNoise.loaded) {
    // Start exactly on measure boundary for perfect sync
    sidechainedNoise.sync().start("0:0:0");
    console.log("✓ Sidechained noise started synced at measure start");
  }
  
  Tone.getTransport().start();
}

// Breakcore function using gabber kick
function startBreakcore() {
  if (isBreakcoreActive || !samplesLoaded || !breakcoreKick || !breakcoreKick.loaded) {
    if (!breakcoreKick || !breakcoreKick.loaded) {
      console.log("Breakcore kick not loaded yet");
    }
    return;
  }
  
  isBreakcoreActive = true;
  breakcoreStartTime = millis();
  
  console.log("🔥 GABBER BREAKCORE ACTIVATED!");
  
  // Rapid gabber kick pattern
  const breakcorePattern = [
    0, 0.125, 0.25, 0.5, 0.625, 0.75, 1.0, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.875,
    2.0, 2.0625, 2.125, 2.1875, 2.25, 2.3125, 2.375, 2.4375, 2.5, 2.5625, 2.625, 2.75, 2.875,
    3.0, 3.125, 3.25, 3.375, 3.4375, 3.5, 3.5625, 3.625, 3.6875, 3.75, 3.8125, 3.875, 3.9375
  ];
  
  breakcorePattern.forEach(beat => {
    Tone.getTransport().schedule((time) => {
      if (breakcoreKick && breakcoreKick.loaded) { // Double check before triggering
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
    
    // PROPERLY stop all players
    if (percussionLoop && percussionLoop.state === 'started') {
      percussionLoop.stop();
      console.log("✓ Percussion loop stopped");
    }
    
    if (sidechainedNoise && sidechainedNoise.state === 'started') {
      sidechainedNoise.stop();
      console.log("✓ Sidechained noise stopped");
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

// Gesture calculation functions (same as before)
function calculateJumpAmount(pose) {
  const leftAnkle = pose.keypoints[27];
  const rightAnkle = pose.keypoints[28];
  const nose = pose.keypoints[0];
  
  if (leftAnkle && rightAnkle && nose &&
      leftAnkle.confidence > 0.5 && rightAnkle.confidence > 0.5 && nose.confidence > 0.5) {
    
    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    const expectedGroundLevel = height * 0.9;
    const jumpHeight = expectedGroundLevel - avgAnkleY;
    
    return constrain(jumpHeight / 200, 0, 2);
  }
  
  return 0;
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
  
  // MORE SELECTIVE: Only track major body points for "whole body" motion
  // Exclude head/face points that move when sitting
  const majorBodyPoints = [11, 12, 23, 24]; // Shoulders and hips only
  
  for (let i of majorBodyPoints) {
    const current = currentPose.keypoints[i];
    const previous = prevPose.keypoints[i];
    
    if (current && previous && current.confidence > 0.7 && previous.confidence > 0.7) { // Higher confidence
      const distance = dist(current.x, current.y, previous.x, previous.y);
      totalMotion += distance;
      validPoints++;
    }
  }
  
  previousPoses.push(currentPose);
  if (previousPoses.length > 8) { // Longer history for stability
    previousPoses.shift();
  }
  
  // MUCH HIGHER threshold - requires significant body movement
  const avgMotion = validPoints > 0 ? totalMotion / validPoints : 0;
  motionAmountRaw = constrain(avgMotion / 50, 0, 1); // INCREASED threshold from 25 to 50
  
  return motionAmountRaw;
}

function updateAudioFilters() {
  if (!audioInitialized || !samplesLoaded) return;
  
  armStretchSmooth = lerp(armStretchSmooth, armStretch, 0.1);
  
  // Motion smoothing with slower decay
  if (motionAmountRaw > motionAmountSmooth) {
    motionAmountSmooth = lerp(motionAmountSmooth, motionAmountRaw, 0.3);
  } else {
    motionAmountSmooth = lerp(motionAmountSmooth, motionAmountRaw, motionDecayRate);
  }
  
  // NEW: Motion averaging over longer period for percussion
  motionHistory.push(motionAmountSmooth);
  if (motionHistory.length > 30) { // Keep 30 frames (~1 second at 30fps)
    motionHistory.shift();
  }
  
  // Calculate average motion over the past second
  motionAverage = motionHistory.reduce((sum, val) => sum + val, 0) / motionHistory.length;
  
  handHeightSmooth = lerp(handHeightSmooth, handHeight, 0.1);
  
  // ARM STRETCH → BRIGHTNESS FILTER
  brightnessFreq = map(armStretchSmooth, 0, 1, 200, 4000);
  brightnessFilter.frequency.rampTo(brightnessFreq, 0.5);
  
  // MOTION AVERAGE → PERCUSSION LOOP VOLUME (LESS DISTORTED)
  const percVol = map(motionAverage, 0, 0.4, -20, -6); // REDUCED max to avoid distortion (-6dB instead of 0dB)
  if (percussionLoop && percussionLoop.loaded) {
    percussionLoop.volume.rampTo(percVol, 0.3);
    console.log(`🥁 Percussion volume: ${percVol.toFixed(1)}dB (motion: ${(motionAverage*100).toFixed(0)}%)`);
  }
  
  // PALM DIRECTION → HIGH-PASS FILTER
  palmFreq = map(palmDirection, 0, 1, 200, 3000);
  palmFilter.frequency.rampTo(palmFreq, 0.8);
  
  // NEW: HAND HEIGHT → EXTREME GATING EFFECT (more stuttery at extremes)
  const gateDepth = map(Math.abs(handHeightSmooth), 0, 1, 0, 0.95); // INCREASED max from 0.9 to 0.95
  const gateRate = map(Math.abs(handHeightSmooth), 0, 1, 1, 20); // INCREASED max from 12 to 20
  
  if (stringsGate) {
    stringsGate.depth.rampTo(gateDepth, 0.2);
    stringsGate.frequency.rampTo(gateRate, 0.2);
  }
  
  if (choirGate) {
    choirGate.depth.rampTo(gateDepth, 0.2);
    choirGate.frequency.rampTo(gateRate * 1.5, 0.2); // Even faster for choir (up to 30Hz)
  }
  
  // HAND HEIGHT → HAND RAISE SYNTH TRIGGER (make sure this still works!)
  if (handHeightSmooth > 0.4 && millis() - lastTwinkleTime > 1000) {
    triggerHandRaiseSynth();
    lastTwinkleTime = millis();
  }
  
  // JUMP → BREAKCORE TRIGGER
  if (jumpAmount > jumpThreshold && millis() - lastJumpTime > 5000 && !isBreakcoreActive) {
    startBreakcore();
    lastJumpTime = millis();
  }
}

function triggerHandRaiseSynth() {
  if (!audioInitialized) return;
  
  if (handRaiseSynth && handRaiseSynth.loaded) {
    // Trigger the thick synth screech sample
    handRaiseSynth.triggerAttackRelease("C3", "1n", "+0", 0.9);
    console.log("🔥 Hand Raise Synth Sample Triggered!");
  } else {
    console.log("⚠️ Hand raise sample not loaded - using AGGRESSIVE fallback synth");
    
    // MUCH MORE AGGRESSIVE fallback - the "cool hard synth" sound
    const aggressiveSynth = new Tone.FMSynth({
      harmonicity: 8,
      modulationIndex: 25, // High modulation for harsh sound
      oscillator: { type: "sawtooth" },
      envelope: { 
        attack: 0.005, 
        decay: 0.1, 
        sustain: 0.8, 
        release: 1.2 
      },
      modulation: { type: "square" },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.05,
        sustain: 0.9,
        release: 0.3
      }
    });
    
    // Add distortion for extra aggression
    const distortion = new Tone.Distortion(0.8);
    const filter = new Tone.Filter({
      frequency: 1500,
      type: "highpass",
      Q: 12
    });
    
    aggressiveSynth.chain(distortion, filter, Tone.Destination);
    
    // Play multiple notes for thickness
    aggressiveSynth.triggerAttackRelease("C5", "4n", "+0", 0.8);
    aggressiveSynth.triggerAttackRelease("G5", "4n", "+0.05", 0.6);
    aggressiveSynth.triggerAttackRelease("C6", "4n", "+0.1", 0.7);
    
    console.log("🔥 AGGRESSIVE HARD SYNTH triggered! (FM + distortion + filter)");
    
    // Clean up after 3 seconds
    setTimeout(() => {
      aggressiveSynth.dispose();
      distortion.dispose();
      filter.dispose();
    }, 3000);
  }
}

// Visual system (same as before)
function drawOscilloscopePattern(centerX, centerY, scale) {
  if (!audioAnalyzer) return;
  
  push();
  translate(centerX, centerY);
  
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
  rect(meterX - 10, meterY - 10, meterWidth + 20, spacing * 7 + 10);
  
  // Arm Stretch Meter
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 100, 100);
  rect(meterX, meterY, meterWidth * armStretchSmooth, meterHeight);
  fill(255);
  textSize(11);
  text(`Arm Stretch: ${(armStretchSmooth * 100).toFixed(0)}% → Brightness Filter`, meterX, meterY - 3);
  
  // Motion Amount Meter - WHOLE BODY MOTION ONLY
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(100, 255, 100);
  rect(meterX, meterY, meterWidth * motionAverage, meterHeight);
  fill(255);
  
  // Calculate and display actual percussion volume
  const currentPercVol = map(motionAverage, 0, 0.4, -20, -6);
  text(`Motion (body): ${(motionAverage * 100).toFixed(0)}% → Perc: ${currentPercVol.toFixed(1)}dB`, meterX, meterY - 3);
  
  // Hand Height Meter (shows trigger threshold)
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  let handHeightDisplay = map(Math.abs(handHeightSmooth), 0, 1, 0, 1);
  
  // Show trigger zone
  if (handHeightSmooth > 0.4) {
    fill(255, 50, 50); // Red when in trigger zone
  } else {
    fill(100, 100, 255);
  }
  rect(meterX, meterY, meterWidth * handHeightDisplay, meterHeight);
  
  // Draw trigger threshold line
  stroke(255, 255, 0);
  strokeWeight(2);
  let thresholdX = meterX + (meterWidth * 0.4); // 40% threshold
  line(thresholdX, meterY, thresholdX, meterY + meterHeight);
  noStroke();
  
  fill(255);
  text(`Hands: ${handHeightSmooth > 0 ? 'UP' : 'DOWN'} ${handHeightSmooth.toFixed(2)} → Synth${handHeightSmooth > 0.4 ? ' TRIGGER!' : ''}`, meterX, meterY - 3);
  
  // Palm Direction Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 255, 100);
  rect(meterX, meterY, meterWidth * palmDirection, meterHeight);
  fill(255);
  text(`Hand Width: ${(palmDirection * 100).toFixed(0)}% → High-Pass Filter`, meterX, meterY - 3);
  
  // Jump Detection Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 50, 50);
  rect(meterX, meterY, meterWidth * (jumpAmount / 2), meterHeight);
  fill(255);
  text(`Jump: ${(jumpAmount * 100).toFixed(0)}% → Gabber Breakcore`, meterX, meterY - 3);
  
  // Gating Effect Display
  meterY += spacing;
  let gateAmount = map(Math.abs(handHeightSmooth), 0, 1, 0, 1);
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 150, 255);
  rect(meterX, meterY, meterWidth * gateAmount, meterHeight);
  fill(255);
  text(`Gating Effect: ${(gateAmount * 100).toFixed(0)}% → Strings/Choir Stutter`, meterX, meterY - 3);
  
  // Sample Status (ENHANCED with specific sample info)
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  
  // Check specific critical samples
  let arpeggioLoaded = arpeggioSampler && arpeggioSampler.loaded;
  let stringsLoaded = stringsSampler && stringsSampler.loaded;
  
  if (arpeggioLoaded && stringsLoaded) {
    fill(50, 255, 50);
  } else if (arpeggioLoaded || stringsLoaded) {
    fill(255, 255, 50); // Yellow for partial loading
  } else {
    fill(255, 50, 50);
  }
  
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255);
  
  let statusText = "";
  if (arpeggioLoaded && stringsLoaded) {
    statusText = "✓ Arpeggio & Strings Loaded";
  } else if (arpeggioLoaded) {
    statusText = "⚠️ Arpeggio OK, Strings Missing";
  } else if (stringsLoaded) {
    statusText = "⚠️ Strings OK, Arpeggio Missing";  
  } else {
    statusText = "❌ Arpeggio & Strings Missing";
  }
  
  text(statusText, meterX, meterY - 3);
}

function draw() {
  background(0);
  
  // MIRRORED video overlay for natural interaction
  push();
  tint(255, 80);
  if (video) {
    // Mirror the video horizontally
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
    
    updateAudioFilters();
    
    // Draw skeleton (also mirrored to match video)
    if (connections && pose.keypoints) {
      push();
      scale(-1, 1); // Mirror skeleton to match video
      stroke(255, 30);
      strokeWeight(0.5);
      
      for (let j = 0; j < connections.length; j++) {
        let pointAIndex = connections[j][0];
        let pointBIndex = connections[j][1];
        let pointA = pose.keypoints[pointAIndex];
        let pointB = pose.keypoints[pointBIndex];
        
        if (pointA && pointB && pointA.confidence > 0.1 && pointB.confidence > 0.1) {
          // Mirror the x coordinates
          line(-pointA.x, pointA.y, -pointB.x, pointB.y);
        }
      }
      pop();
    }
    
    // Draw oscilloscope pattern (mirror the body center too)
    if (audioInitialized && isPlaying && samplesLoaded) {
      let visualScale = map(armStretchSmooth + motionAmountSmooth, 0, 2, 0.8, 2.5);
      
      if (isBreakcoreActive) {
        visualScale *= 1.5;
        push();
        let mirroredCenterX = width - bodyCenter.x; // Mirror the center position
        translate(mirroredCenterX, bodyCenter.y);
        stroke(255, 0, 0, 100);
        strokeWeight(3);
        noFill();
        let breakRadius = sin(millis() * 0.01) * 50 + 100;
        ellipse(0, 0, breakRadius, breakRadius);
        pop();
      }
      
      let mirroredCenterX = width - bodyCenter.x; // Mirror the center position
      drawOscilloscopePattern(mirroredCenterX, bodyCenter.y, visualScale);
    }
  }
  
  if (audioInitialized) {
    drawGestureMeters();
  }
  
  // Visual mode info
  fill(255, 150);
  textAlign(RIGHT);
  textSize(12);
  text(`Visual: ${visualModes[visualMode]} (M to change)`, width - 20, height - 20);
  
  textSize(10);
  text(`Percussion: -25dB to 0dB range (MUCH more dramatic!)`, width - 20, height - 40);
  text(`Vocals: 3 octaves (F4+F3+F2) for rich harmonies`, width - 20, height - 55);
  text(`Hand Synth: Aggressive FM+distortion (raise >40%)`, width - 20, height - 70);
  text(`Yellow line = hand trigger threshold`, width - 20, height - 85);
  textAlign(LEFT);
}

async function startAppInteraction() {
  const mobileInstructions = document.getElementById('mobile-instructions');
  if (mobileInstructions) {
    mobileInstructions.remove();
  }
  
  if (!audioInitialized) {
    try {
      await initializeAudio();
      
      // Wait for samples to load
      const checkSamples = setInterval(() => {
        if (samplesLoaded) {
          clearInterval(checkSamples);
          startAmbientMusic();
          console.log("✓ Sample-based music started");
        }
      }, 100);
      
    } catch (error) {
      console.error("Audio initialization failed:", error);
      alert("Failed to initialize sample-based audio. Please check that sample files are in the 'samples/' folder.");
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
  
  // NEW: Test arpeggio sample manually at NATURAL pitch
  if (key.toLowerCase() === 'a' && audioInitialized) {
    console.log("🎵 TESTING ARPEGGIO SAMPLE AT NATURAL PITCH");
    console.log("Expected: Soft fluttering 7-second sample");
    console.log("Playing at C3 (natural pitch) for FULL duration");
    
    if (arpeggioSampler && arpeggioSampler.loaded) {
      // Play at natural pitch with full duration - no pitch shifting!
      arpeggioSampler.triggerAttackRelease("C3", "8m", "+0", 0.8); // 8 measures = plenty of time
    } else {
      console.log("❌ Arpeggio sampler not loaded!");
    }
  }
  
  // NEW: Test vocal sample with harmonies
  if (key.toLowerCase() === 'v' && audioInitialized) {
    console.log("👥 TESTING VOCAL SAMPLE WITH LOWER OCTAVE HARMONIES");
    if (vocalChoirSampler && vocalChoirSampler.loaded) {
      // Test the harmonic layering
      vocalChoirSampler.triggerAttackRelease("F4", "8m", "+0", 0.8);   // Original
      vocalChoirSampler.triggerAttackRelease("F3", "8m", "+0.1", 0.6); // One octave down
      vocalChoirSampler.triggerAttackRelease("F2", "8m", "+0.2", 0.4); // Two octaves down
      console.log("Playing F4 + F3 + F2 harmonies for rich vocal texture");
    } else {
      console.log("❌ Vocal sampler not loaded!");
    }
  }
  
  // NEW: Test strings sample manually  
  if (key.toLowerCase() === 's' && audioInitialized) {
    console.log("🎻 TESTING STRINGS SAMPLE MANUALLY");
    if (stringsSampler && stringsSampler.loaded) {
      console.log("Playing strings sample at max volume...");
      stringsSampler.triggerAttackRelease("G3", "2m", "+0", 1.0);
    } else {
      console.log("❌ Strings sampler not loaded!");
    }
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