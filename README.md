# trance-decay

Trance-Decay: Interactive Audio-Visual Installation
🛠️ Tech Stack
p5.js - Canvas rendering and visual processing
ml5.js (BlazePose) - Real-time pose detection and body tracking
Tone.js - Advanced audio synthesis, sampling, and effects processing
TensorFlow.js - Machine learning backend for pose detection
Browser APIs - Camera capture, microphone input, audio context

🎮 Interactive Controls
Gesture-Based (Real-time)
Arm StretchBrightness FilterWide arms = muffled sound, neutral = bright
Whole Body MotionPercussion VolumeMovement controls percussion loop intensity
Hand HeightGating + Synth TriggersRaised hands = stuttering effects + harmonic synth
Palm DirectionHigh-pass Filter + GlitchHand width controls filter sweep + glitch beat volume
JumpingBreakcore ActivationTriggers rapid gabber kick patterns

Manual Triggers
SPACEVoice RecordingRecords 2-measure quantized voice loops
VPop HookTriggers glitched New Jeans sample with effects
BBlob TrackingToggles tech-style bounding box visualization
MVisual ModeSwitches between Lissajous and Spectral Flow
ClickStart/StopMain transport control

🎵 Audio Samples
Bass SynthChord progression foundationBb minor, 125 BPM
Crystal ArpeggioFast melodic sequencesC3 root, flutter filtered
Lush StringsHarmonic layers with evolving LFOG3 root, gated
Epic ChoirHymnal chanting patternsF4 root, heavily processed
Percussion LoopMotion-reactive rhythmic layer140 BPM, pitch-shifted
Glitch BeatMinimal IDM textureRyoji Ikeda style
New Jeans HookVaporwave pop decayProcessed to Bb minor
Kick/ClapClean drum hitsDry signal path
Hand Raise SynthGesture-triggered screechHarmonic chord tones
Breakcore KickGabber-style rapid kicksJump-activated

🔊 Audio Processing Chain
Master Effects
Brightness Filter → Motion Filter → Palm Filter → Distortion → Delay → Reverb

Specialized Processing
Voice LoopsGate → HPF → Compressor → Distortion → BitCrusher → LPF → DelayQuantized to beat
Pop HookBitCrusher → Chorus → Tremolo → LPF → Reverb+ Sped-up granular layer
StringsEvolving LFO → Tremolo GateHand height modulation
ArpeggioFlutter LFO → Filter6Hz sine wave modulation
Glitch BeatDirect to dry gainPalm direction volume control

🎵 Audio Samples
Bass SynthChord progression foundationBb minor, 125 BPM
Crystal ArpeggioFast melodic sequencesC3 root, flutter filtered
Lush StringsHarmonic layers with evolving LFOG3 root, gated
Epic ChoirHymnal chanting patternsF4 root, heavily processed
Percussion LoopMotion-reactive rhythmic layer140 BPM, pitch-shifted
Glitch BeatMinimal IDM textureRyoji Ikeda style
New Jeans HookVaporwave pop decayProcessed to Bb minor
Kick/ClapClean drum hitsDry signal path
Hand Raise SynthGesture-triggered screechHarmonic chord tones
Breakcore KickGabber-style rapid kicksJump-activated

🔊 Audio Processing Chain
Master Effects
Brightness Filter → Motion Filter → Palm Filter → Distortion → Delay → Reverb

Specialized Processing
Voice LoopsGate → HPF → Compressor → Distortion → BitCrusher → LPF → DelayQuantized to beat
Pop HookBitCrusher → Chorus → Tremolo → LPF → Reverb+ Sped-up granular layer
StringsEvolving LFO → Tremolo GateHand height modulation
ArpeggioFlutter LFO → Filter6Hz sine wave modulation
Glitch BeatDirect to dry gainPalm direction volume control

🎨 Visual Elements
Live Video Processing
Mirrored camera feed with 70% opacity overlay
Real-time pose skeleton tracking 33 body keypoints
Confidence-based rendering (only shows reliable tracking points)

Audio-Reactive Graphics
Main Oscilloscope - Central pattern responding to full audio spectrum
Lissajous Mode: X/Y frequency plotting with gesture modulation
Spectral Flow Mode: 16-segment rotating frequency analysis
Hand Patterns - Reflected circular visualizations at each hand
Connection Lines - Audio-distorted links between hands and body center
Trace Buffer System - Motion-dependent fading trails (80ms still, 35ms moving)

Technical Overlays
Blob Tracking - Light gray bounding box with corner brackets
Voice Waveform - Floating meandering circle that moves through space
Real-time Meters - 11 parameter displays showing all gesture mappings
Status Indicators - Sample loading, recording state, effect activity
