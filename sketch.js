let video;
let bodyPose;
let poses = [];
let connections;
let modelLoaded = false;
let poseDetectionStarted = false;

// Audio system
let audioInitialized = false;
let ambientPad, bassLine, leadSynth, arpeggioSynth, counterMelody, twinkleSound, vocalChant;
let vocalSampler; // NEW: For vocal sample
let brightnessFilter, motionFilter, palmFilter, masterReverb, masterDelay, masterDistortion, bitCrusher;
// Motion-controlled hihat rhythm
let motionHihat;
let isPlaying = false;

// NEW: Breakcore system
let breakcoreKick, breakcoreSnare, breakcoreHihat;
let isBreakcoreActive = false;
let breakcoreStartTime = 0;
let breakCoreDuration = 4000; // 4 seconds

// Movement tracking with improved decay
let previousPoses = [];
let armStretch = 0;
let motionAmount = 0;
let motionAmountRaw = 0; // New: raw motion before smoothing
let armStretchSmooth = 0;
let motionAmountSmooth = 0;
let motionDecayRate = 0.02; // New: slower decay rate
let handHeight = 0;
let handHeightSmooth = 0;
let palmDirection = 0;
let lastTwinkleTime = 0;

// NEW: Jump detection
let jumpAmount = 0;
let jumpThreshold = 0.3; // LOWERED from 0.8
let lastJumpTime = 0;

// Audio parameters
let brightnessFreq = 400;
let motionResonance = 1;
let palmFreq = 800;

// Visual system
let audioAnalyzer;
let visualMode = 1; // Start with Spectral Flow
let visualModes = ['Lissajous Scale', 'Spectral Flow'];
let bodyCenter = {x: 640, y: 480};

// IMPROVED: More structured chord progression
const chordProgression = [
  ["Bb2", "D3", "F3", "Ab3"],   // Bb minor 7
  ["F2", "Ab2", "C3", "Eb3"],   // F minor 7
  ["Db3", "F3", "Ab3", "C4"],   // Db major 7
  ["Eb2", "G2", "Bb2", "D3"]    // Eb minor 7
];

const bassNotes = ["Bb1", "F1", "Db1", "Eb1"];
// NEW: Add octave higher for less muddy bass
const bassNotesHigh = ["Bb2", "F2", "Db2", "Eb2"];
let currentChordIndex = 0;

// IMPROVED: Much more structured arpeggio patterns - clear melodies that repeat
const arpeggioPatterns = [
  // Bb minor 7 - ascending then descending melody
  ["Bb3", "D4", "F4", "Ab4", "Bb4", "Ab4", "F4", "D4", "Bb3", "D4", "F4", "Ab4", "Bb4", "Ab4", "F4", "D4"],
  // F minor 7 - wave pattern
  ["F3", "Ab3", "C4", "Eb4", "F4", "Eb4", "C4", "Ab3", "F3", "Ab3", "C4", "Eb4", "F4", "Eb4", "C4", "Ab3"],
  // Db major 7 - arching melody
  ["Db4", "F4", "Ab4", "C5", "F5", "C5", "Ab4", "F4", "Db4", "F4", "Ab4", "C5", "F5", "C5", "Ab4", "F4"],
  // Eb minor 7 - cascading pattern
  ["Eb4", "G4", "Bb4", "D5", "Eb5", "D5", "Bb4", "G4", "Eb4", "G4", "Bb4", "D5", "Eb5", "D5", "Bb4", "G4"]
];

// NEW: Percussive stab notes for motion-controlled rhythm
const percussiveStabNotes = [
  ["Bb3", "D4", "F4", "Ab4"], // Bb minor chord stabs
  ["F3", "Ab3", "C4", "Eb4"], // F minor chord stabs  
  ["Db4", "F4", "Ab4", "C5"], // Db major chord stabs
  ["Eb3", "G3", "Bb3", "D4"]  // Eb minor chord stabs
];

