let sound, lpf, distortion, compressor, reverb, masterGain;
let fftOriginal, fftProcessed;
let isPlaying = false;
let isRecording = false;
let recorder, soundFile;
let lpfTypeLabel, lpfTypeSelector;
let audioSourceLabel, audioSourceSelector;
let delay;
let mic;

// Playback controls
let playButton, pauseButton, stopButton, skipStartButton, skipEndButton, loopButton, recordButton;

// Low-pass filter controls
let lpCutOffLabel, lpCutOffSlider;
let lpResonanceLabel, lpResonanceSlider;
let lpDryWetLabel, lpDryWetSlider;
let lpOutputLabel, lpOutputSlider;

// Dynamic compressor controls
let dcAttackLabel, dcAttackSlider;
let dcKneeLabel, dcKneeSlider;
let dcReleaseLabel, dcReleaseSlider;
let dcRatioLabel, dcRatioSlider;
let dcThresholdLabel, dcThresholdSlider;
let dcDryWetLabel, dcDryWetSlider;
let dcOutputLabel, dcOutputSlider;

// Reverb controls
let rvDurationLabel, rvDurationSlider;
let rvDecayLabel, rvDecaySlider;
let rvDryWetLabel, rvDryWetSlider;
let rvOutputLabel, rvOutputSlider;
let rvReverseButton;

// Waveshaper distortion controls
let wdAmountLabel, wdAmountSlider;
let wdOversampleLabel, wdOversampleSlider;
let wdDryWetLabel, wdDryWetSlider;
let wdOutputLabel, wdOutputSlider;

// Master volume control
let mvVolumeLabel, mvVolumeSlider;

// Delay controls
let delayTimeSlider, delayTimeLabel;
let delayFeedbackLabel, delayFeedbackSlider;
let delayFilterLabel, delayFilterSlider;

// Spectrum labels
let spectrumInLabel, spectrumOutLabel;

function preload() {
    sound = loadSound('tate-mcare_siren-sounds.mp3', () => {
        console.log("Sound loaded successfully");
    }, () => {
        console.error("Failed to load sound file");
    });
}

function setup() {
    let canvas = createCanvas(1000, 400, 'p2d'); // P2D renderer, fixed size
    canvas.parent(document.body); // Attach to body
    canvas.style('position', 'absolute');
    canvas.style('top', '50px');
    canvas.style('left', '340px');
    canvas.style('z-index', '10000');
    canvas.style('width', '1000px'); // Explicit CSS width
    canvas.style('height', '400px'); // Explicit CSS height
    pixelDensity(1); // Disable high-DPI scaling
    console.log("Canvas created and attached to body, size:", canvas.width, "x", canvas.height, "element:", canvas.elt);
    background(50); // Dark gray background


    // Initialize effects
    masterGain = new p5.Gain();
    lpf = new p5.Filter();
    distortion = new p5.Distortion();
    compressor = new p5.Compressor();
    reverb = new p5.Reverb();
    delay = new p5.Delay();

    sound.disconnect();
    sound.connect(lpf);
    lpf.connect(distortion);
    distortion.connect(delay);
    delay.connect(compressor);
    compressor.connect(reverb);
    reverb.connect(masterGain);
    masterGain.connect();

    lpf.setType('lowpass');

    fftOriginal = new p5.FFT(0.8, 1024);
    fftOriginal.setInput(sound);
    fftProcessed = new p5.FFT(0.8, 1024);
    fftProcessed.setInput(masterGain);

    recorder = new p5.SoundRecorder();
    recorder.setInput(masterGain);
    soundFile = new p5.SoundFile();

    createGUI();

    lpf.freq(2000);
    lpf.res(1);
    lpf.drywet(1);
    lpf.amp(1);
    
    distortion.process(lpf, 0, '2x');
    compressor.process(distortion, 0.1, 30, -24, 12, 0.25);
    reverb.process(compressor, 2, 2);
    reverb.drywet(1);
    reverb.amp(1);
    masterGain.amp(0.5);
    
    delay.process(compressor, delayTimeSlider.value(), delayFeedbackSlider.value(), delayFilterSlider.value());
    delay.amp(0);
}

