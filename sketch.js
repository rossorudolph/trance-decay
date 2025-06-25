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

// UPDATED: New Jeans sample system - starts clean, then decays
let popHookSampler;
let popHookPlayer; // Clean player
let popHookGrainPlayer; // Granular player
let popHookActive = false;
let cleanPhaseActive = false;
let cleanToGranularTransition = false;
let granularDecaySystem;
let decayStartTime = 0;
let decayDuration = 60000; // 60 seconds for full decay cycle
let clearMomentTriggered = false; // Track if clear moment happened

// Visual feedback for New Jeans pose and decay
let newJeansPoseFlashTime = 0;
let decayVisualIntensity = 0;

// Pose trigger detection for New Jeans sample
let newJeansPoseActive = false;
let lastNewJeansTrigger = 0;

// NEW: Comprehensive state system (0-6)
let currentState = 0;
let stateStartTime = 0;
let fullBodyDetectedTime = 0;
let hasFullBodyDetection = false;
let chaoticPhaseStartTime = 0;
let finalDecayStartTime = 0;
let njPoseImage;
let poseFlashIntensity = 0;

// Motion encouragement system  
let motionEncouragementActive = false;
let motionEncouragementStartTime = 0;
let baselineMotionLevel = 0;
let motionThresholdMet = false;

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

// Hip motion tracking
let hipMotionAmount = 0;
let hipMotionSmooth = 0;
let previousHipPosition = {x: 0, y: 0};

let motionHistory = [];
let motionAverage = 0;

// Jump detection
let jumpAmount = 0;
let jumpThreshold = 0.95; // ULTRA STRICT - almost impossible to false trigger
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
let bodyCenter = {x: 0, y: 0}; // FIXED: Store in raw video coordinates
let bodyCenterSmooth = {x: 0, y: 0}; // FIXED: Store in raw video coordinates
let bodyRotation = 0;
let traceBuffer;
let handTraceBuffer; // Separate trace buffer for hands with longer trails

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

// Hand tracking for new visuals
let leftHandSmooth = {x: 0, y: 0}; // FIXED: Store in display coordinates
let rightHandSmooth = {x: 0, y: 0}; // FIXED: Store in display coordinates
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

// FIXED: Jersey club pattern with proper bass notes and timing
const jerseyClubBassNotes = ["C1", "C1", "F1", "C1", "G1", "C1", "F1", "G1"];

// FIXED: New Jeans OMG-inspired bass line - more energetic and rhythmic
// Based on OMG tablature - Key F with energetic bass patterns
const chordProgression = [
  ["F2", "A2", "C3", "F3"],    // F major - root
  ["C2", "E2", "G2", "C3"],    // C major - dominant  
  ["Dm2", "F2", "A2", "D3"],   // D minor - relative minor
  ["G2", "B2", "D3", "G3"]     // G major - leading back
];

// New Jeans OMG-inspired melodic patterns - more energetic and pop-oriented
const repeatingMelodies = [
  {
    notes: ["F4", "A4", "C5", "F5", "E4", "F4", "A4", "C4", "F4", "A4"],
    timings: [0, 0.25, 0.5, 0.75, 1.0, 1.5, 1.75, 2.0, 2.5, 3.0],
    repeat: true
  },
  {
    notes: ["C5", "E4", "G4", "C5", "B4", "G4", "E4", "C4", "E4", "G4"],
    timings: [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.75, 2.0, 2.25, 2.75],
    repeat: true
  },
  {
    notes: ["D5", "F5", "A5", "D6", "C5", "D5", "F4", "A4", "D5", "F5"],
    timings: [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.25, 2.5],
    repeat: true
  },
  {
    notes: ["G5", "B5", "D5", "G5", "F#5", "G5", "B4", "D5", "G5", "B5"],
    timings: [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5],
    repeat: true
  }
];

// Hymnal vocal chanting patterns (F major harmonies)
const hymnalChanting = [
  {
    notes: ["F4", "C4"],
    timings: [0.5, 2.5],
    duration: "2m"
  },
  {
    notes: ["C4", "G4"],
    timings: [1.0, 3.0],
    duration: "2m"
  },
  {
    notes: ["D5", "A4"],
    timings: [0.0, 2.0],
    duration: "2m"
  },
  {
    notes: ["G4", "D4"],
    timings: [1.5, 3.5],
    duration: "2m"
  }
];

// Strings melodies (supporting F major harmonies)
const stringsMelodies = [
  {
    notes: ["F3", "A3", "C3", "F3", "A3", "C3"],
    timings: [0, 1.0, 2.0, 3.0, 4.0, 5.0],
    duration: "2n"
  },
  {
    notes: ["C3", "E3", "G3", "C3", "E3", "G3"],
    timings: [0, 1.0, 2.0, 3.0, 4.0, 5.0],
    duration: "2n"
  },
  {
    notes: ["D4", "F3", "A3", "D4", "F4", "A3"],
    timings: [0, 1.0, 2.0, 3.0, 4.0, 5.0],
    duration: "2n"
  },
  {
    notes: ["G3", "B3", "D3", "G4", "B3", "D3"],
    timings: [0, 1.0, 2.0, 3.0, 4.0, 5.0],
    duration: "2n"
  }
];

let currentChordIndex = 0;

function preload() {
  // Load the pose outline image
  njPoseImage = loadImage("samples/njpose.png", 
    () => console.log("✓ New Jeans pose image loaded"), 
    () => console.warn("⚠️ Could not load njpose.png from samples folder")
  );
}

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
  handTraceBuffer = createGraphics(canvasWidth, canvasHeight);
  
  console.log("🎥 Setting up HIGH QUALITY video capture for installation...");
  
  // INSTALLATION: Force high quality video capture
  video = createCapture({
    video: {
      width: 1920,        // Higher resolution
      height: 1080,       // Higher resolution
      facingMode: "user",
      frameRate: 30       // Ensure smooth framerate
    }
  }, videoReady);
  
  if (video) {
    video.hide();
    console.log("✓ High quality video capture created");
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
  
  // Initialize state system
  currentState = 0;
  stateStartTime = millis();
  
  console.log("ENHANCED TRANCE-DECAY INSTALLATION v2");
  console.log("✓ 6-state progression system");
  console.log("✓ Fixed coordinate alignment");
  console.log("✓ Improved jersey club timing");
  console.log("✓ HIGH QUALITY INSTALLATION MODE");
}

// NEW: Comprehensive state management
function updateStateSystem() {
  const elapsed = millis() - stateStartTime;
  
  switch(currentState) {
    case 0: // No full body detected
      if (hasFullBodyDetection) {
        changeState(1);
      }
      break;
      
    case 1: // Participant entered, 3-second transition
      if (elapsed > 3000) {
        changeState(2);
      }
      break;
      
    case 2: // Cue to hit njpose (30 seconds after entering)
      if (elapsed > 30000 && newJeansPoseActive && !popHookActive) {
        triggerEnhancedPopHook();
        changeState(3);
      }
      break;
      
    case 3: // NJ pose completed, amplify hand shapes
      if (popHookActive && elapsed > 20000) { // 20 seconds after pose
        motionEncouragementActive = true;
        motionEncouragementStartTime = millis();
        baselineMotionLevel = motionAverage;
        motionThresholdMet = false;
        changeState(4);
      }
      break;
      
    case 4: // Motion encouragement
      if (motionThresholdMet || elapsed > 30000) { // Success or 30s timeout
        chaoticPhaseStartTime = millis();
        changeState(5);
      }
      break;
      
    case 5: // Chaotic phase with breakbeat
      if (elapsed > 30000) { // 30 seconds of chaos
        finalDecayStartTime = millis();
        changeState(6);
      }
      break;
      
    case 6: // Final decay back to beginning
      if (elapsed > 20000) { // 20 seconds of decay
        resetToBeginning();
      }
      break;
  }
}

function changeState(newState) {
  console.log(`🎭 State change: ${currentState} → ${newState}`);
  currentState = newState;
  stateStartTime = millis();
  
  // State-specific initialization
  switch(newState) {
    case 1:
      // Auto-start audio system
      if (!audioInitialized) {
        initializeAudio().then(() => {
          startAmbientMusic();
        });
      } else if (!isPlaying) {
        startAmbientMusic();
      }
      break;
      
    case 5:
      // Start chaotic breakcore
      if (!isBreakcoreActive) {
        startBreakcore();
      }
      break;
  }
}

function resetToBeginning() {
  console.log("🔄 Resetting to beginning state");
  
  // Stop all audio
  if (isPlaying) {
    stopMusic();
  }
  
  // Reset all states
  currentState = 0;
  stateStartTime = millis();
  hasFullBodyDetection = false;
  fullBodyDetectedTime = 0;
  motionEncouragementActive = false;
  motionThresholdMet = false;
  popHookActive = false;
  isBreakcoreActive = false;
  
  // Reset visual buffers
  if (traceBuffer) {
    traceBuffer.clear();
  }
  if (handTraceBuffer) {
    handTraceBuffer.clear();
  }
}

// Check for full body detection
function checkFullBodyDetection(pose) {
  const requiredPoints = [0, 11, 12, 23, 24, 15, 16]; // nose, shoulders, hips, wrists
  let validCount = 0;
  
  for (let pointIndex of requiredPoints) {
    const point = pose.keypoints[pointIndex];
    if (point && point.confidence > 0.5) {
      validCount++;
    }
  }
  
  const isFullBody = validCount >= 6; // Need at least 6 of the 7 key points
  
  if (isFullBody && !hasFullBodyDetection) {
    hasFullBodyDetection = true;
    fullBodyDetectedTime = millis();
    console.log("👤 Full body detected! Starting state transition.");
  } else if (!isFullBody && hasFullBodyDetection) {
    // Grace period - only lose full body detection after 2 seconds
    if (millis() - fullBodyDetectedTime > 2000) {
      hasFullBodyDetection = false;
      fullBodyDetectedTime = 0;
      console.log("👤 Full body detection lost.");
    }
  }
  
  return hasFullBodyDetection;
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
      x: minX - 60, // Increased margin
      y: minY - 80, // More space above head
      width: (maxX - minX) + 120, // Increased total width
      height: (maxY - minY) + 120 // Increased total height
    };
    blobTrackingActive = true;
  } else {
    blobTrackingActive = false;
  }
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