function setup() {
  createCanvas(1280, 960);
  
  console.log('Setting up video...');
  video = createCapture(VIDEO, videoReady);
  video.size(1280, 960);
  video.hide();
  
  console.log('Creating bodyPose...');
  try {
    bodyPose = ml5.bodyPose('BlazePose', modelReady);
  } catch (error) {
    console.error('Error creating bodyPose:', error);
  }
  
  console.log("Click to start/stop ambient techno music");
  console.log("Stretch arms = brighter sound | Move = percussive stabs | Raise hands = vocal chant | Small jump = breakcore | Wide hands = hihat");
  console.log("To add vocal sample: Uncomment vocalSampler code and add vocal file path");
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

async function initializeAudio() {
  if (audioInitialized) return;
  
  await Tone.start();
  console.log("Initializing enhanced IDM audio system...");
  
  let masterGain = new Tone.Gain(1).toDestination();
  audioAnalyzer = new Tone.Analyser('fft', 512);
  masterGain.connect(audioAnalyzer);
  
  // Master effects chain
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
  
  // Ambient pad
  ambientPad = new Tone.PolySynth({
    oscillator: {
      type: "sawtooth",
      spread: 40
    },
    envelope: {
      attack: 3.0,
      decay: 0.1,
      sustain: 0.8,
      release: 4.0
    }
  }).connect(palmFilter);
  
  // IMPROVED: Warmer, punchier bass
  bassLine = new Tone.MonoSynth({
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.9,
      release: 0.3  // SHORTER release for half duration
    },
    filter: {
      Q: 4,
      frequency: 150,
      type: "lowpass"
    }
  }).connect(brightnessFilter);
  
  // Lead synth
  leadSynth = new Tone.Synth({
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 0.1,
      decay: 0.3,
      sustain: 0.6,
      release: 1.0
    }
  }).connect(palmFilter);
  
  // Main arpeggio synth
  arpeggioSynth = new Tone.Synth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.4
    }
  }).connect(motionFilter);
  
  // COMPLETELY RETHOUGHT: Motion-controlled percussive stabs instead of melody
  counterMelody = new Tone.FMSynth({
    harmonicity: 3,
    modulationIndex: 10,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.1,
      release: 0.1
    },
    modulation: {
      type: "square"
    },
    modulationEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0,
      release: 0.1
    }
  }).connect(palmFilter);
  
  // NEW: Cleaner motion-controlled hihat
  motionHihat = new Tone.Synth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.001,
      decay: 0.05,
      sustain: 0,
      release: 0.05
    },
    filter: {
      Q: 20,
      frequency: 8000,
      type: "highpass"
    }
  }).connect(motionFilter);
  
  // RETHOUGHT: Vocal "ahhh" chant sound that complements the music
  twinkleSound = new Tone.Synth({
    oscillator: {
      type: "sawtooth"
    },
    envelope: {
      attack: 0.3,    // Slow attack for vocal quality
      decay: 0.8,     
      sustain: 0.6,   
      release: 1.5    // Long release for "ahhh" trail
    },
    filter: {
      Q: 4,
      frequency: 600, // Vocal formant frequency
      type: "bandpass"
    }
  }).connect(masterReverb);
  
  // NEW: Vocal sampler (you can load a vocal sample file here)
  // To use: place a vocal sample file in your project and uncomment below
  /*
  vocalSampler = new Tone.Sampler({
    urls: {
      "C4": "path/to/your/vocal-sample.wav" // Replace with your vocal sample path
    },
    volume: -6
  }).connect(masterReverb);
  */
  
  // Vocal chant
  vocalChant = new Tone.Synth({
    oscillator: {
      type: "sawtooth"
    },
    envelope: {
      attack: 1.0,
      decay: 0.1,
      sustain: 0.9,
      release: 2.0
    },
    filter: {
      Q: 2,
      frequency: 800,
      type: "bandpass"
    }
  }).connect(masterReverb);
  
  // NEW: Breakcore drum sounds
  breakcoreKick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 10,
    oscillator: {type: "sine"},
    envelope: {attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4}
  }).connect(masterDistortion);
  
  breakcoreSnare = new Tone.NoiseSynth({
    noise: {type: "white"},
    envelope: {attack: 0.005, decay: 0.1, sustain: 0}
  }).connect(masterDistortion);
  
  breakcoreHihat = new Tone.NoiseSynth({
    noise: {type: "white"},
    envelope: {attack: 0.005, decay: 0.05, sustain: 0}
  }).connect(masterDistortion);
  
  Tone.getTransport().bpm.value = 125;
  audioInitialized = true;
  console.log("✓ Enhanced IDM audio system ready");
}