function draw() {
    background(50); // Dark gray to contrast body

    let spectrumOriginal = fftOriginal.analyze();
    let spectrumProcessed = fftProcessed.analyze();

    // Spectrum In (Cyan bars)
    noStroke();
    fill(0, 255, 255); // Bright cyan
    textSize(20); // Larger text
    text('Input Spectrum', 10, 50);
    let numBins = 64; // 64 bins for ~7.5px wide bars
    let barWidth = 200 / numBins;
    for (let i = 0; i < numBins; i++) {
        let x = map(i, 0, numBins, 10, 490);
        let fftValue = constrain(spectrumOriginal[i], 0, 255);
        let h = -map(fftValue, 0, 255, 0, 250); // Up to 280px height
        rect(x, 350, barWidth, h);
    }

    // Spectrum Out (Red bars)
    fill(255, 100, 100); // Bright red
    text('Output Spectrum', 510, 50);
    barWidth = 200 / numBins;
    for (let i = 0; i < numBins; i++) {
        let x = map(i, 0, numBins, 510, 990);
        let fftValue = constrain(spectrumProcessed[i], 0, 150);
        let h = -map(fftValue, 0, 150, 0, 250);
        rect(x, 350, barWidth, h);
    }
}

function createGUI() {
    let container = select('.container');

    // Playback Controls Panel
    let playbackPanel = createDiv().addClass('panel').parent(container);
    let playbackHeader = createElement('h3', 'Playback Controls').parent(playbackPanel);
    let playbackContent = createDiv().addClass('panel-content').parent(playbackPanel);
    let playbackGroup = createDiv().addClass('control-group').parent(playbackContent);

    playButton = createButton('Play').parent(playbackGroup);
    playButton.mousePressed(() => {
        if (!isPlaying) playSound();
    });

    pauseButton = createButton('Pause').parent(playbackGroup);
    pauseButton.mousePressed(pauseSound);

    stopButton = createButton('Stop').parent(playbackGroup);
    stopButton.mousePressed(stopSound);

    skipStartButton = createButton('Skip to Start').parent(playbackGroup);
    skipStartButton.mousePressed(skipToStart);

    skipEndButton = createButton('Skip to End').parent(playbackGroup);
    skipEndButton.mousePressed(skipToEnd);

    loopButton = createButton('Loop').parent(playbackGroup);
    loopButton.mousePressed(toggleLoop);

    recordButton = createButton('Record').parent(playbackGroup);
    recordButton.mousePressed(toggleRecording);

    playbackHeader.mouseClicked(() => togglePanel(playbackContent));

    // Low-pass Filter Panel
    let lpfPanel = createDiv().addClass('panel').parent(container);
    let lpfHeader = createElement('h3', 'Low-pass Filter').parent(lpfPanel);
    let lpfContent = createDiv().addClass('panel-content').parent(lpfPanel);
    let lpfGroup = createDiv().addClass('control-group').parent(lpfContent);

    let lpfCutoffDiv = createDiv().addClass('control').parent(lpfGroup);
    lpCutOffLabel = createElement('label', 'Cutoff Frequency').parent(lpfCutoffDiv);
    lpCutOffSlider = createSlider(100, 5000, 2000).parent(lpfCutoffDiv);
    lpCutOffSlider.input(updateLPF);

    let lpfResonanceDiv = createDiv().addClass('control').parent(lpfGroup);
    lpResonanceLabel = createElement('label', 'Resonance').parent(lpfResonanceDiv);
    lpResonanceSlider = createSlider(0.1, 10, 1, 0.1).parent(lpfResonanceDiv);
    lpResonanceSlider.input(updateLPF);

    let lpfDryWetDiv = createDiv().addClass('control').parent(lpfGroup);
    lpDryWetLabel = createElement('label', 'Dry/Wet').parent(lpfDryWetDiv);
    lpDryWetSlider = createSlider(0, 1, 1, 0.01).parent(lpfDryWetDiv);
    lpDryWetSlider.input(updateLPF);

    let lpfOutputDiv = createDiv().addClass('control').parent(lpfGroup);
    lpOutputLabel = createElement('label', 'Output Level').parent(lpfOutputDiv);
    lpOutputSlider = createSlider(0, 1, 1, 0.01).parent(lpfOutputDiv);
    lpOutputSlider.input(updateLPF);

    lpfHeader.mouseClicked(() => togglePanel(lpfContent));

    // Dynamic Compressor Panel
    let compressorPanel = createDiv().addClass('panel').parent(container);
    let compressorHeader = createElement('h3', 'Dynamic Compressor').parent(compressorPanel);
    let compressorContent = createDiv().addClass('panel-content').parent(compressorPanel);
    let compressorGroup = createDiv().addClass('control-group').parent(compressorContent);

    let dcAttackDiv = createDiv().addClass('control').parent(compressorGroup);
    dcAttackLabel = createElement('label', 'Attack').parent(dcAttackDiv);
    dcAttackSlider = createSlider(0.001, 1, 0.1, 0.001).parent(dcAttackDiv);
    dcAttackSlider.input(updateCompressor);

    let dcKneeDiv = createDiv().addClass('control').parent(compressorGroup);
    dcKneeLabel = createElement('label', 'Knee').parent(dcKneeDiv);
    dcKneeSlider = createSlider(0, 40, 30, 1).parent(dcKneeDiv);
    dcKneeSlider.input(updateCompressor);

    let dcReleaseDiv = createDiv().addClass('control').parent(compressorGroup);
    dcReleaseLabel = createElement('label', 'Release').parent(dcReleaseDiv);
    dcReleaseSlider = createSlider(0.001, 1, 0.25, 0.001).parent(dcReleaseDiv);
    dcReleaseSlider.input(updateCompressor);

    let dcRatioDiv = createDiv().addClass('control').parent(compressorGroup);
    dcRatioLabel = createElement('label', 'Ratio').parent(dcRatioDiv);
    dcRatioSlider = createSlider(1, 20, 12, 1).parent(dcRatioDiv);
    dcRatioSlider.input(updateCompressor);

    let dcThresholdDiv = createDiv().addClass('control').parent(compressorGroup);
    dcThresholdLabel = createElement('label', 'Threshold').parent(dcThresholdDiv);
    dcThresholdSlider = createSlider(-100, 0, -24, 1).parent(dcThresholdDiv);
    dcThresholdSlider.input(updateCompressor);

    let dcDryWetDiv = createDiv().addClass('control').parent(compressorGroup);
    dcDryWetLabel = createElement('label', 'Dry/Wet').parent(dcDryWetDiv);
    dcDryWetSlider = createSlider(0, 1, 1, 0.01).parent(dcDryWetDiv);
    dcDryWetSlider.input(updateCompressor);

    let dcOutputDiv = createDiv().addClass('control').parent(compressorGroup);
    dcOutputLabel = createElement('label', 'Output Level').parent(dcOutputDiv);
    dcOutputSlider = createSlider(0, 1, 1, 0.01).parent(dcOutputDiv);
    dcOutputSlider.input(updateCompressor);

    compressorHeader.mouseClicked(() => togglePanel(compressorContent));

    // Waveshaper Distortion Panel
    let distortionPanel = createDiv().addClass('panel').parent(container);
    let distortionHeader = createElement('h3', 'Waveshaper Distortion').parent(distortionPanel);
    let distortionContent = createDiv().addClass('panel-content').parent(distortionPanel);
    let distortionGroup = createDiv().addClass('control-group').parent(distortionContent);

    let wdAmountDiv = createDiv().addClass('control').parent(distortionGroup);
    wdAmountLabel = createElement('label', 'Distortion Amount').parent(wdAmountDiv);
    wdAmountSlider = createSlider(0, 100, 0, 1).parent(wdAmountDiv);
    wdAmountSlider.input(updateDistortion);

    let wdOversampleDiv = createDiv().addClass('control').parent(distortionGroup);
    wdOversampleLabel = createElement('label', 'Oversample').parent(wdOversampleDiv);
    wdOversampleSlider = createSlider(0, 4, 2, 2).parent(wdOversampleDiv);
    wdOversampleSlider.input(updateDistortion);

    let wdDryWetDiv = createDiv().addClass('control').parent(distortionGroup);
    wdDryWetLabel = createElement('label', 'Dry/Wet').parent(wdDryWetDiv);
    wdDryWetSlider = createSlider(0, 1, 1, 0.01).parent(wdDryWetDiv);
    wdDryWetSlider.input(updateDistortion);

    let wdOutputDiv = createDiv().addClass('control').parent(distortionGroup);
    wdOutputLabel = createElement('label', 'Output Level').parent(wdOutputDiv);
    wdOutputSlider = createSlider(0, 1, 1, 0.01).parent(wdOutputDiv);
    wdOutputSlider.input(updateDistortion);

    distortionHeader.mouseClicked(() => togglePanel(distortionContent));

    // Reverb Panel
    let reverbPanel = createDiv().addClass('panel').parent(container);
    let reverbHeader = createElement('h3', 'Reverb').parent(reverbPanel);
    let reverbContent = createDiv().addClass('panel-content').parent(reverbPanel);
    let reverbGroup = createDiv().addClass('control-group').parent(reverbContent);

    let rvDurationDiv = createDiv().addClass('control').parent(reverbGroup);
    rvDurationLabel = createElement('label', 'Duration').parent(rvDurationDiv);
    rvDurationSlider = createSlider(0.1, 10, 2, 0.1).parent(rvDurationDiv);
    rvDurationSlider.input(updateReverb);

    let rvDecayDiv = createDiv().addClass('control').parent(reverbGroup);
    rvDecayLabel = createElement('label', 'Decay').parent(rvDecayDiv);
    rvDecaySlider = createSlider(0.1, 10, 2, 0.1).parent(rvDecayDiv);
    rvDecaySlider.input(updateReverb);

    let rvDryWetDiv = createDiv().addClass('control').parent(reverbGroup);
    rvDryWetLabel = createElement('label', 'Dry/Wet').parent(rvDryWetDiv);
    rvDryWetSlider = createSlider(0, 1, 1, 0.01).parent(rvDryWetDiv);
    rvDryWetSlider.input(updateReverb);

    let rvOutputDiv = createDiv().addClass('control').parent(reverbGroup);
    rvOutputLabel = createElement('label', 'Output Level').parent(rvOutputDiv);
    rvOutputSlider = createSlider(0, 1, 1, 0.01).parent(rvOutputDiv);
    rvOutputSlider.input(updateReverb);

    rvReverseButton = createButton('Reverse').parent(reverbGroup);
    rvReverseButton.mousePressed(toggleReverbReverse);

    reverbHeader.mouseClicked(() => togglePanel(reverbContent));

    // Delay Panel
    let delayPanel = createDiv().addClass('panel').parent(container);
    let delayHeader = createElement('h3', 'Delay').parent(delayPanel);
    let delayContent = createDiv().addClass('panel-content').parent(delayPanel);
    let delayGroup = createDiv().addClass('control-group').parent(delayContent);

    let delayTimeDiv = createDiv().addClass('control').parent(delayGroup);
    delayTimeLabel = createElement('label', 'Delay Time').parent(delayTimeDiv);
    delayTimeSlider = createSlider(0.1, 2, 0.1, 0.01).parent(delayTimeDiv);
    delayTimeSlider.input(updateDelayTime);

    let delayFeedbackDiv = createDiv().addClass('control').parent(delayGroup);
    delayFeedbackLabel = createElement('label', 'Feedback').parent(delayFeedbackDiv);
    delayFeedbackSlider = createSlider(0, 1, 0, 0.01).parent(delayFeedbackDiv);
    delayFeedbackSlider.input(updateDelayFeedback);

    let delayFilterDiv = createDiv().addClass('control').parent(delayGroup);
    delayFilterLabel = createElement('label', 'Filter Frequency').parent(delayFilterDiv);
    delayFilterSlider = createSlider(500, 5000, 500, 10).parent(delayFilterDiv);
    delayFilterSlider.input(updateDelayFilter);

    delayHeader.mouseClicked(() => togglePanel(delayContent));

    // Master Volume Panel
    let masterPanel = createDiv().addClass('panel').parent(container);
    let masterHeader = createElement('h3', 'Master Volume').parent(masterPanel);
    let masterContent = createDiv().addClass('panel-content').parent(masterPanel);
    let masterGroup = createDiv().addClass('control-group').parent(masterContent);

    let mvVolumeDiv = createDiv().addClass('control').parent(masterGroup);
    mvVolumeLabel = createElement('label', 'Level').parent(mvVolumeDiv);
    mvVolumeSlider = createSlider(0, 1, 0.5, 0.01).parent(mvVolumeDiv);
    mvVolumeSlider.input(updateMasterVolume);

    masterHeader.mouseClicked(() => togglePanel(masterContent));

    // Settings Panel
    let settingsPanel = createDiv().addClass('panel').parent(container);
    let settingsHeader = createElement('h3', 'Settings').parent(settingsPanel);
    let settingsContent = createDiv().addClass('panel-content').parent(settingsPanel);
    let settingsGroup = createDiv().addClass('control-group').parent(settingsContent);

    let lpfTypeDiv = createDiv().addClass('control').parent(settingsGroup);
    lpfTypeLabel = createElement('label', 'Filter Type').parent(lpfTypeDiv);
    lpfTypeSelector = createSelect().parent(lpfTypeDiv);
    lpfTypeSelector.option('low-pass');
    lpfTypeSelector.option('high-pass');
    lpfTypeSelector.option('band-pass');
    lpfTypeSelector.selected('low-pass');
    lpfTypeSelector.changed(updateFilterType);

    let audioSourceDiv = createDiv().addClass('control').parent(settingsGroup);
    audioSourceLabel = createElement('label', 'Audio Source').parent(audioSourceDiv);
    audioSourceSelector = createSelect().parent(audioSourceDiv);
    audioSourceSelector.option('pre-recorded');
    audioSourceSelector.option('microphone');
    audioSourceSelector.selected('pre-recorded');
    audioSourceSelector.changed(updateAudioSource);

    settingsHeader.mouseClicked(() => togglePanel(settingsContent));
}

