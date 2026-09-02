# Audio Effects Processor (Audio Processing Studio)

A browser-based, real-time audio effects chain built with **p5.js** and the **Web Audio API** (via p5.sound). It plays a pre-recorded track or live microphone input through a full signal chain — low-pass/high-pass/band-pass filter → distortion → delay → compressor → reverb → master gain — with live UI controls for every stage, dual input/output FFT spectrum displays, and the ability to record and download the processed audio.

## Live Demo

Open `index.html` in a browser (see [Usage](#usage) — needs to be served over HTTP).

## Features

- **Full effects chain:** filter → distortion → delay → compressor → reverb → master volume, all chained together with `p5.sound` objects (`p5.Filter`, `p5.Distortion`, `p5.Delay`, `p5.Compressor`, `p5.Reverb`, `p5.Gain`).
- **Selectable filter type:** low-pass, high-pass, or band-pass, with adjustable cutoff frequency, resonance, dry/wet mix, and output level.
- **Waveshaper distortion:** adjustable amount, oversampling (none / 2x / 4x), dry/wet, and output level.
- **Delay:** adjustable time, feedback, and filter frequency.
- **Dynamic compressor:** adjustable attack, knee, release, ratio, threshold, dry/wet, and output level.
- **Reverb:** adjustable duration and decay, dry/wet, output level, and a "Reverse" toggle.
- **Master volume control** for the final output.
- **Switchable audio source:** play the bundled track or route your live microphone through the entire effects chain.
- **Transport controls:** Play, Pause, Stop, Skip to Start, Skip to End, and Loop.
- **Record & export:** capture the processed (wet) output with `p5.SoundRecorder` and download it as `processed_audio.wav`.
- **Dual FFT spectrum visualization:** side-by-side bar graphs of the *input* spectrum (pre-effects) and *output* spectrum (post-effects, cyan vs. red bars) on an animated canvas.
- **Collapsible control panels** for each effect section, for a cleaner UI.

## Contents

| File | Description |
|---|---|
| `index.html` | Page shell — loads p5.js and p5.sound from CDNs, links `style.css`, and runs `sketch.js`. |
| `sketch.js` | All audio routing, effect processing, GUI construction, and FFT visualization logic. |
| `style.css` | Dark-themed styling for the control panels, sliders, and buttons. |
| `tate-mcare_siren-sounds.mp3` | Default bundled audio track used as the pre-recorded source. |

## How It Works

1. **`preload()`** loads the default MP3 track.
2. **`setup()`** creates the canvas, initializes every effect node (`p5.Gain`, `p5.Filter`, `p5.Distortion`, `p5.Compressor`, `p5.Reverb`, `p5.Delay`), and wires them into a fixed signal chain:
   ```
   sound → lowpass filter → distortion → delay → compressor → reverb → master gain → output
   ```
   Two `p5.FFT` analyzers are attached — one listening to the raw `sound` (input spectrum) and one listening to `masterGain` (output spectrum) — plus a `p5.SoundRecorder` listening to the final output for recording.
3. **`createGUI()`** programmatically builds a collapsible panel for each effect (Playback, Low-pass Filter, Dynamic Compressor, Waveshaper Distortion, Reverb, Delay, Master Volume, Settings), each with sliders/selectors wired to `input`/`changed` event handlers.
4. **Update functions** (`updateLPF`, `updateDistortion`, `updateCompressor`, `updateReverb`, `updateDelayTime/Feedback/Filter`, `updateMasterVolume`, `updateFilterType`) read the relevant sliders and push new parameter values into the corresponding `p5.sound` effect object in real time.
5. **`updateAudioSource()`** switches the signal chain's input between the pre-recorded track and a `p5.AudioIn` microphone input.
6. **`draw()`** continuously reads both FFT analyzers and renders two 64-bin bar-graph spectra — input on the left, processed output on the right — so you can visually compare the effect of the chain on the signal.
7. **`toggleRecording()`** starts/stops the `p5.SoundRecorder`, and on stop, saves the captured processed audio as a downloadable WAV file.

## Usage

1. Serve the folder locally, for example:
   ```bash
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000/index.html` in your browser.
3. Click **Play** to hear the default track running through the (initially near-transparent) effects chain.
4. Open any effect panel (click its header to expand/collapse) and move its sliders to hear the effect change live — watch the input vs. output spectrum bars react.
5. Switch **Audio Source** to "microphone" (under Settings) to process live mic input instead.
6. Click **Record**, let some processed audio play, then click **Stop Recording** to download `processed_audio.wav`.

## Skills Demonstrated

- Web Audio API signal routing and real-time DSP (filtering, distortion, delay, compression, reverb)
- Real-time audio visualization (dual FFT spectrum analysis)
- Interactive, programmatically-built UI with p5.js DOM functions
- Audio I/O: file playback, microphone input, and recording/export
- JavaScript event-driven programming