// NEW: Crescent-like waveforms that permeate upwards/downwards
function drawHandHeightLines(handX, handY, heightValue) {
  if (!audioAnalyzer || Math.abs(heightValue) < 0.05) return;
  
  const spectrum = audioAnalyzer.getValue();
  const intensity = Math.abs(heightValue);
  const isUpward = heightValue > 0;
  
  push();
  translate(handX, handY);
  //scale(1, -1); // Flip crescents vertically so they emanate from the hands
  
  // Draw 3-5 crescent waveforms that emanate and dissolve
  let numCrescents = Math.floor(map(intensity, 0, 1, 2, 5));
  
  for (let crescentIndex = 0; crescentIndex < numCrescents; crescentIndex++) {
    let crescentDistance = (crescentIndex + 1) * 30; // Distance from hand
    let crescentY = isUpward ? -crescentDistance : crescentDistance;
    
    // Fade out as crescents get further from hand
    let alpha = map(crescentIndex, 0, numCrescents, 180, 40);
    
    stroke(255, 255, 255, alpha * intensity);
    strokeWeight(map(intensity, 0, 1, 0.8, 1.8));
    noFill();
    
    // Draw crescent shape with audio reactivity
    beginShape();
    
    let crescentWidth = map(intensity, 0, 1, 60, 120);
    let crescentPoints = 12;
    
    for (let i = 0; i <= crescentPoints; i++) {
      let progress = i / crescentPoints;
      let baseX = map(progress, 0, 1, -crescentWidth/2, crescentWidth/2);
      
      // Create crescent curve
      let crescentHeight = sin(progress * PI) * map(intensity, 0, 1, 15, 30);
      
      // Add audio distortion
      let specIndex = Math.floor(map(progress, 0, 1, 0, spectrum.length - 1));
      let audioIntensity = (spectrum[specIndex] + 100) / 100;
      let audioWave = audioIntensity * intensity * 8;
      
      // Time-based animation for dissolution effect
      let timeOffset = millis() * 0.008 + crescentIndex * 0.5;
      let dissolutionWave = sin(progress * PI * 3 + timeOffset) * intensity * 3;
      
      let x = baseX + dissolutionWave;
      let y = crescentY + (isUpward ? crescentHeight : -crescentHeight) + audioWave;
      
      vertex(x, y);
    }
    
    endShape();
    
    // Add smaller accent crescents
    if (crescentIndex < 2) {
      stroke(255, 255, 255, alpha * intensity * 0.6);
      strokeWeight(0.6);
      
      beginShape();
      for (let i = 0; i <= crescentPoints; i++) {
        let progress = i / crescentPoints;
        let baseX = map(progress, 0, 1, -crescentWidth/3, crescentWidth/3);
        
        let crescentHeight = sin(progress * PI) * map(intensity, 0, 1, 8, 16);
        
        let specIndex = Math.floor(map(progress, 0, 1, 0, spectrum.length - 1));
        let audioIntensity = (spectrum[specIndex] + 100) / 100;
        let audioWave = audioIntensity * intensity * 4;
        
        let timeOffset = millis() * 0.012 + crescentIndex * 0.3;
        let dissolutionWave = sin(progress * PI * 2 + timeOffset) * intensity * 2;
        
        let x = baseX + dissolutionWave;
        let y = crescentY * 0.7 + (isUpward ? crescentHeight : -crescentHeight) + audioWave;
        
        vertex(x, y);
      }
      endShape();
    }
  }
  
  pop();
}

// NEW: Sparse lines between hands instead of filled shape
function drawSpectralFlowBetweenHands(leftHandX, leftHandY, rightHandX, rightHandY, handSpread) {
  if (!audioAnalyzer) return;
  
  const spectrum = audioAnalyzer.getValue();
  
  // Calculate center point between hands
  const centerX = (leftHandX + rightHandX) / 2;
  const centerY = (leftHandY + rightHandY) / 2;
  
  // Scale based on hand spread distance
  const baseScale = map(handSpread, 100, 400, 0.4, 1.2);
  let visualScale = baseScale * map(armStretchSmooth + motionAmountSmooth, 0, 2, 0.6, 1.2);
  
  // State 3: Amplify between-hands visual during NJ pose completion
  if (currentState === 3) {
    visualScale *= 1.3 + sin(millis() * 0.008) * 0.2;
  }
  
  push();
  translate(centerX, centerY);
  
  // Rotate to align with hand connection
  const handAngle = atan2(rightHandY - leftHandY, rightHandX - leftHandX);
  rotate(handAngle);
  
  // Draw sparse lines instead of filled shapes
  stroke(200, 200, 200, 140); // Lighter gray
  strokeWeight(0.8);
  noFill();
  
  // Draw only 6 sparse lines with audio reactivity
  let numLines = 6;
  
  for (let line = 0; line < numLines; line++) {
    let specIndex = Math.floor(map(line, 0, numLines, 0, spectrum.length - 1));
    let intensity = (spectrum[specIndex] + 100) / 100;
    
    let lineLength = intensity * visualScale * 60;
    let yOffset = (line - numLines/2) * 8; // Spread lines vertically
    
    // Simple horizontal lines with slight audio distortion
    let startX = -lineLength/2;
    let endX = lineLength/2;
    let waveAmount = intensity * 3;
    
    beginShape();
    for (let x = startX; x <= endX; x += 3) {
      let progress = map(x, startX, endX, 0, 1);
      let wave = sin(progress * PI * 2 + millis() * 0.005) * waveAmount;
      vertex(x, yOffset + wave);
    }
    endShape();
  }
  
  pop();
}