function togglePanel(content) {
    content.toggleClass('hidden');
}

function stopSound() {
    if (sound.isPlaying()) {
        sound.stop();
    }
    
    if (mic) {
        mic.stop();
        mic.disconnect();
    }
    
    delay.amp(0);
    isPlaying = false;
}

function pauseSound() {
    if (sound.isPlaying()) {
        sound.pause();
        delay.amp(0);
    }
    
    if (mic) {
        mic.stop();
        mic.disconnect();
    }

    isPlaying = false;
}

function playSound() {
    if (isPlaying) {
        stopSound();
    }

    if (audioSourceSelector.value() === 'pre-recorded') {
        if (!sound.isPlaying()) {
            sound.connect(lpf);
            recorder.setInput(masterGain);

            if (sound.isLooping()) {
                sound.loop();
            } else {
                sound.play();
            }

            sound.onended(() => {
                isPlaying = false;
            });

            isPlaying = true;
        }
    } else if (audioSourceSelector.value() === 'microphone') {
        mic.start(() => {
            mic.connect(lpf);
            recorder.setInput(mic);
        });

        isPlaying = true;
    }

    delay.process(compressor, delayTimeSlider.value(), delayFeedbackSlider.value(), delayFilterSlider.value());
    delay.amp(1);
}

function skipToStart() {
    let selectedSource = audioSourceSelector.value();

    if (selectedSource === 'pre-recorded') {
        if (sound.isPlaying()) {
            sound.stop();
        }

        sound.disconnect();
        sound.connect(lpf);
        recorder.setInput(masterGain);

        setTimeout(() => {
            sound.play();
        }, 50);
    }
}