function startAmbientMusic() {
  if (isPlaying) return;
  isPlaying = true;
  
  console.log("Starting enhanced IDM ambient music...");
  if (window.updateStatus) window.updateStatus("Playing");
  
  // Ambient pad chords (unchanged)
  Tone.getTransport().scheduleRepeat((time) => {
    const currentChord = chordProgression[currentChordIndex];
    ambientPad.triggerAttackRelease(currentChord, "2m", time, 0.3);
    currentChordIndex = (currentChordIndex + 1) % chordProgression.length;
  }, "2m");
  
  // IMPROVED: Bass line with higher octave - less muddy
  let bassChordIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    const bassNote = bassNotes[bassChordIndex % bassNotes.length];
    const bassNoteHigh = bassNotesHigh[bassChordIndex % bassNotesHigh.length];
    
    // Play both low and high bass notes
    bassLine.triggerAttackRelease(bassNote, "1m", time, 0.6); // Lower volume for low
    bassLine.triggerAttackRelease(bassNoteHigh, "1m", time, 0.4); // Higher octave
    
    bassChordIndex = (bassChordIndex + 1) % bassNotes.length;
  }, "1m");
  
  // IMPROVED: More structured arpeggios - repeating patterns
  let arpeggioNoteIndex = 0;
  let arpeggioPatternIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    const currentPattern = arpeggioPatterns[arpeggioPatternIndex];
    const note = currentPattern[arpeggioNoteIndex % currentPattern.length];
    
    // IMPROVED: More consistent playback, less random
    if (Math.random() > 0.05) { // 95% chance instead of 85%
      arpeggioSynth.triggerAttackRelease(note, "16n", time, 0.4);
    }
    
    arpeggioNoteIndex++;
    if (arpeggioNoteIndex % 16 === 0) { // Every measure
      arpeggioNoteIndex = 0;
      // Change pattern every 4 measures to follow chord changes
      if (arpeggioNoteIndex % 64 === 0) {
        arpeggioPatternIndex = (arpeggioPatternIndex + 1) % arpeggioPatterns.length;
      }
    }
  }, "16n");
  
  // RETHOUGHT: Motion-controlled percussive stabs (not melody)
  let percussiveIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    const currentStabChord = percussiveStabNotes[currentChordIndex];
    
    // IMPROVED: Better motion-responsive volume and timing
    const motionVolume = 0.1 + (motionAmountSmooth * 0.6);
    
    // Play percussive stabs when there's motion - more rhythmic
    if (motionAmountSmooth > 0.1 && Math.random() > 0.4) { // Lower threshold since motion detection is more accurate
      // Play multiple notes from chord for fuller stabs
      currentStabChord.forEach((note, index) => {
        counterMelody.triggerAttackRelease(note, "16n", time + (index * 0.01), motionVolume);
      });
    }
    
    percussiveIndex++;
  }, "4n"); // Quarter note rhythm for more rhythmic feel
  
  // NEW: Palm-controlled hihat rhythm (cleaner sound)
  Tone.getTransport().scheduleRepeat((time) => {
    // Volume controlled by palm direction (hand width)
    const hihatVolume = palmDirection * 0.4; // 0 to 0.4 volume range
    
    if (hihatVolume > 0.05) { // Only play when hands are spread
      motionHihat.triggerAttackRelease("C6", "32n", time, hihatVolume);
    }
  }, "8n"); // 8th note hihat rhythm
  
  // Glitchy lead (unchanged)
  const leadMelody = ["Bb4", "D5", "F5", "Ab5", "C5", "Eb5"];
  let leadIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    if (Math.random() > 0.7) {
      const note = leadMelody[leadIndex % leadMelody.length];
      leadSynth.triggerAttackRelease(note, "32n", time, 0.3);
      leadIndex++;
    }
  }, "16n");
  
  // Vocal chant (unchanged)
  const chantNotes = ["Bb2", "D3", "F3", "Ab3"];
  let chantIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    if (Math.random() > 0.9) {
      const note = chantNotes[chantIndex % chantNotes.length];
      vocalChant.triggerAttackRelease(note, "1m", time, 0.2);
      chantIndex++;
    }
  }, "1m");
  
  Tone.getTransport().start();
}

