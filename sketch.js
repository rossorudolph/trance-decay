let video;
let bodyPose;
let poses = [];
let connections;
let modelLoaded = false;
let poseDetectionStarted = false;

// Audio system
let audioInitialized = false;
let ambientPad, bassLine, leadSynth, arpeggioSynth;
let brightnessFilter, motionFilter, masterReverb, masterDelay;
let isPlaying = false;

// Movement tracking z
let previousPoses = [];
let armStretch = 0;
let motionAmount = 0;
let armStretchSmooth = 0;
let motionAmountSmooth = 0;

// Audio parameters - these will change dramatically
let brightnessFreq = 400;  // 200Hz to 4000Hz based on arm stretch
let motionResonance = 1;   // 1 to 20 based on motion amount

// Ambient chord progression
const chordProgression = [
  ["C3", "E3", "G3", "B3"],   // Cmaj7
  ["F3", "A3", "C4", "E4"],   // Fmaj7  
  ["G3", "B3", "D4", "F#4"],  // Gmaj7
  ["A2", "C3", "E3", "G3"]    // Am7
];

const bassNotes = ["C2", "F2", "G2", "A1"];
let currentChordIndex = 0;

function setup() {
  createCanvas(640, 480);
  
  console.log('Setting up video...');
  video = createCapture(VIDEO, videoReady);
  video.size(640, 480);
  video.hide();
  
  // Try to create bodyPose - different approach
  console.log('Creating bodyPose...');
  try {
    bodyPose = ml5.bodyPose('BlazePose', modelReady);
  } catch (error) {
    console.error('Error creating bodyPose:', error);
    console.log('Trying alternative method...');
    setTimeout(() => {
      try {
        bodyPose = ml5.bodyPose(modelReady);
      } catch (e) {
        console.error('Alternative method also failed:', e);
      }
    }, 1000);
  }
  
  // Instructions
  console.log("Click to start ambient music");
  console.log("Stretch arms wide = brighter sound");
  console.log("Move around = more resonant sound");
}

function modelReady() {
  console.log('✓ BlazePose model loaded successfully!');
  modelLoaded = true;
  
  // Try to get skeleton connections
  try {
    connections = bodyPose.getSkeleton();
    console.log('✓ Skeleton connections loaded:', connections ? connections.length : 'none');
  } catch (error) {
    console.error('Error getting skeleton:', error);
    // Create basic skeleton connections manually if needed
    connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
      [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28] // Torso and legs
    ];
  }
  
  // Start pose detection if video is ready
  if (video && video.elt && video.elt.readyState === 4) {
    startPoseDetection();
  }
}

function videoReady() {
  console.log('✓ Video ready');
  
  // Start pose detection if model is ready
  if (modelLoaded && !poseDetectionStarted) {
    startPoseDetection();
  }
}

function startPoseDetection() {
  if (poseDetectionStarted || !modelLoaded || !video) {
    console.log('Cannot start pose detection:', {
      started: poseDetectionStarted,
      modelLoaded: modelLoaded,
      videoReady: video && video.elt && video.elt.readyState === 4
    });
    return;
  }
  
  console.log('Starting pose detection...');
  try {
    bodyPose.detectStart(video, gotPoses);
    poseDetectionStarted = true;
    console.log('✓ Pose detection started successfully');
  } catch (error) {
    console.error('Error starting pose detection:', error);
    
    // Try alternative detection method
    console.log('Trying alternative detection...');
    setTimeout(() => {
      try {
        bodyPose.detect(video, gotPoses);
        console.log('✓ Alternative detection method started');
      } catch (e) {
        console.error('Alternative detection also failed:', e);
      }
    }, 1000);
  }
}