function drawNewJeansPoseFlash() {
  if (millis() - newJeansPoseFlashTime < 500) {
    let flashIntensity = map(millis() - newJeansPoseFlashTime, 0, 500, 1, 0);
    
    push();
    const leftWrist = poses[0] ? poses[0].keypoints[15] : null;
    const rightWrist = poses[0] ? poses[0].keypoints[16] : null;
    
    if (leftWrist && rightWrist && leftWrist.confidence > 0.5 && rightWrist.confidence > 0.5 && audioAnalyzer) {
      let leftX = width - leftWrist.x;
      let rightX = width - rightWrist.x;
      
      const spectrum = audioAnalyzer.getValue();
      
      // Use oscilloscope shapes instead of circles - LEFT HAND
      push();
      translate(leftX, leftWrist.y);
      
      let handScale = flashIntensity * 120; // Growing multiplier
      
      stroke(255, 150, 255, 160 * flashIntensity);
      strokeWeight(2 * flashIntensity);
      noFill();
      
      beginShape();
      for (let i = 0; i < spectrum.length; i += 3) {
        let angle = map(i, 0, spectrum.length, 0, TWO_PI);
        let intensity = (spectrum[i] + 100) / 100;
        let radius = intensity * handScale;
        
        let x = cos(angle) * radius;
        let y = sin(angle) * radius;
        
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Secondary oscilloscope pattern
      stroke(255, 200, 255, 120 * flashIntensity);
      strokeWeight(1.5 * flashIntensity);
      beginShape();
      for (let i = 0; i < spectrum.length; i += 6) {
        let angle = map(i, 0, spectrum.length, 0, TWO_PI);
        let intensity = (spectrum[i] + 100) / 100;
        let radius = intensity * handScale * 1.5;
        
        let x = cos(angle) * radius;
        let y = sin(angle) * radius;
        
        vertex(x, y);
      }
      endShape();
      pop();
      
      // Use oscilloscope shapes instead of circles - RIGHT HAND
      push();
      translate(rightX, rightWrist.y);
      
      stroke(255, 150, 255, 160 * flashIntensity);
      strokeWeight(2 * flashIntensity);
      noFill();
      
      beginShape();
      for (let i = 0; i < spectrum.length; i += 3) {
        let angle = map(i, 0, spectrum.length, 0, TWO_PI);
        let intensity = (spectrum[i] + 100) / 100;
        let radius = intensity * handScale;
        
        let x = cos(angle) * radius;
        let y = sin(angle) * radius;
        
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Secondary oscilloscope pattern
      stroke(255, 200, 255, 120 * flashIntensity);
      strokeWeight(1.5 * flashIntensity);
      beginShape();
      for (let i = 0; i < spectrum.length; i += 6) {
        let angle = map(i, 0, spectrum.length, 0, TWO_PI);
        let intensity = (spectrum[i] + 100) / 100;
        let radius = intensity * handScale * 1.5;
        
        let x = cos(angle) * radius;
        let y = sin(angle) * radius;
        
        vertex(x, y);
      }
      endShape();
      pop();
      
      // Add sparkle effect with smaller oscilloscope patterns
      for (let i = 0; i < 4; i++) {
        let sparkleX = leftX + random(-60, 60) * flashIntensity;
        let sparkleY = leftWrist.y + random(-60, 60) * flashIntensity;
        
        push();
        translate(sparkleX, sparkleY);
        stroke(255, 255, 255, 120 * flashIntensity);
        strokeWeight(0.8 * flashIntensity);
        noFill();
        
        let miniScale = handScale * 0.15;
        beginShape();
        for (let j = 0; j < spectrum.length; j += 8) {
          let angle = map(j, 0, spectrum.length, 0, TWO_PI);
          let intensity = (spectrum[j] + 100) / 100;
          let radius = intensity * miniScale;
          
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          vertex(x, y);
        }
        endShape(CLOSE);
        pop();
        
        // Same for right hand
        sparkleX = rightX + random(-60, 60) * flashIntensity;
        sparkleY = rightWrist.y + random(-60, 60) * flashIntensity;
        
        push();
        translate(sparkleX, sparkleY);
        stroke(255, 255, 255, 120 * flashIntensity);
        strokeWeight(0.8 * flashIntensity);
        noFill();
        
        beginShape();
        for (let j = 0; j < spectrum.length; j += 8) {
          let angle = map(j, 0, spectrum.length, 0, TWO_PI);
          let intensity = (spectrum[j] + 100) / 100;
          let radius = intensity * miniScale;
          
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          vertex(x, y);
        }
        endShape(CLOSE);
        pop();
      }
    }
    pop();
  }
}

// NEW: Draw pose encouragement overlay (State 2) - MINIMAL and GLITCHY with BOUNDING BOX sizing and CENTERED positioning
function drawPoseEncouragement() {
  if (currentState !== 2 || !njPoseImage) return;
  
  // Wait 30 seconds before showing (to match state 2 timing)
  const elapsed = millis() - stateStartTime;
  if (elapsed < 30000) return;
  
  // Reduced blinking frequency - 10% chance to show each frame
  let shouldShow = random() < 0.1;
  if (!shouldShow) return;
  
  // Get current pose for overlay positioning
  if (poses.length > 0 && blobTrackingActive) {
    const pose = poses[0];
    const leftShoulder = pose.keypoints[11];
    const rightShoulder = pose.keypoints[12];
    const leftHip = pose.keypoints[23];
    const rightHip = pose.keypoints[24];
    
    if (leftShoulder && rightShoulder && leftHip && rightHip &&
        leftShoulder.confidence > 0.5 && rightShoulder.confidence > 0.5 &&
        leftHip.confidence > 0.5 && rightHip.confidence > 0.5) {
      push();
      
      // FIXED: Use body center instead of nose for better positioning
      const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipCenterX = (leftHip.x + rightHip.x) / 2;
      const hipCenterY = (leftHip.y + rightHip.y) / 2;
      
      const bodyCenterX = (shoulderCenterX + hipCenterX) / 2;
      const bodyCenterY = (shoulderCenterY + hipCenterY) / 2;
      
      // FIXED: Use same precise coordinate conversion as other elements
      const videoScaleX = width / (video ? video.width : width);
      const videoScaleY = height / (video ? video.height : height);
      
      let displayX = width - (bodyCenterX * videoScaleX);
      let displayY = bodyCenterY * videoScaleY;
      
      // FIXED: Size to match blobtracking bounding box
      const boxWidth = bodyBoundingBox.width * videoScaleX;
      const boxHeight = bodyBoundingBox.height * videoScaleY;
      
      // Scale image to fit within bounding box
      const imageAspect = njPoseImage.width / njPoseImage.height;
      const boxAspect = boxWidth / boxHeight;
      
      let finalWidth, finalHeight;
      if (imageAspect > boxAspect) {
        // Image wider than box - fit to width
        finalWidth = boxWidth * 0.8; // Leave some margin
        finalHeight = finalWidth / imageAspect;
      } else {
        // Image taller than box - fit to height  
        finalHeight = boxHeight * 0.8; // Leave some margin
        finalWidth = finalHeight * imageAspect;
      }
      
      // Minimal random offset for glitch
      let glitchX = random(-1, 1);
      let glitchY = random(-1, 1);
      
      translate(displayX + glitchX, displayY + glitchY);
      
      // Minimal opacity variation
      let alpha = 100 + random(-10, 10);
      
      tint(255, 255, 255, alpha); // White tint
      imageMode(CENTER);
      image(njPoseImage, 0, 0, finalWidth, finalHeight);
      
      noTint();
      pop();
    }
  }
}

// Spectral Flow patterns
function drawSpectralFlow(spectrum, visualScale) {
  stroke(255, 180);
  strokeWeight(0.8 + visualScale * 0.003);
  noFill();
  
  let segments = 16;
  
  for (let seg = 0; seg < segments; seg++) {
    let startIdx = Math.floor((spectrum.length / segments) * seg);
    let endIdx = Math.floor((spectrum.length / segments) * (seg + 1));
    
    let gestureInfluence = (armStretchSmooth + motionAmountSmooth + Math.abs(handHeightSmooth)) / 3;
    let rotationSpeed = 1 + gestureInfluence * 2;
    let complexityMod = 1 + palmDirection * 0.3;
    
    stroke(255, 180);
    strokeWeight(0.8 + visualScale * 0.003);
    
    beginShape();
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
      
      vertex(x, y);
    }
    endShape();
    
    if (seg < segments - 1) {
      stroke(255, 40);
      strokeWeight(0.2);
      let angle1 = map(seg, 0, segments, 0, TWO_PI);
      let angle2 = map(seg + 1, 0, segments, 0, TWO_PI);
      let r = visualScale * 30;
      line(cos(angle1) * r, sin(angle1) * r, cos(angle2) * r, sin(angle2) * r);
    }
  }
  
  // NEW: Add pink line overlay when New Jeans is playing
  if (popHookActive) {
    stroke(255, 100, 255, 120);
    strokeWeight(1.5);
    noFill();
    
    beginShape();
    for (let i = 0; i < spectrum.length; i += 2) {
      let angle = map(i, 0, spectrum.length, 0, TWO_PI);
      let intensity = (spectrum[i] + 100) / 100;
      let radius = intensity * visualScale * 80;
      
      let x = cos(angle) * radius;
      let y = sin(angle) * radius;
      
      vertex(x, y);
    }
    endShape(CLOSE);
  }
}

// UPDATED: Audio filters with glitch beat volume reduction during New Jeans
function updateAudioFilters() {
  if (!audioInitialized || !samplesLoaded) return;
  
  armStretchSmooth = lerp(armStretchSmooth, armStretch, 0.1);
  
  if (motionAmountRaw > motionAmountSmooth) {
    motionAmountSmooth = lerp(motionAmountSmooth, motionAmountRaw, 0.3);
  } else {
    motionAmountSmooth = lerp(motionAmountSmooth, motionAmountRaw, motionDecayRate);
  }
  
  hipMotionSmooth = lerp(hipMotionSmooth, hipMotionAmount, 0.3);
  
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
  
  // ENHANCED: Dynamic glitch beat with NEW JEANS volume reduction and SMOOTH fade-in
  const baseGlitchVol = map(palmDirection, 0, 1, 3, 9);
  const motionBoost = map(motionAmountSmooth, 0, 0.5, 0, 3);
  let finalGlitchVol = baseGlitchVol + motionBoost;
  
  // NEW: Reduce glitch beat volume when New Jeans is playing
  if (popHookActive) {
    finalGlitchVol *= 0.3; // Reduce to 30% volume during New Jeans
  }
  
  if (glitchBeat && glitchBeat.loaded) {
    // SMOOTH: Gradual volume changes instead of immediate
    glitchBeat.volume.rampTo(finalGlitchVol, 0.5); // 0.5 second ramp for smoothness
    
    const rateVariation = 1.0 + (motionAmountSmooth * 0.1);
    glitchBeat.playbackRate = rateVariation;
  }
  
  palmFreq = map(palmDirection, 0, 1, 200, 3000);
  palmFilter.frequency.rampTo(palmFreq, 0.8);
  
  // FIXED: Constrain handHeightSmooth to prevent values > 1 from breaking Tone.js
  const constrainedHandHeight = constrain(Math.abs(handHeightSmooth), 0, 1);
  const gateDepth = map(constrainedHandHeight, 0, 1, 0, 0.95);
  const gateRate = map(constrainedHandHeight, 0, 1, 1, 20);
  
  if (stringsGate) {
    stringsGate.depth.rampTo(gateDepth, 0.2);
    stringsGate.frequency.rampTo(gateRate, 0.2);
  }
  
  if (choirGate) {
    choirGate.depth.rampTo(gateDepth, 0.2);
    choirGate.frequency.rampTo(gateRate * 1.5, 0.2);
  }
  
  // FIXED: Hand raise synth triggers
  if (handHeightSmooth > 0.4 && millis() - lastTwinkleTime > 1000) {
    triggerHarmonicHandRaiseSynth();
    lastTwinkleTime = millis();
  }
  
  if (handHeightSmooth > 0.6 && millis() - lastJumpTime > 4000 && !jerseyClubActive) {
    startJerseyClubKick();
    lastJumpTime = millis();
  }
  
  if (jumpAmount > jumpThreshold && millis() - lastJumpTime > 5000 && !isBreakcoreActive) {
    startBreakcore();
    lastJumpTime = millis();
  }
  
  // NEW: Check motion encouragement
  checkMotionEncouragement();
}

// FIXED: Trigger hand raise synth with proper volume and connection - REDUCED KICK
function triggerHarmonicHandRaiseSynth() {
  if (!audioInitialized) return;
  
  const handRangeNormalized = map(handHeightSmooth, 0.4, 1.0, 0.3, 1.0);
  const kickVelocity = constrain(handRangeNormalized, 0.3, 1.0);
  
  const nextOffBeat = Tone.getTransport().nextSubdivision("8n");
  
  Tone.getTransport().schedule((time) => {
    // REDUCED: Much quieter kick trigger for hand raise
    if (kickSampler && kickSampler.loaded) {
      kickSampler.triggerAttackRelease("C1", "16n", time, kickVelocity * 0.2); // Much quieter
    }
    
    // FIXED: Hand raise screech synth trigger
    if (handRaiseSynth && handRaiseSynth.loaded) {
      const currentChord = chordProgression[currentChordIndex % chordProgression.length];
      const harmNote = currentChord[2];
      const screechNote = harmNote.replace('2', '4').replace('3', '4'); // Higher octave for screech
      handRaiseSynth.triggerAttackRelease(screechNote, "8n", time, kickVelocity * 0.8);
      console.log(`🔥 Hand raise screech: ${screechNote} @ velocity ${kickVelocity}`);
    }
  }, nextOffBeat);
}

function startAmbientMusic() {
  if (isPlaying || !samplesLoaded) return;
  isPlaying = true;
  
  console.log("Starting enhanced ambient music with BASS + NOISE intro...");
  if (window.updateStatus) window.updateStatus("Playing");
  
  // ENHANCED INTRO: Start with bass + noise, gradually add instruments
  
  // 1. Bass chords - START IMMEDIATELY with more energetic New Jeans pattern and LONGER SUSTAIN
  Tone.getTransport().scheduleRepeat((time) => {
    const currentChord = chordProgression[currentChordIndex];
    // FIXED: Longer sustained bass with proper scheduling - bass note should continue
    bassSampler.triggerAttackRelease(currentChord[0], "1m", time, 0.9); // Full measure sustain
    
    // Add rhythmic subdivisions for energy but don't override main bass
    Tone.getTransport().schedule((time2) => {
      bassSampler.triggerAttackRelease(currentChord[0], "16n", time2, 0.3); // Quieter accent
    }, time + Tone.Time("8n").toSeconds()); // Offset by 8th note
    
    // Second sustained note later in measure - different chord note for harmony
    Tone.getTransport().schedule((time3) => {
      bassSampler.triggerAttackRelease(currentChord[1], "2n", time3, 0.5); // Half note sustain, different note
    }, time + Tone.Time("2n").toSeconds()); // Start at half note
    
    currentChordIndex = (currentChordIndex + 1) % chordProgression.length;
  }, "1m"); // Every measure for consistent bass presence
  
  // 2. START NOISE LOOP IMMEDIATELY with bass but quiet, then ramp up
  if (sidechainedNoise && sidechainedNoise.loaded) {
    sidechainedNoise.volume.value = -50; // Start very quiet
    sidechainedNoise.sync().start("0:0:0");
    
    // Gradually ramp up to final volume over 48 seconds
    sidechainedNoise.volume.rampTo(-9, 48);
    console.log("🌊 Noise loop starting with bass, ramping from -50dB to -9dB over 48 seconds");
  }
  
  // 3. Add subtle kick after 8 seconds
  setTimeout(() => {
    if (isPlaying) {
      Tone.getTransport().scheduleRepeat((time) => {
        kickSampler.triggerAttackRelease("C1", "8n", time, 0.3);
      }, "1m");
      console.log("🥁 Added kick after 8 seconds");
    }
  }, 8000);
  
  // 4. Add strings after 16 seconds
  setTimeout(() => {
    if (isPlaying) {
      const stringChords = [
        ["G3", "B3", "D4"],     // G major
        ["E3", "G#3", "B3"],    // E major  
        ["C3", "E3", "G3"],     // C major
        ["D3", "F#3", "A3"]     // D major
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
      console.log("🎻 Added New Jeans-style strings after 16 seconds");
    }
  }, 16000);
  
  // 5. Add fast repeating melodies after 24 seconds
  setTimeout(() => {
    if (isPlaying) {
      let melodyChordIndex = 0;
      
      Tone.getTransport().scheduleRepeat((time) => {
        const currentMelody = repeatingMelodies[melodyChordIndex];
        
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
        
        melodyChordIndex = (melodyChordIndex + 1) % repeatingMelodies.length;
      }, "2m");
      console.log("🎼 Added melodies after 24 seconds");
    }
  }, 24000);
  
  // 6. Add vocal chanting after 32 seconds WITH FADE-IN
  setTimeout(() => {
    if (isPlaying) {
      let chantingChordIndex = 0;
      
      Tone.getTransport().scheduleRepeat((time) => {
        const currentChanting = hymnalChanting[chantingChordIndex];
        
        currentChanting.notes.forEach((note, index) => {
          const chantTime = currentChanting.timings[index];
          
          Tone.getTransport().schedule((scheduleTime) => {
            if (vocalChoirSampler && vocalChoirSampler.loaded) {
              // Gradual fade-in over first 10 seconds of chanting
              const chantStartTime = Tone.getTransport().seconds;
              const fadeProgress = Math.min((chantStartTime - 32) / 10, 1); // 10 second fade-in from chant start
              const fadeVelocity = (0.7 + Math.random() * 0.1) * Math.max(fadeProgress, 0.1);
              
              vocalChoirSampler.triggerAttackRelease(note, "8m", scheduleTime, fadeVelocity);
            }
          }, `+${chantTime * 2.0}`);
        });
        
        chantingChordIndex = (chantingChordIndex + 1) % hymnalChanting.length;
      }, "2m");
      console.log("👥 Added chanting after 32 seconds with fade-in");
    }
  }, 32000);
  
  // 7. Add claps after 40 seconds
  setTimeout(() => {
    if (isPlaying) {
      Tone.getTransport().scheduleRepeat((time) => {
        if (Math.random() > 0.7) {
          clapSampler.triggerAttackRelease("C3", "8n", time, 0.2);
        }
      }, "2n");
      console.log("👏 Added claps after 40 seconds");
    }
  }, 40000);
  
  // 8. Add percussion loop after 48 seconds
  setTimeout(() => {
    if (isPlaying) {
      if (percussionLoop && percussionLoop.loaded) {
        percussionLoop.sync().start(0);
        console.log("🥁 Added percussion loop after 48 seconds");
      }
      
      // Glitch beat with SMOOTH fade-in
      if (glitchBeat && glitchBeat.loaded) {
        glitchBeat.volume.value = -60; // Start silent
        glitchBeat.sync().start("0:0:0");
        
        // Smooth fade in over 8 seconds to final volume of +3dB
        glitchBeat.volume.rampTo(3, 8);
        console.log("🎵 Added glitch beat with 8-second smooth fade-in after 48 seconds");
      }
    }
  }, 48000);
  
  Tone.getTransport().start();
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
    
    // FIXED: Hand raise synth with proper connection
    handRaiseSynth = new Tone.Sampler({
      urls: {
        "C3": samplePaths.handRaise
      },
      volume: -3, // Increased volume
      onload: () => {
        console.log("✓ Hand raise screech synth loaded");
      }
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

// ENHANCED: New Jeans with IMMEDIATE trigger (no quantization delay)
function triggerEnhancedPopHook() {
  if (!popHookSampler || !popHookSampler.loaded || popHookActive) return;
  
  popHookActive = true;
  cleanPhaseActive = false; // Start with effects
  cleanToGranularTransition = false;
  decayStartTime = millis();
  clearMomentTriggered = false;
  newJeansPoseFlashTime = millis();
  
  console.log("🌀 Starting NEW JEANS: IMMEDIATE trigger - Effects → Clean → Decay...");
  
  // IMMEDIATE: Start right away instead of waiting for next measure
  const startTime = Tone.now() + 0.1; // Just a tiny delay for processing
  
  // ENHANCED: Create dual processing chains for seamless blending
  if (!popHookPlayer) {
    // Clean processing chain (direct to master with minimal effects)
    const cleanGain = new Tone.Gain(0).connect(masterGain); // Start silent
    const cleanFilter = new Tone.Filter(8000, "lowpass").connect(cleanGain);
    const cleanCompressor = new Tone.Compressor(-12, 3).connect(cleanFilter);
    
    popHookPlayer = new Tone.Player({
      url: samplePaths.popHook,
      loop: true,
      volume: -3,
      onload: () => {
        console.log("✓ Clean processing chain ready");
      }
    }).connect(cleanCompressor);
    
    // Store references for volume control
    popHookPlayer.cleanGain = cleanGain;
  }
  
  // PHASE 1: Start with granular effects (existing chain) - IMMEDIATE
  if (popHookSampler && popHookSampler.loaded) {
    popHookSampler.loop = true;
    popHookSampler.playbackRate = 1.0;
    popHookSampler.grainSize = 0.25; // Slightly tighter grains
    popHookSampler.volume.value = -3;
    popHookSampler.start(startTime); // IMMEDIATE start
    console.log("🎵 NEW JEANS Phase 1: Starting IMMEDIATELY with enhanced effects");
  }
  
  // Start clean player simultaneously but silent
  if (popHookPlayer && popHookPlayer.loaded) {
    popHookPlayer.start(startTime); // IMMEDIATE start
    console.log("🎵 Clean player started IMMEDIATELY (silent)");
  }
  
  // PHASE 2: After 7 seconds, gradual blend TO clean
  setTimeout(() => {
    if (popHookActive && !cleanPhaseActive) {
      cleanPhaseActive = true;
      
      console.log("🌀 NEW JEANS Phase 2: Seamless blend TO clean...");
      
      // 4-second crossfade for smoother transition
      if (popHookSampler) {
        popHookSampler.volume.rampTo(-25, 4); // Fade effects way down
        popHookSampler.grainSize = 0.15; // Tighter grains for background texture
      }
      
      if (popHookPlayer && popHookPlayer.cleanGain) {
        popHookPlayer.cleanGain.gain.rampTo(1.0, 4); // Fade in clean
        console.log("🎵 NEW JEANS: 4-second blend effects → CLEAN");
      }
      
      // After 6 seconds of clean dominance, start decay blend
      setTimeout(() => {
        if (popHookActive && cleanPhaseActive) {
          cleanPhaseActive = false;
          cleanToGranularTransition = true;
          
          console.log("🌀 NEW JEANS Phase 3: Gradual decay blend...");
          
          // 3-second blend back to effects
          if (popHookPlayer && popHookPlayer.cleanGain) {
            popHookPlayer.cleanGain.gain.rampTo(0, 3);
          }
          
          if (popHookSampler) {
            popHookSampler.volume.rampTo(-3, 3); // Bring effects back up
          }
          
          decayStartTime = millis(); // Reset for decay phase
        }
      }, 6000); // 6 seconds of clean dominance
    }
  }, 7000); // 7 seconds before clean blend
  
  // Schedule the granular decay evolution
  const evolutionInterval = setInterval(() => {
    if (!popHookActive) {
      clearInterval(evolutionInterval);
      return;
    }
    
    // Only decay during the final phase
    if (!cleanToGranularTransition) return;
    
    const elapsed = millis() - decayStartTime;
    const progress = Math.min(elapsed / (decayDuration - 16000), 1.0); // Account for longer phases
    
    // Enhanced decay parameters for better musical progression
    const grainSize = map(progress, 0, 1, 0.15, 0.9);
    const playbackRate = map(progress, 0, 1, 1.0, 0.25);
    let filterFreq = map(progress, 0, 1, 3000, 200); // Wider filter sweep
    const reverbWet = map(progress, 0, 1, 0.2, 0.95);
    const delayFeedback = map(progress, 0, 1, 0.3, 0.85);
    const bitCrushLevel = Math.floor(map(progress, 0, 1, 8, 2));
    
    // Musical hand control over decay
    if (palmDirection > 0.1) {
      const handFilterMod = map(palmDirection, 0, 1, 0.4, 2.5);
      filterFreq *= handFilterMod;
      
      if (Math.abs(handHeightSmooth) > 0.1) {
        const handGrainMod = map(Math.abs(handHeightSmooth), 0, 1, 0.7, 1.8);
        const modifiedGrainSize = grainSize * handGrainMod;
        if (popHookSampler) {
          popHookSampler.grainSize = constrain(modifiedGrainSize, 0.05, 1.2);
        }
      }
    }
    
    // Apply evolving parameters
    if (popHookSampler) {
      popHookSampler.grainSize = grainSize;
      popHookSampler.playbackRate = playbackRate;
    }
    
    if (granularDecaySystem.filter) {
      granularDecaySystem.filter.frequency.rampTo(filterFreq, 1.5);
    }
    if (granularDecaySystem.reverb) {
      granularDecaySystem.reverb.wet.rampTo(reverbWet, 1.5);
    }
    if (granularDecaySystem.delay) {
      granularDecaySystem.delay.feedback.rampTo(delayFeedback, 1.5);
    }
    if (granularDecaySystem.bitCrusher) {
      granularDecaySystem.bitCrusher.bits = bitCrushLevel;
    }
    
    decayVisualIntensity = progress;
    
    console.log(`🌀 Musical decay: ${(progress * 100).toFixed(1)}% - Filter: ${filterFreq.toFixed(0)}Hz`);
    
    if (progress >= 1.0) {
      setTimeout(() => {
        if (popHookSampler) {
          popHookSampler.stop();
        }
        if (popHookPlayer) {
          popHookPlayer.stop();
          if (popHookPlayer.cleanGain) {
            popHookPlayer.cleanGain.dispose();
          }
        }
        popHookActive = false;
        cleanPhaseActive = false;
        cleanToGranularTransition = false;
        decayVisualIntensity = 0;
        console.log("🌀 NEW JEANS complete - musical dissolution");
      }, 3000);
      clearInterval(evolutionInterval);
    }
    
  }, 800); // Slightly faster updates for smoother evolution
}

function startBreakcore() {
  if (isBreakcoreActive || !samplesLoaded || !breakcoreKick || !breakcoreKick.loaded) {
    return;
  }
  
  isBreakcoreActive = true;
  breakcoreStartTime = millis();
  
  console.log("🔥 QUANTIZED GABBER BREAKCORE ACTIVATED!");
  
  // QUANTIZED: Wait for next measure boundary (125 BPM = 1.92s per measure)
  const nextMeasure = Tone.getTransport().nextSubdivision("1m");
  
  Tone.getTransport().schedule((time) => {
    // Gabber pattern quantized to 16th notes at 125 BPM
    const breakcorePattern = [
      "0:0:0", "0:0:1", "0:0:2", "0:1:0", "0:1:2", "0:1:3", "0:2:0", "0:2:1", 
      "0:2:3", "0:3:0", "0:3:1", "0:3:2", "0:3:3",
      "1:0:0", "1:0:1", "1:0:3", "1:1:0", "1:1:1", "1:1:3", "1:2:0", "1:2:2", 
      "1:2:3", "1:3:0", "1:3:2", "1:3:3",
      "2:0:0", "2:0:2", "2:1:0", "2:1:1", "2:1:3", "2:2:0", "2:2:1", "2:2:2", 
      "2:3:0", "2:3:1", "2:3:3",
      "3:0:0", "3:0:1", "3:0:2", "3:0:3", "3:1:0", "3:1:2", "3:2:0", "3:2:3", 
      "3:3:0", "3:3:2"
    ];
    
    breakcorePattern.forEach(beatTime => {
      const scheduleTime = time + Tone.Time(beatTime).toSeconds();
      Tone.getTransport().schedule((triggerTime) => {
        if (breakcoreKick && breakcoreKick.loaded && isBreakcoreActive) {
          // Volume envelope to blend better with base track
          const velocity = 0.6; // Reduced from 0.9 to blend better
          breakcoreKick.triggerAttackRelease("C1", "32n", triggerTime, velocity);
        }
      }, scheduleTime);
    });
    
    console.log("🔥 Quantized gabber pattern scheduled over 4 measures");
    
  }, nextMeasure);
  
  // End after exactly 4 measures
  setTimeout(() => {
    isBreakcoreActive = false;
    console.log("Quantized gabber breakcore ended");
  }, Tone.Time("4m").toSeconds() * 1000);
}

// FIXED: Jersey club with proper bass notes and timing
function startJerseyClubKick() {
  if (jerseyClubActive || !kickSampler || !kickSampler.loaded) return;
  
  jerseyClubActive = true;
  jerseyClubStartTime = millis();
  
  console.log("🏀 FIXED JERSEY CLUB KICK PATTERN!");
  
  // QUANTIZED: Wait for next measure boundary and ensure it's on beat
  const nextMeasure = Tone.getTransport().nextSubdivision("1m");
  
  Tone.getTransport().schedule((time) => {
    // FIXED: Jersey club pattern with proper timing and bass notes
    const jerseyPattern = [
      {time: "0:0:0", note: "C1", velocity: 1.0},
      {time: "0:1:0", note: "C1", velocity: 0.8},
      {time: "0:2:0", note: "F1", velocity: 1.0},
      {time: "0:3:0", note: "C1", velocity: 0.9},
      {time: "1:0:0", note: "G1", velocity: 1.0},
      {time: "1:1:2", note: "C1", velocity: 0.7},
      {time: "1:2:0", note: "F1", velocity: 0.9},
      {time: "1:3:2", note: "G1", velocity: 0.8}
    ];
    
    jerseyPattern.forEach(beat => {
      const scheduleTime = time + Tone.Time(beat.time).toSeconds();
      Tone.getTransport().schedule((triggerTime) => {
        if (kickSampler && kickSampler.loaded && jerseyClubActive) {
          kickSampler.triggerAttackRelease(beat.note, "16n", triggerTime, beat.velocity);
          console.log(`🏀 Jersey club kick: ${beat.note} @ ${beat.velocity} volume`);
        }
      }, scheduleTime);
    });
    
    console.log("🏀 FIXED Jersey club pattern scheduled over 2 measures");
    
  }, nextMeasure);
  
  // End after exactly 2 measures
  setTimeout(() => {
    jerseyClubActive = false;
    console.log("Jersey club kick ended");
  }, Tone.Time("2m").toSeconds() * 1000);
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

// State 3: Amplified hand patterns - THINNER AND DARKER to match primary
function drawEnhancedSubtleHandPattern(centerX, centerY, visualScale, reflect = false, colorOverride = null) {
  if (!audioAnalyzer) return;
  
  push();
  translate(centerX, centerY);
  rotate(bodyRotation);
  if (reflect) scale(-1, 1);
  
  const spectrum = audioAnalyzer.getValue();
  
  let handColor = colorOverride || (popHookActive ? [255, 100, 255] : [255, 255, 255]);
  
  // State 3: Amplify hand patterns
  let amplification = 1;
  if (currentState === 3) {
    amplification = 1.4 + sin(millis() * 0.01) * 0.3;
  }
  
  // UPDATED: Thinner and darker to match primary oscilloscope
  stroke(handColor[0], handColor[1], handColor[2], 100 * amplification); // Reduced opacity
  strokeWeight((0.6 + visualScale * 0.002) * amplification); // Thinner
  noFill();
  
  // Main pattern
  beginShape();
  for (let i = 0; i < spectrum.length; i += 3) {
    let angle = map(i, 0, spectrum.length, 0, TWO_PI);
    let intensity = (spectrum[i] + 100) / 100;
    let radius = intensity * visualScale * 60 * amplification;
    
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    
    vertex(x, y);
  }
  endShape(CLOSE);
  
  // Secondary pattern with New Jeans pink tint during decay
  if (popHookActive) {
    stroke(255, 100, 255, 80 * amplification); // Darker
  } else {
    stroke(handColor[0], handColor[1], handColor[2], 60 * amplification); // Darker
  }
  strokeWeight(0.5 * amplification); // Thinner
  beginShape();
  for (let i = 0; i < spectrum.length; i += 6) {
    let angle = map(i, 0, spectrum.length, 0, TWO_PI);
    let intensity = (spectrum[i] + 100) / 100;
    let radius = intensity * visualScale * 90 * amplification;
    
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    
    vertex(x, y);
  }
  endShape();
  
  pop();
}

// FIXED: Blob tracking with consistent coordinate system - MORE VISIBLE
function drawBlobTracking() {
  if (!blobTrackingActive) return;
  
  push();
  
  // FIXED: Apply precise coordinate conversion
  const videoScaleX = width / (video ? video.width : width);
  const videoScaleY = height / (video ? video.height : height);
  
  let mirroredBox = {
    x: width - ((bodyBoundingBox.x + bodyBoundingBox.width) * videoScaleX),
    y: bodyBoundingBox.y * videoScaleY,
    width: bodyBoundingBox.width * videoScaleX,
    height: bodyBoundingBox.height * videoScaleY
  };
  
  stroke(180, 180, 180, 120); // More visible (was 60)
  strokeWeight(0.8); // Thicker (was 0.3)
  noFill();
  
  let glitchOffset = sin(millis() * 0.02) * 1.5;
  rect(mirroredBox.x + glitchOffset, mirroredBox.y, mirroredBox.width, mirroredBox.height);
  
  strokeWeight(1.2); // Thicker corners (was 0.5)
  let cornerSize = 12; // Larger corners (was 8)
  
  // Corner brackets - more visible
  stroke(200, 200, 200, 150);
  
  line(mirroredBox.x, mirroredBox.y, mirroredBox.x + cornerSize, mirroredBox.y);
  line(mirroredBox.x, mirroredBox.y, mirroredBox.x, mirroredBox.y + cornerSize);
  
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y, mirroredBox.x + mirroredBox.width - cornerSize, mirroredBox.y);
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y, mirroredBox.x + mirroredBox.width, mirroredBox.y + cornerSize);
  
  line(mirroredBox.x, mirroredBox.y + mirroredBox.height, mirroredBox.x + cornerSize, mirroredBox.y + mirroredBox.height);
  line(mirroredBox.x, mirroredBox.y + mirroredBox.height, mirroredBox.x, mirroredBox.y + mirroredBox.height - cornerSize);
  
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height, mirroredBox.x + mirroredBox.width - cornerSize, mirroredBox.y + mirroredBox.height);
  line(mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height, mirroredBox.x + mirroredBox.width, mirroredBox.y + mirroredBox.height - cornerSize);
  
  pop();
}

// Main draw function continuation in next part would include the main draw loop with the 2.5x multiplier:
// let centralVisualScale = visualScale * 2.5; // 2.5x multiplier for prominence
// drawOscilloscopePattern(bodyCenterSmooth.x, bodyCenterSmooth.y, centralVisualScale);

// Calculate hip motion for body aura visualization
function calculateHipMotion(pose) {
  const leftHip = pose.keypoints[23];
  const rightHip = pose.keypoints[24];
  
  if (leftHip && rightHip && leftHip.confidence > 0.3 && rightHip.confidence > 0.3) {
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    
    if (previousHipPosition.x === 0 && previousHipPosition.y === 0) {
      previousHipPosition = {x: hipCenterX, y: hipCenterY};
      return 0;
    }
    
    const hipMovement = dist(hipCenterX, hipCenterY, previousHipPosition.x, previousHipPosition.y);
    previousHipPosition = {x: hipCenterX, y: hipCenterY};
    
    const normalizedMovement = constrain(hipMovement / 15, 0, 1);
    
    if (frameCount % 30 === 0) {
      console.log(`🔥 Hip motion DEBUG: raw=${hipMovement.toFixed(1)}px, normalized=${normalizedMovement.toFixed(3)}, smooth=${hipMotionSmooth.toFixed(3)}`);
    }
    
    return normalizedMovement;
  }
  
  return 0;
}

function calculateJumpAmount(pose) {
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  const leftHip = pose.keypoints[23];
  const rightHip = pose.keypoints[24];
  const nose = pose.keypoints[0];
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  const leftAnkle = pose.keypoints[27];
  const rightAnkle = pose.keypoints[28];
  
  if (leftShoulder && rightShoulder && leftHip && rightHip &&
      leftShoulder.confidence > 0.7 && rightShoulder.confidence > 0.7 &&
      leftHip.confidence > 0.7 && rightHip.confidence > 0.7) {
    
    const margin = 200;
    const criticalBodyParts = [leftShoulder, rightShoulder, leftHip, rightHip, nose];
    
    if (!leftWrist || leftWrist.confidence < 0.5) return jumpAmount * 0.5;
    if (!rightWrist || rightWrist.confidence < 0.5) return jumpAmount * 0.5;
    if (!leftAnkle || leftAnkle.confidence < 0.4) return jumpAmount * 0.5;
    if (!rightAnkle || rightAnkle.confidence < 0.4) return jumpAmount * 0.5;
    
    criticalBodyParts.push(leftWrist, rightWrist, leftAnkle, rightAnkle);
    
    for (let part of criticalBodyParts) {
      if (part.x < margin || part.x > width - margin || 
          part.y < margin || part.y > height - margin) {
        return jumpAmount * 0.6;
      }
    }
    
    if (!nose || nose.confidence < 0.6 || 
        nose.x < margin || nose.x > width - margin || 
        nose.y < margin || nose.y > height - margin) {
      return jumpAmount * 0.6;
    }
    
    const bodyCenterY = ((leftShoulder.y + rightShoulder.y) / 2 + (leftHip.y + rightHip.y) / 2) / 2;
    
    if (baselineBodyY === 0) {
      baselineBodyY = bodyCenterY;
      return 0;
    }
    
    baselineBodyY = lerp(baselineBodyY, bodyCenterY, 0.001);
    
    const elevation = baselineBodyY - bodyCenterY;
    const normalizedElevation = elevation / 200;
    
    jumpHistory.push(Math.max(0, normalizedElevation));
    if (jumpHistory.length > 30) {
      jumpHistory.shift();
    }
    
    const avgElevation = jumpHistory.reduce((sum, val) => sum + val, 0) / jumpHistory.length;
    
    const minJumpThreshold = 0.6;
    if (avgElevation < minJumpThreshold) {
      return 0;
    }
    
    const recentElevations = jumpHistory.slice(-10);
    const sustainedElevation = recentElevations.every(e => e > 0.4);
    
    if (!sustainedElevation) {
      return avgElevation * 0.3;
    }
    
    const leftHandElevation = leftShoulder.y - leftWrist.y;
    const rightHandElevation = rightShoulder.y - rightWrist.y;
    const avgHandElevation = (leftHandElevation + rightHandElevation) / 2;
    
    if (avgHandElevation < 50) {
      return avgElevation * 0.4;
    }
    
    if (frameCount % 60 === 0) {
      console.log(`ULTRA STRICT Jump: elevation=${elevation.toFixed(1)}, avg=${avgElevation.toFixed(3)}, sustained=${sustainedElevation}`);
    }
    
    return constrain(avgElevation, 0, 1);
  }
  
  return jumpAmount * 0.6;
}

// FIXED: Consistent coordinate system for all elements
function calculateArmStretch(pose) {
  const leftShoulder = pose.keypoints[11];
  const rightShoulder = pose.keypoints[12];
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  
  if (leftShoulder && rightShoulder && leftWrist && rightWrist &&
      leftShoulder.confidence > 0.5 && rightShoulder.confidence > 0.5 &&
      leftWrist.confidence > 0.5 && rightWrist.confidence > 0.5) {
    
    // FIXED: Store body center in raw video coordinates only
    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const centerY = (leftShoulder.y + rightShoulder.y) / 2;
    
    bodyCenter = {x: centerX, y: centerY};
    
    // Smooth the raw coordinates
    bodyCenterSmooth.x = lerp(bodyCenterSmooth.x, centerX, 0.15);
    bodyCenterSmooth.y = lerp(bodyCenterSmooth.y, centerY, 0.15);
    
    bodyRotation = atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
    
    const leftDistance = dist(centerX, centerY, leftWrist.x, leftWrist.y);
    const rightDistance = dist(centerX, centerY, rightWrist.x, rightWrist.y);
    const avgDistance = (leftDistance + rightDistance) / 2;
    
    const shoulderWidth = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
    const normalizedDistance = avgDistance / (shoulderWidth * 1.8);
    
    handDistance = dist(leftWrist.x, leftWrist.y, rightWrist.x, rightWrist.y);
    handDistanceSmooth = lerp(handDistanceSmooth, handDistance, 0.1);
    
    return constrain(normalizedDistance, 0, 1);
  }
  
  return armStretch;
}

// FIXED: Hand height calculation with arms-hanging-down as neutral axis
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
    
    // FIXED: Calculate neutral position as arms hanging straight down from shoulders
    const leftShoulderY = leftShoulder.y;
    const rightShoulderY = rightShoulder.y;
    const leftWristY = leftWrist.y;
    const rightWristY = rightWrist.y;
    
    // Calculate arm length for reference (from shoulder to hanging position)
    const estimatedArmLength = bodyHeight * 0.7; // Arms are roughly 70% of torso height
    
    // Neutral position would be shoulder + arm length (hanging straight down)
    const leftNeutralY = leftShoulderY + estimatedArmLength;
    const rightNeutralY = rightShoulderY + estimatedArmLength;
    
    // Calculate deviation from neutral (negative = hands above neutral, positive = below)
    const leftHandDeviation = leftWristY - leftNeutralY;
    const rightHandDeviation = rightWristY - rightNeutralY;
    const avgHandDeviation = (leftHandDeviation + rightHandDeviation) / 2;
    
    // Apply distance scaling and normalize
    const handHeightRaw = -avgHandDeviation * distanceScale; // Negative because up should be positive
    
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
  
  // FIXED: Focus on major body points, excluding hands to reduce hand movement dominance
  const majorBodyPoints = [11, 12, 23, 24, 0]; // shoulders, hips, nose - no hands
  
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
  
  // FIXED: Much less sensitive motion detection - should read close to 0 when still
  const rawMotion = avgMotion / 50; // Increased divisor significantly to reduce sensitivity
  motionAmountRaw = constrain(rawMotion, 0, 1);
  
  // Establish baseline when first entering (State 1)
  if (currentState === 1 && motionHistory.length < 30) {
    // During first 30 frames in state 1, establish baseline
    return 0; // Return 0 during calibration
  }
  
  return motionAmountRaw;
}

// NEW: Check if motion encouragement threshold is met
function checkMotionEncouragement() {
  if (!motionEncouragementActive) return;
  
  const currentMotionLevel = motionAverage + hipMotionSmooth;
  const motionIncrease = currentMotionLevel - baselineMotionLevel;
  
  // FIXED: Threshold requires actual motion increase of 30%
  if (motionIncrease > baselineMotionLevel * 0.3 && currentMotionLevel > 0.1) {
    motionThresholdMet = true;
    setTimeout(() => {
      motionEncouragementActive = false;
      console.log("🎉 Motion threshold met! Encouragement deactivated.");
    }, 2000); // Show success for 2 seconds before hiding
  }
}

// Enhanced hand-to-hand connection
function drawHandToHandConnection(leftHandX, leftHandY, rightHandX, rightHandY) {
  if (!audioAnalyzer || !leftHandX || !leftHandY || !rightHandX || !rightHandY) return;
  
  const spectrum = audioAnalyzer.getValue();
  
  const distance = dist(leftHandX, leftHandY, rightHandX, rightHandY);
  const normalizedDistance = map(distance, 100, 500, 1, 0.4);
  const intensity = constrain(normalizedDistance, 0.4, 1);
  
  let connectionColor;
  if (handHeightSmooth > 0.1) {
    const redIntensity = map(handHeightSmooth, 0.1, 1, 0.1, 0.3);
    connectionColor = [255, 255 - (redIntensity * 50), 255 - (redIntensity * 50)];
  } else if (handHeightSmooth < -0.1) {
    const blueIntensity = map(Math.abs(handHeightSmooth), 0.1, 1, 0.1, 0.3);
    connectionColor = [255 - (blueIntensity * 50), 255 - (blueIntensity * 50), 255];
  } else {
    connectionColor = [255, 255, 255];
  }
  
  // State 3: Amplify connection during NJ pose completion
  let amplificationFactor = 1;
  if (currentState === 3) {
    amplificationFactor = 1.5 + sin(millis() * 0.01) * 0.3;
  }
  
  const numThreads = Math.floor(map(intensity, 0.4, 1, 3, 12) * amplificationFactor);
  
  for (let thread = 0; thread < numThreads; thread++) {
    stroke(connectionColor[0], connectionColor[1], connectionColor[2], 255);
    strokeWeight(map(intensity, 0.4, 1, 1, 6) * amplificationFactor);
    
    let segments = 12;
    let prevX = leftHandX;
    let prevY = leftHandY;
    
    for (let i = 1; i <= segments; i++) {
      let progress = i / segments;
      let baseX = lerp(leftHandX, rightHandX, progress);
      let baseY = lerp(leftHandY, rightHandY, progress);
      
      let specIndex = Math.floor(map(progress, 0, 1, 0, spectrum.length - 1));
      let audioIntensity = (spectrum[specIndex] + 100) / 100;
      
      let waveformAmount = intensity * audioIntensity * 15 * amplificationFactor;
      let waveOffset = sin(progress * PI * 3 + millis() * 0.008 + thread * 0.3) * waveformAmount;
      
      let convergenceMultiplier = sin(progress * PI);
      let maxSpread = intensity * 6 * convergenceMultiplier * amplificationFactor;
      
      let angle = atan2(rightHandY - leftHandY, rightHandX - leftHandX) + PI/2;
      let threadOffset = (thread - (numThreads / 2)) * map(convergenceMultiplier, 0, 1, 1, maxSpread);
      
      let x = baseX + cos(angle) * threadOffset + sin(progress * PI * 4) * waveOffset;
      let y = baseY + sin(angle) * threadOffset + cos(progress * PI * 4) * waveOffset;
      
      line(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }
  }
}

// FIXED: Main oscilloscope pattern with PRECISE coordinate alignment
function drawOscilloscopePattern(centerX, centerY, visualScale) {
  if (!audioAnalyzer) return;
  
  push();
  // FIXED: Precise coordinate conversion accounting for video scaling
  const videoScaleX = width / (video ? video.width : width);
  const videoScaleY = height / (video ? video.height : height);
  
  let displayX = width - (centerX * videoScaleX);
  let displayY = centerY * videoScaleY;
  
  translate(displayX, displayY);
  rotate(bodyRotation);
  scale(-1, 1); // Horizontal flip to match video
  
  const spectrum = audioAnalyzer.getValue();
  
  // Use spectral flow instead of simple oscilloscope
  drawSpectralFlow(spectrum, visualScale);
  
  pop();
}

function drawOscilloscopePatternToBuffer(buffer, centerX, centerY, visualScale) {
  if (!audioAnalyzer) return;
  
  buffer.push();
  // FIXED: Precise coordinate conversion accounting for video scaling
  const videoScaleX = width / (video ? video.width : width);
  const videoScaleY = height / (video ? video.height : height);
  
  let displayX = width - (centerX * videoScaleX);
  let displayY = centerY * videoScaleY;
  
  buffer.translate(displayX, displayY);
  buffer.rotate(bodyRotation);
  buffer.scale(-1, 1); // Horizontal flip to match video
  
  const spectrum = audioAnalyzer.getValue();
  
  // Use spectral flow to buffer instead of simple oscilloscope
  drawSpectralFlowToBuffer(buffer, spectrum, visualScale);
  
  buffer.pop();
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

// Hip motion body aura visualization
function drawHipMotionAura(centerX, centerY) {
  if (!audioAnalyzer || hipMotionSmooth < 0.02) return;
  
  const spectrum = audioAnalyzer.getValue();
  
  push();
  translate(centerX, centerY);
  
  const auraIntensity = hipMotionSmooth;
  const auraSize = map(auraIntensity, 0, 1, 80, 200);
  
  stroke(255, 150, 100, 150 * auraIntensity);
  strokeWeight(2 + auraIntensity * 3);
  noFill();
  
  // Left parenthesis
  beginShape();
  for (let angle = PI * 0.2; angle < PI * 1.8; angle += 0.15) {
    let r = auraSize;
    
    let specIndex = Math.floor(map(angle, 0, TWO_PI, 0, spectrum.length - 1));
    let audioDistortion = (spectrum[specIndex] + 100) / 100 * auraIntensity * 20;
    
    r += sin(angle * 3 + millis() * 0.008) * audioDistortion;
    
    let x = cos(angle) * r - auraSize * 0.4;
    let y = sin(angle) * r;
    
    vertex(x, y);
  }
  endShape();
  
  // Right parenthesis
  beginShape();
  for (let angle = -PI * 0.8; angle < PI * 0.8; angle += 0.15) {
    let r = auraSize;
    
    let specIndex = Math.floor(map(angle + PI, 0, TWO_PI, 0, spectrum.length - 1));
    let audioDistortion = (spectrum[specIndex] + 100) / 100 * auraIntensity * 20;
    
    r += sin(angle * 3 + millis() * 0.008 + PI) * audioDistortion;
    
    let x = cos(angle) * r + auraSize * 0.4;
    let y = sin(angle) * r;
    
    vertex(x, y);
  }
  endShape();
  
  // Multiple inner oscilloscope rings
  for (let ring = 0; ring < 4; ring++) {
    stroke(255, 100, 150, 120 * auraIntensity);
    strokeWeight(1.5 + ring * 0.3);
    
    beginShape();
    for (let angle = 0; angle < TWO_PI; angle += 0.3) {
      let r = auraSize * (0.3 + ring * 0.15);
      
      let specIndex = Math.floor(map(angle, 0, TWO_PI, 0, spectrum.length - 1));
      let audioWave = (spectrum[specIndex] + 100) / 100 * auraIntensity * 12;
      
      r += sin(angle * 5 + millis() * 0.01 + ring * PI) * audioWave;
      
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      
      vertex(x, y);
    }
    endShape(CLOSE);
  }
  
  // Debug indicator
  fill(255, 150, 100, 200 * auraIntensity);
  noStroke();
  ellipse(0, -auraSize - 20, 8, 8);
  fill(255);
  textAlign(CENTER);
  textSize(8);
  text(`${(hipMotionAmount * 100).toFixed(0)}%`, 0, -auraSize - 35);
  
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

// NEW: Draw motion encouragement indicator (State 4) - MINIMAL and left-justified
function drawMotionEncouragement() {
  if (currentState !== 4) return;
  
  // Position left-justified 
  let leftX = 40;
  let topY = 80;
  
  push();
  
  if (motionThresholdMet) {
    // Success state - minimal
    fill(100, 255, 100, 200);
    textAlign(LEFT);
    textSize(16);
    text("✓ good", leftX, topY);
  } else {
    // Encouragement state - minimal lowercase
    fill(255, 255, 255, 200);
    textAlign(LEFT);
    textSize(16); // Smaller, minimal
    text("motion", leftX, topY);
    
    // Two small animated arrows to the left
    let arrowX = leftX - 25;
    let arrowY = topY - 8;
    let animOffset = sin(millis() * 0.015) * 3; // Smaller animation
    
    stroke(100, 255, 100, 200);
    strokeWeight(1.5); // Thinner
    noFill();
    
    // Two small arrows
    for (let i = 0; i < 2; i++) {
      let currentArrowX = arrowX - (i * 8);
      let currentY = arrowY + animOffset;
      
      // Small arrow shaft
      line(currentArrowX, currentY + 6, currentArrowX, currentY - 4);
      
      // Small arrow head
      line(currentArrowX, currentY - 4, currentArrowX - 2, currentY - 1);
      line(currentArrowX, currentY - 4, currentArrowX + 2, currentY - 1);
    }
  }
  
  pop();
}

// NEW: State-specific visual overlays
function drawStateOverlays() {
  // State 0: Grayscale overlay for intro screen
  // State 0: Dark overlay for intro screen (no bright static)
if (currentState === 0) {
  push();
  fill(0, 0, 0, 120); // Same dark overlay as when no poses detected
  rect(0, 0, width, height);
  pop();
}
  
  // State 6: Final decay with minimal static effects
  if (currentState === 6) {
    let elapsed = millis() - stateStartTime;
    let decayProgress = elapsed / 20000; // 20 seconds
    
    push();
    // Increasing static as decay progresses
    let staticAmount = Math.floor(decayProgress * 100);
    for (let i = 0; i < staticAmount; i++) {
      let x = random(width);
      let y = random(height);
      let brightness = random(50, 150);
      fill(brightness, brightness, brightness, 60);
      noStroke();
      ellipse(x, y, 1, 1);
    }
    
    // Fade to grayscale
    fill(0, 0, 0, decayProgress * 120);
    rect(0, 0, width, height);
    pop();
  }
}

function drawDecayVisualization(centerX, centerY, visualScale) {
  if (!popHookActive || decayVisualIntensity === 0) return;
  
  push();
  translate(centerX, centerY);
  
  let stretchFactor = 1 + (decayVisualIntensity * 2);
  p5.prototype.scale.call(this, stretchFactor, 1);
  
  stroke(255, 100, 255, 50 * decayVisualIntensity);
  strokeWeight(0.5);
  
  for (let i = 0; i < 20 * decayVisualIntensity; i++) {
    let x = random(-200, 200);
    let y = random(-200, 200);
    let size = random(1, 5) * decayVisualIntensity;
    point(x, y);
  }
  
  if (decayVisualIntensity > 0.3) {
    strokeWeight(0.8);
    for (let i = 0; i < 15 * decayVisualIntensity; i++) {
      let x1 = random(-300, 300);
      let y1 = random(-300, 300);
      let x2 = x1 + random(-30, 30);
      let y2 = y1 + random(-30, 30);
      stroke(255, 100, 255, 80 * decayVisualIntensity);
      line(x1, y1, x2, y2);
    }
  }
  
  if (decayVisualIntensity > 0.5) {
    fill(255, 255, 255, 40 * decayVisualIntensity);
    noStroke();
    for (let i = 0; i < 30; i++) {
      let snowX = random(-400, 400);
      let snowY = random(-400, 400);
      ellipse(snowX, snowY, 2, 2);
    }
  }
  
  pop();
}

// UPDATED: Minimal meters to show state system
function drawMinimalMeters() {
  // Initialize variables if they don't exist
  if (typeof armStretchSmooth === 'undefined') armStretchSmooth = 0;
  if (typeof motionAverage === 'undefined') motionAverage = 0;
  if (typeof hipMotionSmooth === 'undefined') hipMotionSmooth = 0;
  if (typeof handHeightSmooth === 'undefined') handHeightSmooth = 0;
  if (typeof palmDirection === 'undefined') palmDirection = 0;
  if (typeof jumpAmount === 'undefined') jumpAmount = 0;
  
  let meterX = 20;
  let meterY = 80;
  let meterWidth = 180;
  let meterHeight = 6;
  let spacing = 16;
  
  textSize(8);
  textAlign(LEFT);
  
  try {
    // Arm Stretch
    stroke(255, 100, 100, 120);
    strokeWeight(1);
    noFill();
    rect(meterX, meterY, meterWidth, meterHeight);
    
    if (armStretchSmooth > 0.01) {
      stroke(255, 100, 100, 200);
      strokeWeight(2);
      line(meterX + 1, meterY + 3, meterX + (meterWidth * constrain(armStretchSmooth, 0, 1)) - 1, meterY + 3);
    }
    
    fill(255, 150);
    noStroke();
    text(`ARM ${(armStretchSmooth * 100).toFixed(0)}%`, meterX, meterY - 2);
    
    // Motion
    meterY += spacing;
    stroke(100, 255, 100, 120);
    strokeWeight(1);
    noFill();
    rect(meterX, meterY, meterWidth, meterHeight);
    
    if (motionAverage > 0.01) {
      stroke(100, 255, 100, 200);
      strokeWeight(2);
      line(meterX + 1, meterY + 3, meterX + (meterWidth * constrain(motionAverage, 0, 1)) - 1, meterY + 3);
    }
    
    fill(255, 150);
    noStroke();
    text(`MOTION ${(motionAverage * 100).toFixed(0)}%`, meterX, meterY - 2);
    
    // Hip Motion
    meterY += spacing;
    stroke(255, 150, 100, 120);
    strokeWeight(1);
    noFill();
    rect(meterX, meterY, meterWidth, meterHeight);
    
    if (hipMotionSmooth > 0.01) {
      stroke(255, 150, 100, 200);
      strokeWeight(2);
      line(meterX + 1, meterY + 3, meterX + (meterWidth * constrain(hipMotionSmooth, 0, 1)) - 1, meterY + 3);
    }
    
    fill(255, 150);
    noStroke();
    text(`HIPS ${(hipMotionSmooth * 100).toFixed(0)}%`, meterX, meterY - 2);
    
    // Hand Height - now shows vertical lines instead of color
    meterY += spacing;
    let handColor = handHeightSmooth > 0 ? [255, 150, 150] : [150, 150, 255]; // Lighter colors
    stroke(handColor[0], handColor[1], handColor[2], 120);
    strokeWeight(1);
    noFill();
    rect(meterX, meterY, meterWidth, meterHeight);
    
    if (Math.abs(handHeightSmooth) > 0.01) {
      stroke(handColor[0], handColor[1], handColor[2], 200);
      strokeWeight(2);
      line(meterX + 1, meterY + 3, meterX + (meterWidth * constrain(Math.abs(handHeightSmooth), 0, 1)) - 1, meterY + 3);
    }
    
    fill(255, 150);
    noStroke();
    text(`HANDS ${handHeightSmooth > 0 ? 'UP ↑' : 'DN ↓'} LINES`, meterX, meterY - 2);
    
    // NEW: State System Status
    meterY += spacing;
    let stateColor = [100, 200, 255];
    stroke(stateColor[0], stateColor[1], stateColor[2], 120);
    strokeWeight(1);
    noFill();
    rect(meterX, meterY, meterWidth, meterHeight);
    
    // State progress bar
    let stateProgress = 0;
    if (currentState > 0) {
      const elapsed = millis() - stateStartTime;
      const stateDurations = [0, 3000, 30000, 20000, 30000, 30000, 20000]; // Updated to 30s for state 2
      if (currentState < stateDurations.length) {
        stateProgress = Math.min(elapsed / stateDurations[currentState], 1);
      }
    }
    
    if (stateProgress > 0) {
      stroke(stateColor[0], stateColor[1], stateColor[2], 200);
      strokeWeight(2);
      line(meterX + 1, meterY + 3, meterX + (meterWidth * stateProgress) - 1, meterY + 3);
    }
    
    fill(255, 150);
    noStroke();
    const stateNames = ['WAITING', 'ENTERING', 'POSE CUE', 'NJ ACTIVE', 'MOTION', 'CHAOS', 'DECAY'];
    text(`STATE ${currentState}: ${stateNames[currentState] || 'UNKNOWN'}`, meterX, meterY - 2);
    
    // Status
    meterY += spacing * 2;
    fill(255, 120);
    text(`Audio: ${audioInitialized ? 'OK' : 'NO'} | Samples: ${samplesLoaded ? 'OK' : 'LOADING'}`, meterX, meterY);
    text(`Playing: ${isPlaying ? 'YES' : 'NO'} | Poses: ${poses.length} | Full Body: ${hasFullBodyDetection ? 'YES' : 'NO'}`, meterX, meterY + 12);
    text(`Coordinates: FIXED | Jersey: FIXED | Hand raise: ${handRaiseSynth && handRaiseSynth.loaded ? 'OK' : 'NO'}`, meterX, meterY + 24);
    
  } catch (error) {
    console.error("Meter error:", error);
  }
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
  // State 0: Start the app
  if (currentState === 0) {
    startAppInteraction();
  }
  // TESTING: Any other state - stop music for testing
  else if (isPlaying) {
    stopMusic();
    console.log("🛑 Music stopped for testing");
  }
  // If music is stopped, restart it
  else if (audioInitialized) {
    startAmbientMusic();
    console.log("▶️ Music restarted");
  }
}

function touchStarted() {
  // State 0: Start the app
  if (currentState === 0) {
    startAppInteraction();
  }
  // TESTING: Any other state - stop music for testing
  else if (isPlaying) {
    stopMusic();
    console.log("🛑 Music stopped for testing (touch)");
  }
  // If music is stopped, restart it
  else if (audioInitialized) {
    startAmbientMusic();
    console.log("▶️ Music restarted (touch)");
  }
  return false;
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
  
  if (handTraceBuffer) {
    handTraceBuffer.resizeCanvas(canvasWidth, canvasHeight);
  }
  
  if (video) {
    video.size(canvasWidth, canvasHeight);
  }
  
  if (voiceWavePosition) {
    voiceWavePosition = {x: width / 2, y: height / 2};
    voiceWaveTarget = {x: width / 2, y: height / 2};
  }
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
    console.log("🏀 TESTING FIXED JERSEY CLUB PATTERN");
    startJerseyClubKick();
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
  
  // NEW: Test state transitions
  if (key.toLowerCase() === 's') {
    let nextState = (currentState + 1) % 7;
    changeState(nextState);
    console.log(`🧪 Manual state change to: ${nextState}`);
  }
  
  // NEW: Reset to beginning
  if (key.toLowerCase() === 'r') {
    resetToBeginning();
    console.log('🔄 Manual reset to beginning');
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
  // State-based background
  if (currentState === 0) {
    background(60, 60, 60); // Darker for intro
  } else {
    background(0, 0, 0, 180); // Semi-transparent for main states
  }
  // background(0);
  
  // Video overlay
  push();
  if (currentState === 0) {
    tint(255, 150); // Dimmer for intro
  } else if (currentState === 1) {
    // State 1: 3-second fade transition
    let elapsed = millis() - stateStartTime;
    let fadeProgress = Math.min(elapsed / 3000, 1);
    let opacity = map(fadeProgress, 0, 1, 150, 255);
    tint(255, opacity);
  } else {
    tint(255, 255); // Full opacity for active states
  }
  
  // Consistent video tinting
push();
tint(255, 200); // Always slightly dimmed


  if (video) {
    scale(-1, 1);
    image(video, -width, 0, width, height);
  }
  pop();
  
  if (poses.length === 0) {
  // Dark overlay to match the darkness when poses are detected
  push();
  fill(0, 0, 0, 120); // Same darkness as when visual elements overlay the video
  rect(0, 0, width, height);
  pop();
  
  // Only show meters if in debug mode
  if (audioInitialized) {
    drawMinimalMeters();
  }
  drawStateOverlays();
  return;
}
  
  // Update state system
  updateStateSystem();
  
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    
    // Check for full body detection
    checkFullBodyDetection(pose);
    
    armStretch = calculateArmStretch(pose);
    handHeight = calculateHandHeight(pose);
    palmDirection = calculatePalmDirection(pose);
    motionAmount = calculateMotionAmount(pose);
    motionAmountRaw = motionAmount;
    jumpAmount = calculateJumpAmount(pose);
    
    // Calculate hip motion for body aura
    hipMotionAmount = calculateHipMotion(pose);
    
    // Calculate New Jeans pose trigger (only in state 2 and after 30 seconds)
    if (currentState === 2) {
      const elapsed = millis() - stateStartTime;
      if (elapsed >= 30000) { // Only allow pose trigger after 30 seconds
        newJeansPoseActive = calculateNewJeansPose(pose);
      }
    }
    
    // Calculate blob tracking
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
    
    // Draw main oscilloscope pattern + separate trace buffers
    if (audioInitialized && isPlaying && samplesLoaded) {
      let visualScale = map(armStretchSmooth + motionAmountSmooth, 0, 2, 0.8, 2.5);
      
      // SEPARATE FADING: Fast fade for center, slower for hands
      let centerFadeAmount = map(motionAmountSmooth, 0, 0.5, 120, 60);
      let handFadeAmount = 40;
      
      traceBuffer.fill(0, 0, 0, centerFadeAmount);
      traceBuffer.rect(0, 0, width, height);
      
      handTraceBuffer.fill(0, 0, 0, handFadeAmount);
      handTraceBuffer.rect(0, 0, width, height);
      
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
      
      // MAIN: Draw center oscilloscope on body (prominent) - FIXED coordinates with 2.5x multiplier
      let centralVisualScale = visualScale * 2.5; // 2.5x multiplier for prominence
      drawOscilloscopePattern(bodyCenterSmooth.x, bodyCenterSmooth.y, centralVisualScale);
      drawOscilloscopePatternToBuffer(traceBuffer, bodyCenterSmooth.x, bodyCenterSmooth.y, centralVisualScale);
      
      // Add decay visualization overlay around body center - FIXED coordinates
      if (popHookActive) {
        // FIXED: Use same precise coordinate conversion
        const videoScaleX = width / (video ? video.width : width);
        const videoScaleY = height / (video ? video.height : height);
        let mirroredCenterX = width - (bodyCenterSmooth.x * videoScaleX);
        let mirroredCenterY = bodyCenterSmooth.y * videoScaleY;
        
        drawDecayVisualization(mirroredCenterX, mirroredCenterY, visualScale);
        
        // Pink tint to center oscilloscope during New Jeans loop
        push();
        tint(255, 150, 255, 30);
        noFill();
        stroke(255, 100, 255, 80);
        strokeWeight(1);
        ellipse(mirroredCenterX, mirroredCenterY, 100 + sin(millis() * 0.01) * 20, 100 + cos(millis() * 0.01) * 20);
        pop();
      }
      
      // Draw hip motion body aura (much more sensitive)
      if (hipMotionSmooth > 0.02) {
        // FIXED: Use same precise coordinate conversion
        const videoScaleX = width / (video ? video.width : width);
        const videoScaleY = height / (video ? video.height : height);
        let mirroredCenterX = width - (bodyCenterSmooth.x * videoScaleX);
        let mirroredCenterY = bodyCenterSmooth.y * videoScaleY;
        
        drawHipMotionAura(mirroredCenterX, mirroredCenterY);
      }
      
      // UPDATED: Hand tracking with FIXED coordinate system  
      const leftWrist = pose.keypoints[15];
      const rightWrist = pose.keypoints[16];
      
      let leftHandValid = false, rightHandValid = false;
      let leftHandX = 0, leftHandY = 0, rightHandX = 0, rightHandY = 0;
      
      if (leftWrist && leftWrist.confidence > 0.5) {
        // FIXED: Precise coordinate conversion with video scaling
        const videoScaleX = width / (video ? video.width : width);
        const videoScaleY = height / (video ? video.height : height);
        
        const targetLeftX = width - (leftWrist.x * videoScaleX);
        const targetLeftY = leftWrist.y * videoScaleY;
        
        leftHandSmooth.x = lerp(leftHandSmooth.x, targetLeftX, 0.1);
        leftHandSmooth.y = lerp(leftHandSmooth.y, targetLeftY, 0.1);
        
        let handScale = visualScale * 0.4;
        
        // Draw to main canvas
        drawEnhancedSubtleHandPattern(leftHandSmooth.x, leftHandSmooth.y, handScale, false);
        
        // Draw to hand trace buffer for longer trails
        handTraceBuffer.push();
        handTraceBuffer.translate(leftHandSmooth.x, leftHandSmooth.y);
        handTraceBuffer.rotate(bodyRotation);
        const spectrum = audioAnalyzer.getValue();
        
        handTraceBuffer.stroke(255, 255, 255, 120);
        handTraceBuffer.strokeWeight(1.0);
        handTraceBuffer.noFill();
        handTraceBuffer.beginShape();
        for (let i = 0; i < spectrum.length; i += 3) {
          let angle = map(i, 0, spectrum.length, 0, TWO_PI);
          let intensity = (spectrum[i] + 100) / 100;
          let radius = intensity * handScale * 60;
          
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          
          handTraceBuffer.vertex(x, y);
        }
        handTraceBuffer.endShape(CLOSE);
        handTraceBuffer.pop();
        
        leftHandValid = true;
        leftHandX = leftHandSmooth.x;
        leftHandY = leftHandSmooth.y;
      }
      
      if (rightWrist && rightWrist.confidence > 0.5) {
        // FIXED: Precise coordinate conversion with video scaling
        const videoScaleX = width / (video ? video.width : width);
        const videoScaleY = height / (video ? video.height : height);
        
        const targetRightX = width - (rightWrist.x * videoScaleX);
        const targetRightY = rightWrist.y * videoScaleY;
        
        rightHandSmooth.x = lerp(rightHandSmooth.x, targetRightX, 0.1);
        rightHandSmooth.y = lerp(rightHandSmooth.y, targetRightY, 0.1);
        
        let handScale = visualScale * 0.4;
        
        // Draw to main canvas
        drawEnhancedSubtleHandPattern(rightHandSmooth.x, rightHandSmooth.y, handScale, true);
        
        // Draw to hand trace buffer for longer trails
        handTraceBuffer.push();
        handTraceBuffer.translate(rightHandSmooth.x, rightHandSmooth.y);
        handTraceBuffer.rotate(bodyRotation);
        handTraceBuffer.scale(-1, 1);
        const spectrum = audioAnalyzer.getValue();
        
        handTraceBuffer.stroke(255, 255, 255, 120);
        handTraceBuffer.strokeWeight(1.0);
        handTraceBuffer.noFill();
        handTraceBuffer.beginShape();
        for (let i = 0; i < spectrum.length; i += 3) {
          let angle = map(i, 0, spectrum.length, 0, TWO_PI);
          let intensity = (spectrum[i] + 100) / 100;
          let radius = intensity * handScale * 60;
          
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          
          handTraceBuffer.vertex(x, y);
        }
        handTraceBuffer.endShape(CLOSE);
        handTraceBuffer.pop();
        
        rightHandValid = true;
        rightHandX = rightHandSmooth.x;
        rightHandY = rightHandSmooth.y;
      }
      
      // Connection between hands uses sparse lines visual
      if (leftHandValid && rightHandValid) {
        const distance = dist(leftHandX, leftHandY, rightHandX, rightHandY);
        
        // Draw the diagonal glitchy line first
        drawHandToHandConnection(leftHandX, leftHandY, rightHandX, rightHandY);
        
        // Add the sparse lines between hands
        drawSpectralFlowBetweenHands(leftHandX, leftHandY, rightHandX, rightHandY, distance);
      }
      
      // Draw both trace buffers
      push();
      tint(255, 180);
      image(traceBuffer, 0, 0);
      image(handTraceBuffer, 0, 0);
      pop();
      
      // ENHANCED: Draw hand height lines ON TOP of everything ELSE
      if (leftHandValid) {
        drawHandHeightLines(leftHandX, leftHandY, handHeightSmooth);
      }
      if (rightHandValid) {
        drawHandHeightLines(rightHandX, rightHandY, handHeightSmooth);
      }
    }
    
    // Draw New Jeans pose flash effect
    if (newJeansPoseActive || millis() - newJeansPoseFlashTime < 500) {
      push();
      drawNewJeansPoseFlash();
      pop();
    }
    
    // Draw blob tracking visualization
    if (blobTrackingActive) {
      drawBlobTracking();
    }
  }
  
  // NEW: Draw state-specific overlays
  drawPoseEncouragement(); // State 2
  drawMotionEncouragement(); // State 4
  drawStateOverlays(); // All states
  
  // Draw voice visualization
  drawVoiceVisualization();
  
  // FINAL TINT CHECK: Ensure we end with no tint
  noTint();
  
  if (audioInitialized) {
    drawMinimalMeters();
  }
  
  // Visual mode info
  fill(255, 150);
  textAlign(RIGHT);
  textSize(12);
  text(`Visual: ${visualModes[visualMode]} (M to change)`, width - 20, height - 20);
  
  textSize(10);
  text(`State System v2 | Fixed coordinates | Enhanced Jersey Club`, width - 20, height - 40);
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