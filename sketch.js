let video;
let bodyPose;
let poses = [];
let connections;
let modelLoaded = false;
let poseDetectionStarted = false;

// Audio system
let audioInitialized = false;
let ambientPad, bassLine, leadSynth, arpeggioSynth, twinkleSound;
let brightnessFilter, motionFilter, palmFilter, masterReverb, masterDelay, masterDistortion;
let isPlaying = false;

// Movement tracking
let previousPoses = [];
let armStretch = 0;
let motionAmount = 0;
let armStretchSmooth = 0;
let motionAmountSmooth = 0;
let handHeight = 0;
let handHeightSmooth = 0;
let palmDirection = 0; // -1 = down, 1 = up
let lastTwinkleTime = 0;

// Audio parameters
let brightnessFreq = 400;
let motionResonance = 1;
let palmFreq = 800;

// Visual system
let audioAnalyzer;
let visualMode = 1; // Start with Spectral Flow (index 1)
let visualModes = ['Lissajous Scale', 'Spectral Flow'];
let bodyCenter = {x: 640, y: 480}; // Updated for larger canvas

// IDM-style chord progression (more complex, minor-heavy)
const chordProgression = [
  ["Bb2", "D3", "F3", "Ab3"],   // Bb minor 7
  ["F2", "Ab2", "C3", "Eb3"],   // F minor 7
  ["Db3", "F3", "Ab3", "C4"],   // Db major 7
  ["Eb2", "G2", "Bb2", "D3"]    // Eb minor 7
];

const bassNotes = ["Bb1", "F1", "Db1", "Eb1"];
let currentChordIndex = 0;

// IDM-style arpeggio patterns (more interesting, broken chord patterns)
const arpeggioPatterns = [
  // Bb minor 7 - broken chord with intervals
  ["Bb3", "F4", "D4", "Ab4", "Bb4", "D4", "F4", "Ab3", "D4", "F4", "Bb3", "Ab4", "F4", "D4", "Bb4", "Ab3"],
  // F minor 7 - syncopated with gaps
  ["F3", "Ab4", "C4", "Eb4", "F4", "C4", "Ab3", "Eb4", "C4", "F4", "Ab4", "F3", "Eb4", "C4", "F3", "Ab4"],
  // Db major 7 - flowing with larger intervals
  ["Db4", "F5", "Ab4", "C5", "Db5", "Ab4", "F4", "C5", "Ab4", "Db4", "F5", "C4", "Ab4", "Db5", "F4", "C5"],
  // Eb minor 7 - glitchy with repetitions
  ["Eb3", "Bb4", "Bb3", "G4", "D4", "Eb4", "G4", "Bb3", "D4", "G4", "Eb3", "Bb4", "G4", "D4", "Eb4", "Bb3"]
];