async function initializeAudio() {
  if (audioInitialized) return;
  
  await Tone.start();
  console.log("Initializing ambient audio system...");
  
  // Create master effects
  masterReverb = new Tone.Reverb({
    roomSize: 0.9,
    decay: 6,
    wet: 0.4
  }).toDestination();
  
  masterDelay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.4,
    wet: 0.3
  }).connect(masterReverb);
  
  // BRIGHTNESS FILTER - controlled by arm stretch
  // This will make VERY obvious changes from dark/muffled to bright/crisp
  brightnessFilter = new Tone.Filter({
    frequency: 400,
    type: "lowpass",
    rolloff: -24,
    Q: 2
  }).connect(masterDelay);
  
  // MOTION FILTER - controlled by movement amount
  // High resonance creates dramatic "whoosh" and emphasis effects
  motionFilter = new Tone.Filter({
    frequency: 800,
    type: "bandpass",
    rolloff: -12,
    Q: 1  // This will change dramatically with motion
  }).connect(brightnessFilter);
  
  // Create lush ambient pad - goes through both filters
  ambientPad = new Tone.PolySynth({
    oscillator: {
      type: "sawtooth",
      spread: 30
    },
    envelope: {
      attack: 4.0,
      decay: 0.1,
      sustain: 0.9,
      release: 5.0
    }
  }).connect(motionFilter);
  
  // Create warm bass - bypasses motion filter for stability
  bassLine = new Tone.MonoSynth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 1.0,
      decay: 0.3,
      sustain: 0.7,
      release: 2.0
    }
  }).connect(brightnessFilter);
  
  // Create ethereal lead - goes through both filters for maximum expression
  leadSynth = new Tone.Synth({
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 2.0,
      decay: 0.2,
      sustain: 0.8,
      release: 4.0
    }
  }).connect(motionFilter);
  
  // Create flowing arpeggio synth - gentle but energetic
  arpeggioSynth = new Tone.Synth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.3,
      decay: 0.4,
      sustain: 0.6,
      release: 1.5
    }
  }).connect(brightnessFilter);
  
  Tone.getTransport().bpm.value = 75;
  audioInitialized = true;
  console.log("✓ Audio system ready - filters will respond to arm stretch and motion");
}

function startAmbientMusic() {
  if (isPlaying) return;
  isPlaying = true;
  
  console.log("Starting ambient music...");
  
  // Long, sustained ambient chords
  Tone.getTransport().scheduleRepeat((time) => {
    const currentChord = chordProgression[currentChordIndex];
    ambientPad.triggerAttackRelease(currentChord, "4m", time, 0.4);
    currentChordIndex = (currentChordIndex + 1) % chordProgression.length;
  }, "4m");
  
  // Deep bass foundation
  Tone.getTransport().scheduleRepeat((time) => {
    const bassNote = bassNotes[currentChordIndex % bassNotes.length];
    bassLine.triggerAttackRelease(bassNote, "2m", time, 0.5);
  }, "2m");
  
  // Ethereal lead melodies
  const leadMelody = ["C5", "E5", "G5", "B5", "D5", "F#5", "A5"];
  let leadIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    if (Math.random() > 0.4) { // More frequent than before
      const note = leadMelody[leadIndex % leadMelody.length];
      leadSynth.triggerAttackRelease(note, "2n", time, 0.3);
      leadIndex++;
    }
  }, "2n");
  
  // Flowing arpeggios - gentle but energetic patterns
  const arpeggioPatterns = [
    ["C4", "E4", "G4", "B4", "C5", "B4", "G4", "E4"], // Cmaj7 arpeggio
    ["F4", "A4", "C5", "E5", "F5", "E5", "C5", "A4"], // Fmaj7 arpeggio  
    ["G4", "B4", "D5", "F#5", "G5", "F#5", "D5", "B4"], // Gmaj7 arpeggio
    ["A3", "C4", "E4", "G4", "A4", "G4", "E4", "C4"]  // Am7 arpeggio
  ];
  
  let arpeggioNoteIndex = 0;
  
  Tone.getTransport().scheduleRepeat((time) => {
    const currentPattern = arpeggioPatterns[currentChordIndex];
    const note = currentPattern[arpeggioNoteIndex % currentPattern.length];
    
    // Play with subtle randomization for organic feel
    if (Math.random() > 0.2) { // Occasionally skip notes for breathing
      arpeggioSynth.triggerAttackRelease(note, "8n", time, 0.25);
    }
    
    arpeggioNoteIndex++;
    
    // Reset pattern when chord changes (every 4 measures = 32 eighth notes)
    if (arpeggioNoteIndex % 32 === 0) {
      arpeggioNoteIndex = 0;
    }
  }, "8n"); // Eighth note arpeggios for gentle energy
  
  Tone.getTransport().start();
}