// NEW: Much more chaotic breakcore beat function
function startBreakcore() {
  if (isBreakcoreActive) return;
  
  isBreakcoreActive = true;
  breakcoreStartTime = millis();
  
  console.log("🔥 CHAOTIC BREAKCORE ACTIVATED!");
  
  // MUCH MORE CHAOTIC breakcore pattern - rapid fire
  const chaoticPattern = [
    // Rapid fire section 1
    {time: "0:0:0", sound: "kick", velocity: 0.9},
    {time: "0:0:1", sound: "snare", velocity: 0.8},
    {time: "0:0:1.5", sound: "hihat", velocity: 0.6},
    {time: "0:0:2", sound: "kick", velocity: 0.7},
    {time: "0:0:2.5", sound: "snare", velocity: 0.9},
    {time: "0:0:3", sound: "hihat", velocity: 0.5},
    {time: "0:0:3.5", sound: "kick", velocity: 0.8},
    
    {time: "0:1:0", sound: "snare", velocity: 0.9},
    {time: "0:1:0.5", sound: "hihat", velocity: 0.4},
    {time: "0:1:1", sound: "kick", velocity: 0.8},
    {time: "0:1:1.5", sound: "snare", velocity: 0.7},
    {time: "0:1:2", sound: "hihat", velocity: 0.6},
    {time: "0:1:2.5", sound: "kick", velocity: 0.9},
    {time: "0:1:3", sound: "snare", velocity: 0.8},
    {time: "0:1:3.5", sound: "hihat", velocity: 0.5},
    
    // Even more chaotic section
    {time: "0:2:0", sound: "kick", velocity: 0.9},
    {time: "0:2:0.25", sound: "hihat", velocity: 0.4},
    {time: "0:2:0.5", sound: "snare", velocity: 0.8},
    {time: "0:2:0.75", sound: "kick", velocity: 0.7},
    {time: "0:2:1", sound: "hihat", velocity: 0.5},
    {time: "0:2:1.25", sound: "snare", velocity: 0.9},
    {time: "0:2:1.5", sound: "kick", velocity: 0.8},
    {time: "0:2:1.75", sound: "hihat", velocity: 0.6},
    {time: "0:2:2", sound: "snare", velocity: 0.9},
    {time: "0:2:2.25", sound: "kick", velocity: 0.8},
    {time: "0:2:2.5", sound: "hihat", velocity: 0.4},
    {time: "0:2:2.75", sound: "snare", velocity: 0.7},
    {time: "0:2:3", sound: "kick", velocity: 0.9},
    {time: "0:2:3.25", sound: "hihat", velocity: 0.5},
    {time: "0:2:3.5", sound: "snare", velocity: 0.8},
    {time: "0:2:3.75", sound: "kick", velocity: 0.7},
    
    // Frantic finale
    {time: "0:3:0", sound: "kick", velocity: 0.9},
    {time: "0:3:0.125", sound: "hihat", velocity: 0.3},
    {time: "0:3:0.25", sound: "snare", velocity: 0.8},
    {time: "0:3:0.375", sound: "hihat", velocity: 0.4},
    {time: "0:3:0.5", sound: "kick", velocity: 0.8},
    {time: "0:3:0.625", sound: "snare", velocity: 0.9},
    {time: "0:3:0.75", sound: "hihat", velocity: 0.5},
    {time: "0:3:0.875", sound: "kick", velocity: 0.7},
    {time: "0:3:1", sound: "snare", velocity: 0.9},
    {time: "0:3:1.125", sound: "hihat", velocity: 0.4},
    {time: "0:3:1.25", sound: "kick", velocity: 0.8},
    {time: "0:3:1.375", sound: "snare", velocity: 0.8},
    {time: "0:3:1.5", sound: "hihat", velocity: 0.6},
    {time: "0:3:1.625", sound: "kick", velocity: 0.9},
    {time: "0:3:1.75", sound: "snare", velocity: 0.8},
    {time: "0:3:1.875", sound: "hihat", velocity: 0.5},
    {time: "0:3:2", sound: "kick", velocity: 0.9},
    {time: "0:3:2.125", sound: "snare", velocity: 0.8},
    {time: "0:3:2.25", sound: "hihat", velocity: 0.4},
    {time: "0:3:2.375", sound: "kick", velocity: 0.7},
    {time: "0:3:2.5", sound: "snare", velocity: 0.9},
    {time: "0:3:2.625", sound: "hihat", velocity: 0.5},
    {time: "0:3:2.75", sound: "kick", velocity: 0.8},
    {time: "0:3:2.875", sound: "snare", velocity: 0.8},
    {time: "0:3:3", sound: "kick", velocity: 0.9},
    {time: "0:3:3.125", sound: "hihat", velocity: 0.6},
    {time: "0:3:3.25", sound: "snare", velocity: 0.9},
    {time: "0:3:3.375", sound: "kick", velocity: 0.8},
    {time: "0:3:3.5", sound: "hihat", velocity: 0.4},
    {time: "0:3:3.625", sound: "snare", velocity: 0.8},
    {time: "0:3:3.75", sound: "kick", velocity: 0.9},
    {time: "0:3:3.875", sound: "hihat", velocity: 0.5}
  ];
  
  // Schedule all chaotic breakcore hits
  chaoticPattern.forEach(hit => {
    Tone.getTransport().schedule((time) => {
      if (hit.sound === "kick") {
        breakcoreKick.triggerAttackRelease("C1", "32n", time, hit.velocity);
      } else if (hit.sound === "snare") {
        breakcoreSnare.triggerAttackRelease("32n", time, hit.velocity);
      } else if (hit.sound === "hihat") {
        breakcoreHihat.triggerAttackRelease("64n", time, hit.velocity);
      }
    }, `+${hit.time}`);
  });
  
  // Stop breakcore after duration
  setTimeout(() => {
    isBreakcoreActive = false;
    console.log("Chaotic breakcore ended");
  }, breakCoreDuration);
}