function setup() {
  createCanvas(1280, 960); // Double the size
  
  console.log('Setting up video...');
  video = createCapture(VIDEO, videoReady);
  video.size(1280, 960); // Match canvas size
  video.hide();
  
  console.log('Creating bodyPose...');
  try {
    bodyPose = ml5.bodyPose('BlazePose', modelReady);
  } catch (error) {
    console.error('Error creating bodyPose:', error);
  }
  
  console.log("Click to start/stop ambient techno music");
  console.log("Stretch arms = brighter sound | Move = resonance | Raise hands = twinkle | Palm direction = filter sweep");
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
  console.log("Initializing IDM audio system...");
  
  // Create master gain for audio analysis
  let masterGain = new Tone.Gain(1).toDestination();
  
  // Create audio analyzer connected to master output
  audioAnalyzer = new Tone.Analyser('fft', 512);
  masterGain.connect(audioAnalyzer);
  
  // Create master effects chain
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
  
  // Connect effects chain to master gain (so analyzer gets the final output)
  masterDistortion.connect(masterDelay);
  masterDelay.connect(masterReverb);
  masterReverb.connect(masterGain);
  
  // BRIGHTNESS FILTER - controlled by arm stretch
  brightnessFilter = new Tone.Filter({
    frequency: 400,
    type: "lowpass",
    rolloff: -24,
    Q: 2
  }).connect(masterDistortion);
  
  // MOTION FILTER - controlled by movement
  motionFilter = new Tone.Filter({
    frequency: 800,
    type: "bandpass",
    rolloff: -12,
    Q: 1
  }).connect(brightnessFilter);
  
  // PALM FILTER - controlled by palm direction
  palmFilter = new Tone.Filter({
    frequency: 1200,
    type: "highpass",
    rolloff: -12,
    Q: 3
  }).connect(motionFilter);
  
  // Create IDM-style ambient pad
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
  
  // Create punchy bass - drier and warmer
  bassLine = new Tone.MonoSynth({
    oscillator: {
      type: "triangle" // Warmer than square wave
    },
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.9, // High sustain for longer holds
      release: 0.5  // Shorter release for drier sound
    },
    filter: {
      Q: 4, // Less resonant
      frequency: 150, // Higher cutoff for less muffled sound
      type: "lowpass"
    }
  }).connect(brightnessFilter); // Skip motion and palm filters for drier sound
  
  // Create glitchy lead
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
  
  // Create fast arpeggio synth
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
  
  // Create airy, energetic twinkle sound
  twinkleSound = new Tone.Synth({
    oscillator: {
      type: "triangle" // More airy than sine
    },
    envelope: {
      attack: 0.001,
      decay: 0.8,   // Longer decay for more energy
      sustain: 0.3, // Higher sustain 
      release: 2.0  // Longer release for airy tail
    }
  }).connect(masterReverb);
  
  Tone.getTransport().bpm.value = 125; // Faster IDM tempo
  audioInitialized = true;
  console.log("✓ IDM audio system ready");
}

function startAmbientMusic() {
  if (isPlaying) return;
  isPlaying = true;
  
  console.log("Starting IDM ambient music...");
  if (window.updateStatus) window.updateStatus("Playing");
  
  // Ambient pad chords (slower)
  Tone.getTransport().scheduleRepeat((time) => {
    const currentChord = chordProgression[currentChordIndex];
    ambientPad.triggerAttackRelease(currentChord, "2m", time, 0.3);
    currentChordIndex = (currentChordIndex + 1) % chordProgression.length;
  }, "2m");
  
  // Bass line - ONE note per 2 measures, aligned with chord changes
  let bassChordIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    const bassNote = bassNotes[bassChordIndex % bassNotes.length];
    bassLine.triggerAttackRelease(bassNote, "2m", time, 0.8); // 2 measure duration, higher volume
    bassChordIndex = (bassChordIndex + 1) % bassNotes.length;
  }, "2m"); // Every 2 measures, same as chord changes
  
  // Fast arpeggios (16th notes for energy) - more interesting patterns
  let arpeggioNoteIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    const currentPattern = arpeggioPatterns[currentChordIndex];
    const note = currentPattern[arpeggioNoteIndex % currentPattern.length];
    
    if (Math.random() > 0.15) { // High probability but some gaps for breathing
      arpeggioSynth.triggerAttackRelease(note, "16n", time, 0.4);
    }
    
    arpeggioNoteIndex++;
    if (arpeggioNoteIndex % 16 === 0) { // Reset every measure (16 sixteenth notes)
      arpeggioNoteIndex = 0;
    }
  }, "16n");
  
  // Glitchy lead (sparse, IDM-style)
  const leadMelody = ["Bb4", "D5", "F5", "Ab5", "C5", "Eb5"];
  let leadIndex = 0;
  Tone.getTransport().scheduleRepeat((time) => {
    if (Math.random() > 0.7) { // Sparse, glitchy
      const note = leadMelody[leadIndex % leadMelody.length];
      leadSynth.triggerAttackRelease(note, "32n", time, 0.3);
      leadIndex++;
    }
  }, "16n");
  
  Tone.getTransport().start();
}