function calculateArmStretch(pose) {
  // BlazePose keypoint indices
  const leftShoulder = pose.keypoints[11];   // Left shoulder
  const rightShoulder = pose.keypoints[12];  // Right shoulder
  const leftWrist = pose.keypoints[15];      // Left wrist
  const rightWrist = pose.keypoints[16];     // Right wrist
  
  // Check if all required points exist and have good confidence
  if (leftShoulder && rightShoulder && leftWrist && rightWrist &&
      leftShoulder.confidence > 0.5 && rightShoulder.confidence > 0.5 &&
      leftWrist.confidence > 0.5 && rightWrist.confidence > 0.5) {
    
    // Calculate center point between shoulders
    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const centerY = (leftShoulder.y + rightShoulder.y) / 2;
    
    // Calculate distance from center to each wrist
    const leftDistance = dist(centerX, centerY, leftWrist.x, leftWrist.y);
    const rightDistance = dist(centerX, centerY, rightWrist.x, rightWrist.y);
    
    // Average distance represents how stretched out arms are
    const avgDistance = (leftDistance + rightDistance) / 2;
    
    // Store debug info globally for visual display
    window.armDebug = {
      leftShoulder: leftShoulder,
      rightShoulder: rightShoulder,
      leftWrist: leftWrist,
      rightWrist: rightWrist,
      centerX: centerX,
      centerY: centerY,
      leftDistance: leftDistance,
      rightDistance: rightDistance,
      avgDistance: avgDistance
    };
    
    // Use shoulder width for dynamic normalization
    const shoulderWidth = dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
    const normalizedDistance = avgDistance / (shoulderWidth * 1.5);
    
    return constrain(normalizedDistance, 0, 1);
  }
  
  return armStretch; // Keep previous value if tracking fails
}

function calculateMotionAmount(currentPose) {
  if (previousPoses.length === 0) {
    previousPoses.push(currentPose);
    return 0;
  }
  
  const prevPose = previousPoses[previousPoses.length - 1];
  let totalMotion = 0;
  let validPoints = 0;
  
  // Compare key body points between frames - BlazePose indices
  const keyPoints = [0, 11, 12, 13, 14, 15, 16, 23, 24]; // Head, shoulders, elbows, wrists, hips
  
  for (let i of keyPoints) {
    const current = currentPose.keypoints[i];
    const previous = prevPose.keypoints[i];
    
    if (current && previous && current.confidence > 0.5 && previous.confidence > 0.5) {
      const distance = dist(current.x, current.y, previous.x, previous.y);
      totalMotion += distance;
      validPoints++;
    }
  }
  
  // Store current pose for next frame
  previousPoses.push(currentPose);
  if (previousPoses.length > 5) {
    previousPoses.shift(); // Keep only recent poses
  }
  
  // Average motion across valid points, normalize to 0-1 range
  const avgMotion = validPoints > 0 ? totalMotion / validPoints : 0;
  return constrain(avgMotion / 25, 0, 1); // Reduced threshold for more sensitivity
}

function updateAudioFilters() {
  if (!audioInitialized) return;
  
  // Smooth the values for less jittery audio
  armStretchSmooth = lerp(armStretchSmooth, armStretch, 0.1);
  motionAmountSmooth = lerp(motionAmountSmooth, motionAmount, 0.15);
  
  // ARM STRETCH → BRIGHTNESS FILTER (very dramatic range)
  // Closed arms = dark, muffled (200Hz)
  // Open arms = bright, crisp (4000Hz)
  brightnessFreq = map(armStretchSmooth, 0, 1, 200, 4000);
  brightnessFilter.frequency.rampTo(brightnessFreq, 0.5);
  
  // MOTION → RESONANCE FILTER (creates dramatic "whoosh" effects)
  // No motion = subtle (Q=1)
  // High motion = very resonant/emphasized (Q=20)
  motionResonance = map(motionAmountSmooth, 0, 1, 1, 20);
  motionFilter.Q.rampTo(motionResonance, 0.3);
  
  // Also adjust motion filter frequency slightly with motion for extra effect
  const motionFreq = map(motionAmountSmooth, 0, 1, 600, 1200);
  motionFilter.frequency.rampTo(motionFreq, 0.3);
}