function skipToEnd() {
    if (audioSourceSelector.value() === 'pre-recorded') {
        sound.jump(sound.duration() - 5);
    }
    isPlaying = false;
}

function toggleLoop() {
    if (sound.isLooping()) {
        sound.setLoop(false);
        loopButton.html('Loop');
    } else {
        sound.setLoop(true);
        loopButton.html('Unloop');
        if (!isPlaying) {
            sound.loop();
            isPlaying = true;
        }
    }
}

function toggleRecording() {
    if (!isRecording) {
        recorder.record(soundFile);
        recordButton.html('Stop Recording').addClass('active');
        isRecording = true;
    } else {
        recorder.stop();
        if (soundFile.duration() > 0) {
            save(soundFile, 'processed_audio.wav');
        } else {
            console.error('No audio recorded.');
        }
        recordButton.html('Record').removeClass('active');
        isRecording = false;
    }
}

function updateLPF() {
    let freq = lpCutOffSlider.value();
    let res = lpResonanceSlider.value();
    let drywet = lpDryWetSlider.value();
    let output = lpOutputSlider.value();
    lpf.freq(freq);
    lpf.res(res);
    lpf.drywet(drywet);
    lpf.amp(output);
}

function updateDistortion() {
    let amount = wdAmountSlider.value() / 100;
    let oversample = wdOversampleSlider.value() === 0 ? 'none' : wdOversampleSlider.value() === 2 ? '2x' : '4x';
    let drywet = wdDryWetSlider.value();
    let output = wdOutputSlider.value();
    distortion.process(lpf, amount, oversample);
    distortion.drywet(drywet);
    distortion.amp(output);
}