function stopMusic() {
  if (!isPlaying) return;
  isPlaying = false;
  
  try {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    if (ambientPad) ambientPad.releaseAll();
    console.log('Music stopped');
    if (window.updateStatus) window.updateStatus("Stopped");
  } catch (error) {
    console.error('Error stopping music:', error);
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
    bodyCenter = {x: centerX, y: centerY}; // Update body center for visuals
    
    const leftDistance = dist(centerX, centerY, leftWrist.x, leftWrist.y);
    const rightDistance = dist(centerX, centerY, rightWrist.x, rightWrist.y);
    const avgDistance = (leftDistance + rightDistance) / 2;
    
    // Adjusted for larger canvas - shoulder width will be larger
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
    const handHeightRaw = nose.y - avgWristY; // Positive when hands above head
    
    // Adjusted for larger canvas - scale the threshold
    return constrain(handHeightRaw / 400, -1, 1); // Larger threshold for bigger canvas
  }
  
  return handHeight;
}

function calculatePalmDirection(pose) {
  // Simplified palm direction using wrist angle relative to elbow
  const leftElbow = pose.keypoints[13];
  const rightElbow = pose.keypoints[14];
  const leftWrist = pose.keypoints[15];
  const rightWrist = pose.keypoints[16];
  
  if (leftElbow && rightElbow && leftWrist && rightWrist &&
      leftElbow.confidence > 0.5 && rightElbow.confidence > 0.5 &&
      leftWrist.confidence > 0.5 && rightWrist.confidence > 0.5) {
    
    // Simple heuristic: if wrists are above elbows = palms up
    const leftDirection = leftWrist.y < leftElbow.y ? 1 : -1;
    const rightDirection = rightWrist.y < rightElbow.y ? 1 : -1;
    
    return (leftDirection + rightDirection) / 2; // Average
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
  
  // Much more sensitive - reduced threshold from 50 to 15
  const avgMotion = validPoints > 0 ? totalMotion / validPoints : 0;
  return constrain(avgMotion / 15, 0, 1); // More sensitive motion detection
}

function updateAudioFilters() {
  if (!audioInitialized) return;
  
  armStretchSmooth = lerp(armStretchSmooth, armStretch, 0.1);
  motionAmountSmooth = lerp(motionAmountSmooth, motionAmount, 0.15);
  handHeightSmooth = lerp(handHeightSmooth, handHeight, 0.1);
  
  // ARM STRETCH → BRIGHTNESS FILTER
  brightnessFreq = map(armStretchSmooth, 0, 1, 200, 4000);
  brightnessFilter.frequency.rampTo(brightnessFreq, 0.5);
  
  // MOTION → RESONANCE FILTER
  motionResonance = map(motionAmountSmooth, 0, 1, 1, 20);
  motionFilter.Q.rampTo(motionResonance, 0.3);
  
  const motionFreq = map(motionAmountSmooth, 0, 1, 600, 1200);
  motionFilter.frequency.rampTo(motionFreq, 0.3);
  
  // PALM DIRECTION → HIGH-PASS FILTER
  palmFreq = map(palmDirection, -1, 1, 200, 3000);
  palmFilter.frequency.rampTo(palmFreq, 0.8);
  
  // HAND HEIGHT → TWINKLE TRIGGER
  if (handHeightSmooth > 0.3 && millis() - lastTwinkleTime > 500) {
    triggerTwinkle();
    lastTwinkleTime = millis();
  }
}

function triggerTwinkle() {
  if (!audioInitialized || !twinkleSound) return;
  
  // More energetic, higher notes for airy feeling
  const twinkleNotes = ["C7", "E7", "G7", "B7", "D7", "F#7", "A7", "C8"];
  const note = random(twinkleNotes);
  
  // Higher volume and longer duration for more energy
  twinkleSound.triggerAttackRelease(note, "4n", "+0", 0.5);
  console.log("✨ Airy Twinkle!");
}

// Visual system integration
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
  stroke(255, 180); // More visible
  strokeWeight(1.5 + scale * 0.01);
  noFill();
  
  let segments = 8;
  for (let seg = 0; seg < segments; seg++) {
    let startIdx = Math.floor((spectrum.length / segments) * seg);
    let endIdx = Math.floor((spectrum.length / segments) * (seg + 1));
    
    beginShape();
    for (let i = startIdx; i < endIdx; i++) {
      let progress = map(i, startIdx, endIdx, 0, 1);
      let intensity = (spectrum[i] + 100) / 100; // Convert from dB
      
      let baseAngle = map(seg, 0, segments, 0, TWO_PI);
      let flowAngle = baseAngle + progress * PI;
      
      let radius = intensity * scale * 200; // Much larger
      let x = cos(flowAngle) * radius;
      let y = sin(flowAngle) * radius;
      
      // Add harmonic distortion
      x += cos(flowAngle * 3) * intensity * scale * 50;
      y += sin(flowAngle * 3) * intensity * scale * 50;
      
      vertex(x, y);
    }
    endShape();
  }
}