function draw() {
  background(10, 5, 25); // Deep ambient background
  
  // Try backup detection if needed
  if (frameCount % 180 === 0) { // Every 3 seconds
    tryBackupDetection();
  }
  
  // Draw video
  if (video) {
    image(video, 0, 0, width, height);
  }
  
  // Audio status
  if (audioInitialized && isPlaying) {
    fill(0, 255, 150, 200);
    rect(10, 10, 300, 25);
    fill(0);
    textSize(14);
    text("AMBIENT MUSIC ACTIVE", 15, 27);
  } else {
    fill(255, 100, 100);
    textSize(16);
    text("Click to start ambient music", 10, 25);
  }
  
  // Debug information
  fill(255);
  textSize(12);
  text(`Model loaded: ${modelLoaded}`, 10, 50);
  text(`Detection started: ${poseDetectionStarted}`, 10, 65);
  text(`Poses detected: ${poses.length}`, 10, 80);
  text(`ml5 version: ${typeof ml5 !== 'undefined' ? 'loaded' : 'not loaded'}`, 10, 95);
  
  // Show debug skeleton even with no poses for testing
  if (poses.length === 0) {
    fill(255, 200, 0);
    textSize(14);
    text("Move into view for pose detection...", 10, 120);
    text("Click to retry detection", 10, 140);
    
    // Draw test skeleton in center for debugging
    drawTestSkeleton();
    return;
  }
  
  // Draw actual detected poses
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    
    // Calculate movement parameters
    armStretch = calculateArmStretch(pose);
    motionAmount = calculateMotionAmount(pose);
    
    // Update audio based on movement
    updateAudioFilters();
    
    // Draw skeleton connections
    if (connections && pose.keypoints) {
      stroke(100, 255, 100); // Green for debugging
      strokeWeight(2);
      
      for (let j = 0; j < connections.length; j++) {
        let pointAIndex = connections[j][0];
        let pointBIndex = connections[j][1];
        let pointA = pose.keypoints[pointAIndex];
        let pointB = pose.keypoints[pointBIndex];
        
        if (pointA && pointB && pointA.confidence > 0.1 && pointB.confidence > 0.1) {
          // Color based on brightness filter frequency
          const hue = map(brightnessFreq, 200, 4000, 240, 60); // Blue to yellow
          stroke(hue, 80, 90);
          strokeWeight(3);
          line(pointA.x, pointA.y, pointB.x, pointB.y);
        }
      }
    }
    
    // Draw keypoints with labels for debugging
    if (pose.keypoints) {
      for (let j = 0; j < pose.keypoints.length; j++) {
        let keypoint = pose.keypoints[j];
        if (keypoint && keypoint.confidence > 0.1) {
          // Size based on motion amount
          const pointSize = map(motionResonance, 1, 20, 5, 15);
          fill(255, 200, 100);
          noStroke();
          circle(keypoint.x, keypoint.y, pointSize);
          
          // Label key points for debugging
          if (j === 11 || j === 12 || j === 15 || j === 16) {
            fill(255);
            textSize(8);
            text(j, keypoint.x + 5, keypoint.y);
          }
        }
      }
    }
    
    // VISUAL ARM STRETCH DEBUGGING
    if (window.armDebug) {
      const debug = window.armDebug;
      
      // Draw center point in bright red
      fill(255, 0, 0);
      noStroke();
      circle(debug.centerX, debug.centerY, 15);
      
      // Draw lines from center to wrists
      stroke(255, 0, 0);
      strokeWeight(3);
      line(debug.centerX, debug.centerY, debug.leftWrist.x, debug.leftWrist.y);
      line(debug.centerX, debug.centerY, debug.rightWrist.x, debug.rightWrist.y);
      
      // Highlight the key points
      fill(0, 255, 0);
      noStroke();
      circle(debug.leftShoulder.x, debug.leftShoulder.y, 12);  // Left shoulder - green
      circle(debug.rightShoulder.x, debug.rightShoulder.y, 12); // Right shoulder - green
      
      fill(255, 255, 0);
      circle(debug.leftWrist.x, debug.leftWrist.y, 12);   // Left wrist - yellow
      circle(debug.rightWrist.x, debug.rightWrist.y, 12); // Right wrist - yellow
      
      // Show calculation values on screen
      fill(255, 255, 255);
      textSize(14);
      text(`Left distance: ${debug.leftDistance.toFixed(1)}`, 250, 120);
      text(`Right distance: ${debug.rightDistance.toFixed(1)}`, 250, 140);
      text(`Average: ${debug.avgDistance.toFixed(1)}`, 250, 160);
      
      const shoulderWidth = dist(debug.leftShoulder.x, debug.leftShoulder.y, debug.rightShoulder.x, debug.rightShoulder.y);
      text(`Shoulder width: ${shoulderWidth.toFixed(1)}`, 250, 180);
      text(`Normalization: ${(debug.avgDistance / (shoulderWidth * 1.5)).toFixed(2)}`, 250, 200);
    }
  }
  
  // Visual feedback for audio parameters
  if (audioInitialized) {
    // Arm stretch indicator
    fill(255, 200, 0, 150);
    rect(10, height - 80, map(armStretchSmooth, 0, 1, 0, 200), 20);
    fill(255);
    textSize(12);
    text(`Arm Stretch: ${(armStretchSmooth * 100).toFixed(0)}%`, 10, height - 55);
    text(`Brightness: ${brightnessFreq.toFixed(0)}Hz`, 10, height - 40);
    
    // Motion indicator
    fill(0, 255, 200, 150);
    rect(250, height - 80, map(motionAmountSmooth, 0, 1, 0, 200), 20);
    fill(255);
    text(`Motion: ${(motionAmountSmooth * 100).toFixed(0)}%`, 250, height - 55);
    text(`Resonance: ${motionResonance.toFixed(1)}`, 250, height - 40);
  }
}