function stopMusic() {
  if (!isPlaying) return;
  isPlaying = false;
  
  try {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    if (ambientPad) ambientPad.releaseAll();
    isBreakcoreActive = false;
    console.log('Music stopped');
    if (window.updateStatus) window.updateStatus("Stopped");
  } catch (error) {
    console.error('Error stopping music:', error);
  }
}

// NEW: Jump detection function
function calculateJumpAmount(pose) {
  const leftAnkle = pose.keypoints[27];
  const rightAnkle = pose.keypoints[28];
  const nose = pose.keypoints[0];
  
  if (leftAnkle && rightAnkle && nose &&
      leftAnkle.confidence > 0.5 && rightAnkle.confidence > 0.5 && nose.confidence > 0.5) {
    
    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    const expectedGroundLevel = height * 0.9; // Assume ground is near bottom
    const jumpHeight = expectedGroundLevel - avgAnkleY;
    
    return constrain(jumpHeight / 200, 0, 2); // Normalize jump height
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
  // IMPROVED: Measure actual width between hands, normalized
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  
  if (leftShoulder && rightShoulder && leftWrist && rightWrist &&
      leftShoulder.confidence > 0.5 && rightShoulder.confidence > 0.5 &&
      leftWrist.confidence > 0.5 && rightWrist.confidence > 0.5) {
    
    // Calculate distance between hands
    const handDistance = Math.abs(rightWrist.x - leftWrist.x);
    
    // Calculate shoulder width as baseline
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    
    // Normalize: 0 when hands together, 1 when hands are 2x shoulder width apart
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
  
  const keyPoints = [0, 11, 12, 13, 14, 15, 16, 23, 24];
  
  for (let i of keyPoints) {
    const current = currentPose.keypoints[i];
    const previous = prevPose.keypoints[i];
    
    if (current && previous && current.confidence > 0.5 && previous.confidence > 0.5) {
      const distance = dist(current.x, current.y, previous.x, previous.y);
      totalMotion += distance;
      validPoints++;
    }
  }
  
  previousPoses.push(currentPose);
  if (previousPoses.length > 5) {
    previousPoses.shift();
  }
  
  // IMPROVED: Much higher threshold for stillness, lower baseline
  const avgMotion = validPoints > 0 ? totalMotion / validPoints : 0;
  motionAmountRaw = constrain(avgMotion / 25, 0, 1); // Higher threshold = lower baseline
  
  return motionAmountRaw;
}

function updateAudioFilters() {
  if (!audioInitialized) return;
  
  armStretchSmooth = lerp(armStretchSmooth, armStretch, 0.1);
  
  // IMPROVED: Motion smoothing with slower decay
  if (motionAmountRaw > motionAmountSmooth) {
    // Quick response when motion increases
    motionAmountSmooth = lerp(motionAmountSmooth, motionAmountRaw, 0.3);
  } else {
    // Slow decay when motion decreases
    motionAmountSmooth = lerp(motionAmountSmooth, motionAmountRaw, motionDecayRate);
  }
  
  handHeightSmooth = lerp(handHeightSmooth, handHeight, 0.1);
  
  // ARM STRETCH → BRIGHTNESS FILTER
  brightnessFreq = map(armStretchSmooth, 0, 1, 200, 4000);
  brightnessFilter.frequency.rampTo(brightnessFreq, 0.5);
  
  // MOTION → RESONANCE FILTER
  motionResonance = map(motionAmountSmooth, 0, 1, 1, 20);
  motionFilter.Q.rampTo(motionResonance, 0.3);
  
  const motionFreq = map(motionAmountSmooth, 0, 1, 600, 1200);
  motionFilter.frequency.rampTo(motionFreq, 0.3);
  
  // PALM DIRECTION (now horizontal distance) → HIGH-PASS FILTER
  palmFreq = map(palmDirection, 0, 1, 200, 3000); // 0 to 1 instead of -1 to 1
  palmFilter.frequency.rampTo(palmFreq, 0.8);
  
  // HAND HEIGHT → VOCAL CHANT TRIGGER
  if (handHeightSmooth > 0.3 && millis() - lastTwinkleTime > 1000) { // Longer cooldown for vocal chant
    triggerTwinkle();
    lastTwinkleTime = millis();
  }
  
  // NEW: JUMP → BREAKCORE TRIGGER
  if (jumpAmount > jumpThreshold && millis() - lastJumpTime > 5000 && !isBreakcoreActive) {
    startBreakcore();
    lastJumpTime = millis();
  }
}

function triggerTwinkle() {
  if (!audioInitialized) return;
  
  // Try vocal sampler first, fallback to synth
  if (vocalSampler) {
    // Use vocal sample if available
    vocalSampler.triggerAttackRelease("C4", "2n", "+0", 0.5);
    console.log("🎵 Vocal Sample");
  } else if (twinkleSound) {
    // Fallback to synth version
    const vocalChantNotes = ["Bb3", "D4", "F4", "Ab4", "Bb4"];
    const note = random(vocalChantNotes);
    twinkleSound.triggerAttackRelease(note, "2n", "+0", 0.3);
    console.log("🎵 Vocal Chant");
  }
}

// BACK TO ORIGINAL: Much more responsive visual system
function drawOscilloscopePattern(centerX, centerY, scale) {
  if (!audioAnalyzer) return;
  
  push();
  translate(centerX, centerY);
  
  // Get audio data
  const spectrum = audioAnalyzer.getValue();
  
  // Make patterns much more visible
  if (visualMode === 0) {
    drawLissajousScale(spectrum, scale);
  } else {
    drawSpectralFlow(spectrum, scale);
  }
  
  pop();
}

function drawLissajousScale(spectrum, scale) {
  stroke(255, 200); // More visible
  strokeWeight(2 + scale * 0.02);
  noFill();
  
  beginShape();
  for (let i = 0; i < spectrum.length - 1; i++) {
    // Convert from dB to amplitude and scale much larger
    let x = (spectrum[i] + 100) / 100 * scale * 400; // Much larger scale
    let y = (spectrum[i + 1] + 100) / 100 * scale * 400;
    
    // Add modulation for more complex patterns
    let freqMod = (spectrum[i] + 100) / 100 * scale * 100;
    x += cos(i * 0.05) * freqMod;
    y += sin(i * 0.05) * freqMod;
    
    vertex(x, y);
  }
  endShape();
  
  // Mirror for symmetry - more visible
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
  
  // More segments for finer, less anatomical patterns
  let segments = 16; // Increased from 8
  
  for (let seg = 0; seg < segments; seg++) {
    let startIdx = Math.floor((spectrum.length / segments) * seg);
    let endIdx = Math.floor((spectrum.length / segments) * (seg + 1));
    
    // Subtle gesture influence on visual parameters
    let gestureInfluence = (armStretchSmooth + motionAmountSmooth + Math.abs(handHeightSmooth)) / 3;
    let rotationSpeed = 1 + gestureInfluence * 2; // Gesture affects rotation
    let complexityMod = 1 + palmDirection * 0.3; // Palm direction affects complexity
    
    beginShape();
    for (let i = startIdx; i < endIdx; i++) {
      let progress = map(i, startIdx, endIdx, 0, 1);
      let intensity = (spectrum[i] + 100) / 100;
      
      // More flowing, abstract pattern
      let baseAngle = map(seg, 0, segments, 0, TWO_PI * rotationSpeed);
      let flowAngle = baseAngle + progress * PI * complexityMod;
      
      // Spiral outward with gesture influence
      let radius = intensity * scale * (100 + gestureInfluence * 50);
      let spiralFactor = progress * gestureInfluence * 0.5;
      
      let x = cos(flowAngle) * (radius + spiralFactor * 30);
      let y = sin(flowAngle) * (radius + spiralFactor * 30);
      
      // Add organic variation with gesture modulation
      let harmonicFreq = 3 + Math.floor(gestureInfluence * 4);
      x += cos(flowAngle * harmonicFreq) * intensity * scale * (20 + gestureInfluence * 15);
      y += sin(flowAngle * harmonicFreq) * intensity * scale * (20 + gestureInfluence * 15);
      
      vertex(x, y);
    }
    endShape();
    
    // Add connecting lines between segments for continuity
    if (seg < segments - 1) {
      stroke(255, 60);
      strokeWeight(0.5);
      // Draw subtle connecting lines
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
  let meterWidth = 220;
  let meterHeight = 15;
  let spacing = 28;
  
  fill(0, 0, 0, 150);
  noStroke();
  rect(meterX - 10, meterY - 10, meterWidth + 20, spacing * 6 + 10); // Room for 6 meters
  
  // Arm Stretch Meter
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 100, 100);
  rect(meterX, meterY, meterWidth * armStretchSmooth, meterHeight);
  fill(255);
  textSize(11);
  text(`Arm Stretch: ${(armStretchSmooth * 100).toFixed(0)}% → Brightness`, meterX, meterY - 3);
  
  // Motion Amount Meter (now percussive stabs)
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(100, 255, 100);
  rect(meterX, meterY, meterWidth * motionAmountSmooth, meterHeight);
  fill(255);
  text(`Motion: ${(motionAmountSmooth * 100).toFixed(0)}% → Percussive Stabs`, meterX, meterY - 3);
  
  // Hand Height Meter (vocal chant)
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  let handHeightDisplay = map(handHeightSmooth, -1, 1, 0, 1);
  fill(100, 100, 255);
  rect(meterX, meterY, meterWidth * handHeightDisplay, meterHeight);
  fill(255);
  text(`Hand Height: ${handHeightSmooth > 0 ? 'UP' : 'DOWN'} → Vocal Chant`, meterX, meterY - 3);
  
  // Palm Direction Meter (now horizontal distance + hihat)
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 255, 100);
  rect(meterX, meterY, meterWidth * palmDirection, meterHeight);
  fill(255);
  text(`Hand Width: ${(palmDirection * 100).toFixed(0)}% → Hihat Volume`, meterX, meterY - 3);
  
  // NEW: Jump Detection Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 50, 50);
  rect(meterX, meterY, meterWidth * (jumpAmount / 2), meterHeight); // Scale to max 2
  fill(255);
  text(`Jump: ${(jumpAmount * 100).toFixed(0)}% → Breakcore Beat`, meterX, meterY - 3);
  
  // Breakcore Status
  meterY += spacing;
  if (isBreakcoreActive) {
    fill(255, 50, 50);
    rect(meterX, meterY, meterWidth, meterHeight);
    fill(255);
    text(`🔥 BREAKCORE ACTIVE 🔥`, meterX, meterY - 3);
  } else {
    fill(30);
    rect(meterX, meterY, meterWidth, meterHeight);
    fill(100);
    text(`Breakcore: Ready`, meterX, meterY - 3);
  }
}

function draw() {
  background(0);
  
  // Dark video overlay
  push();
  tint(255, 80);
  if (video) {
    image(video, 0, 0, width, height);
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
  
  // Process poses
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    
    armStretch = calculateArmStretch(pose);
    handHeight = calculateHandHeight(pose);
    palmDirection = calculatePalmDirection(pose);
    motionAmount = calculateMotionAmount(pose);
    motionAmountRaw = motionAmount; // Store raw value
    jumpAmount = calculateJumpAmount(pose); // NEW: Jump detection
    
    updateAudioFilters();
    
    // Draw minimal skeleton (very subtle)
    if (connections && pose.keypoints) {
      stroke(255, 30);
      strokeWeight(0.5);
      
      for (let j = 0; j < connections.length; j++) {
        let pointAIndex = connections[j][0];
        let pointBIndex = connections[j][1];
        let pointA = pose.keypoints[pointAIndex];
        let pointB = pose.keypoints[pointBIndex];
        
        if (pointA && pointB && pointA.confidence > 0.1 && pointB.confidence > 0.1) {
          line(pointA.x, pointA.y, pointB.x, pointB.y);
        }
      }
    }
    
    // Draw enhanced oscilloscope pattern at body center
    if (audioInitialized && isPlaying) {
      let visualScale = map(armStretchSmooth + motionAmountSmooth, 0, 2, 0.8, 2.5);
      
      // Add breakcore visual boost
      if (isBreakcoreActive) {
        visualScale *= 1.5;
        // Add extra visual energy during breakcore
        push();
        translate(bodyCenter.x, bodyCenter.y);
        stroke(255, 0, 0, 100);
        strokeWeight(3);
        noFill();
        let breakRadius = sin(millis() * 0.01) * 50 + 100;
        ellipse(0, 0, breakRadius, breakRadius);
        pop();
      }
      
      drawOscilloscopePattern(bodyCenter.x, bodyCenter.y, visualScale);
    }
  }
  
  // Draw enhanced gesture meters
  if (audioInitialized) {
    drawGestureMeters();
  }
  
  // Visual mode info (bottom right)
  fill(255, 150);
  textAlign(RIGHT);
  textSize(12);
  text(`Visual: ${visualModes[visualMode]} (M to change)`, width - 20, height - 20);
  
  // NEW: Instructions update
  textSize(10);
  text(`Small jump to trigger breakcore!`, width - 20, height - 40);
  text(`Spread hands wide for hihat rhythm`, width - 20, height - 55);
  textAlign(LEFT);
}

function mousePressed() {
  if (!audioInitialized) {
    initializeAudio().then(() => {
      startAmbientMusic();
    });
  } else {
    if (isPlaying) {
      stopMusic();
    } else {
      startAmbientMusic();
    }
  }
}

function keyPressed() {
  if (key.toLowerCase() === 'm') {
    visualMode = (visualMode + 1) % visualModes.length;
    console.log('Visual mode:', visualModes[visualMode]);
  }
  
  // NEW: Manual breakcore trigger for testing
  if (key.toLowerCase() === 'b' && audioInitialized && !isBreakcoreActive) {
    startBreakcore();
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