function drawGestureMeters() {
  // Draw gesture parameter meters on the left side
  let meterX = 20;
  let meterY = 100;
  let meterWidth = 200;
  let meterHeight = 15;
  let spacing = 25;
  
  fill(0, 0, 0, 150);
  noStroke();
  rect(meterX - 10, meterY - 10, meterWidth + 20, spacing * 4 + 10);
  
  // Arm Stretch Meter
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(255, 100, 100);
  rect(meterX, meterY, meterWidth * armStretchSmooth, meterHeight);
  fill(255);
  textSize(11);
  text(`Arm Stretch: ${(armStretchSmooth * 100).toFixed(0)}%`, meterX, meterY - 3);
  
  // Motion Amount Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  fill(100, 255, 100);
  rect(meterX, meterY, meterWidth * motionAmountSmooth, meterHeight);
  fill(255);
  text(`Motion: ${(motionAmountSmooth * 100).toFixed(0)}%`, meterX, meterY - 3);
  
  // Hand Height Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  let handHeightDisplay = map(handHeightSmooth, -1, 1, 0, 1);
  fill(100, 100, 255);
  rect(meterX, meterY, meterWidth * handHeightDisplay, meterHeight);
  fill(255);
  text(`Hand Height: ${handHeightSmooth > 0 ? 'UP' : 'DOWN'} (${handHeightSmooth.toFixed(2)})`, meterX, meterY - 3);
  
  // Palm Direction Meter
  meterY += spacing;
  fill(50);
  rect(meterX, meterY, meterWidth, meterHeight);
  let palmDisplay = map(palmDirection, -1, 1, 0, 1);
  fill(255, 255, 100);
  rect(meterX, meterY, meterWidth * palmDisplay, meterHeight);
  fill(255);
  text(`Palm Direction: ${palmDirection > 0 ? 'UP' : 'DOWN'} (${palmDirection.toFixed(2)})`, meterX, meterY - 3);
}

function draw() {
  background(0);
  
  // Dark video overlay
  push();
  tint(255, 80); // Darker overlay for cleaner aesthetic
  if (video) {
    image(video, 0, 0, width, height);
  }
  pop();
  
  if (poses.length === 0) {
    // Minimal waiting state
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
    
    updateAudioFilters();
    
    // Draw minimal skeleton (very subtle)
    if (connections && pose.keypoints) {
      stroke(255, 30); // Very subtle
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
    
    // Draw oscilloscope pattern at body center (main visual feature)
    if (audioInitialized && isPlaying) {
      let visualScale = map(armStretchSmooth + motionAmountSmooth, 0, 2, 0.8, 2.5);
      drawOscilloscopePattern(bodyCenter.x, bodyCenter.y, visualScale);
    }
  }
  
  // Draw gesture meters for troubleshooting
  if (audioInitialized) {
    drawGestureMeters();
  }
  
  // Visual mode info (bottom right)
  fill(255, 150);
  textAlign(RIGHT);
  textSize(12);
  text(`Visual: ${visualModes[visualMode]} (M to change)`, width - 20, height - 20);
  textAlign(LEFT);
}

function mousePressed() {
  if (!audioInitialized) {
    initializeAudio().then(() => {
      startAmbientMusic();
    });
  } else {
    // Toggle music on/off
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