function drawTestSkeleton() {
  // Draw a test skeleton in the center to verify rendering works
  stroke(255, 0, 0, 100);
  strokeWeight(2);
  
  let centerX = width / 2;
  let centerY = height / 2;
  
  // Simple stick figure
  // Head
  noFill();
  circle(centerX, centerY - 60, 40);
  
  // Body
  line(centerX, centerY - 40, centerX, centerY + 40);
  
  // Arms
  line(centerX, centerY - 20, centerX - 50, centerY);
  line(centerX, centerY - 20, centerX + 50, centerY);
  
  // Legs
  line(centerX, centerY + 40, centerX - 30, centerY + 80);
  line(centerX, centerY + 40, centerX + 30, centerY + 80);
  
  fill(255, 0, 0);
  textAlign(CENTER);
  text("TEST SKELETON", centerX, centerY + 100);
  textAlign(LEFT);
}

// Add this backup detection function
function tryBackupDetection() {
  if (poses.length === 0 && modelLoaded && video && frameCount > 120) {
    console.log('Trying backup pose detection...');
    
    try {
      // Try direct detection call
      bodyPose.detect(video, (results) => {
        console.log('Backup detection results:', results ? results.length : 'null');
        if (results && results.length > 0) {
          gotPoses(results);
        }
      });
    } catch (error) {
      console.error('Backup detection failed:', error);
    }
  }
}

function mousePressed() {
  if (!audioInitialized) {
    initializeAudio().then(() => {
      startAmbientMusic();
    });
  }
  
  // Also try to restart pose detection on click
  if (modelLoaded && poses.length === 0) {
    console.log('Manual pose detection restart...');
    tryBackupDetection();
  }
}

function gotPoses(results) {
  try {
    if (results && results.length > 0) {
      poses = results;
      
      // Debug: log pose structure first time only
      if (results[0] && results[0].keypoints && !window.debugLogged) {
        console.log('✓ Pose detected!');
        console.log('- Keypoints:', results[0].keypoints.length);
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