function updateCompressor() {
    let attack = dcAttackSlider.value();
    let knee = dcKneeSlider.value();
    let release = dcReleaseSlider.value();
    let ratio = Math.min(Math.max(dcRatioSlider.value(), 1), 20);
    let threshold = Math.min(Math.max(dcThresholdSlider.value(), -100), 0);
    let drywet = dcDryWetSlider.value();
    let output = dcOutputSlider.value();
    compressor.process(delay, attack, knee, threshold, ratio, release);
    compressor.drywet(drywet);
    compressor.amp(output);
}

function updateReverb() {
    let duration = rvDurationSlider.value();
    let decay = rvDecaySlider.value();
    let drywet = rvDryWetSlider.value();
    let output = rvOutputSlider.value();
    reverb.process(compressor, duration, decay);
    reverb.drywet(drywet);
    reverb.amp(output);
}

function toggleReverbReverse() {
    let reverse = reverb.getWet() > 0.5;
    reverb.drywet(reverse ? 0 : 1);
    rvReverseButton.html(reverse ? 'Reverse' : 'Normal');
}

function updateMasterVolume() {
    let vol = mvVolumeSlider.value();
    masterGain.amp(vol);
}

function updateFilterType() {
    let selectedType = lpfTypeSelector.value();
    if (selectedType === 'low-pass') {
        lpf.setType('lowpass');
    } else if (selectedType === 'high-pass') {
        lpf.setType('highpass');
    } else if (selectedType === 'band-pass') {
        lpf.setType('bandpass');
    }
}

function updateAudioSource() {
    let selectedSource = audioSourceSelector.value();

    if (mic) {
        mic.stop();
        mic.disconnect();
    }

    if (sound.isPlaying()) {
        sound.stop();
        sound.disconnect();
    }

    if (selectedSource === 'pre-recorded') {
        sound.connect(lpf);
        recorder.setInput(masterGain);
        delay.process(compressor, delayTimeSlider.value(), delayFeedbackSlider.value(), delayFilterSlider.value());
    } else if (selectedSource === 'microphone') {
        if (!mic) {
            isPlaying = false;
            mic = new p5.AudioIn();
            mic.connect(lpf);
            recorder.setInput(mic);
            delay.process(compressor, delayTimeSlider.value(), delayFeedbackSlider.value(), delayFilterSlider.value());
        }
    }
    isPlaying = false;
}

function updateDelayTime() {
    let delayTime = delayTimeSlider.value();
    delay.process(compressor, delayTime, delayFeedbackSlider.value(), delayFilterSlider.value());
    delay.amp(1);
}

function updateDelayFeedback() {
    let feedback = delayFeedbackSlider.value();
    delay.process(compressor, delayTimeSlider.value(), feedback, delayFilterSlider.value());
    delay.amp(1);
}

function updateDelayFilter() {
    let filterFrequency = delayFilterSlider.value();
    delay.process(compressor, delayTimeSlider.value(), delayFeedbackSlider.value(), filterFrequency);
    delay.amp(1);
}