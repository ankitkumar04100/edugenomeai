// Eye Tracking Module — MediaPipe FaceMesh/Iris in-browser
// Extracts derived metrics only; no video frames leave the browser.

export interface EyeMetrics {
  gaze_x: number;
  gaze_y: number;
  gaze_drift_velocity: number;
  fixation_duration_mean: number;
  fixation_duration_std: number;
  saccade_frequency: number;
  blink_rate: number;
  eye_openness_mean: number;
  face_confidence: number;
  look_away_frequency: number;
}

const EMA_ALPHA = 0.3;

function ema(prev: number, next: number): number {
  return prev * (1 - EMA_ALPHA) + next * EMA_ALPHA;
}

export class EyeTracker {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private faceLandmarker: any = null;
  private running = false;
  private animFrameId: number | null = null;

  // Metric accumulators
  private blinkCount = 0;
  private saccadeCount = 0;
  private lookAwayCount = 0;
  private fixations: number[] = [];
  private lastGaze = { x: 0.5, y: 0.5 };
  private lastBlinkState = false;
  private smoothedMetrics: EyeMetrics | null = null;
  private startTime = 0;
  private lastUpdateTime = 0;
  private onMetrics: ((m: EyeMetrics) => void) | null = null;

  async init(onMetrics: (m: EyeMetrics) => void): Promise<boolean> {
    this.onMetrics = onMetrics;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });

      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', 'true');
      await this.video.play();

      // Dynamic import of MediaPipe
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceLandmarker, FilesetResolver } = vision;
      
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
      });

      this.startTime = performance.now();
      this.lastUpdateTime = this.startTime;
      this.running = true;
      this.processFrame();
      return true;
    } catch (err) {
      console.warn('[EyeTracker] Init failed:', err);
      return false;
    }
  }

  private processFrame = () => {
    if (!this.running || !this.video || !this.faceLandmarker) return;

    const now = performance.now();
    
    if (this.video.readyState >= 2) {
      const results = this.faceLandmarker.detectForVideo(this.video, now);
      
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        const blendshapes = results.faceBlendshapes?.[0]?.categories || [];

        // Extract gaze from iris landmarks (468-477 range)
        const leftIris = landmarks[468] || landmarks[33];
        const rightIris = landmarks[473] || landmarks[263];
        const gazeX = (leftIris.x + rightIris.x) / 2;
        const gazeY = (leftIris.y + rightIris.y) / 2;

        // Gaze drift velocity
        const dx = gazeX - this.lastGaze.x;
        const dy = gazeY - this.lastGaze.y;
        const drift = Math.sqrt(dx * dx + dy * dy);

        // Saccade detection (large rapid movement)
        if (drift > 0.05) this.saccadeCount++;

        // Look away detection
        if (gazeX < 0.1 || gazeX > 0.9 || gazeY < 0.1 || gazeY > 0.9) {
          this.lookAwayCount++;
        }

        // Fixation tracking (small movement = fixation)
        if (drift < 0.01) {
          this.fixations.push(now - this.lastUpdateTime);
        }

        // Blink detection via blendshapes
        const eyeBlinkLeft = blendshapes.find((b: any) => b.categoryName === 'eyeBlinkLeft')?.score || 0;
        const eyeBlinkRight = blendshapes.find((b: any) => b.categoryName === 'eyeBlinkRight')?.score || 0;
        const isBlink = (eyeBlinkLeft + eyeBlinkRight) / 2 > 0.5;
        if (isBlink && !this.lastBlinkState) this.blinkCount++;
        this.lastBlinkState = isBlink;

        // Eye openness
        const eyeOpenLeft = 1 - (blendshapes.find((b: any) => b.categoryName === 'eyeBlinkLeft')?.score || 0);
        const eyeOpenRight = 1 - (blendshapes.find((b: any) => b.categoryName === 'eyeBlinkRight')?.score || 0);
        const eyeOpenness = (eyeOpenLeft + eyeOpenRight) / 2;

        this.lastGaze = { x: gazeX, y: gazeY };
        this.lastUpdateTime = now;

        // Compute metrics every ~1 second
        const elapsed = (now - this.startTime) / 1000;
        if (elapsed > 0.5) {
          const fixMean = this.fixations.length > 0
            ? this.fixations.reduce((a, b) => a + b, 0) / this.fixations.length
            : 0;
          const fixStd = this.fixations.length > 1
            ? Math.sqrt(this.fixations.reduce((a, b) => a + (b - fixMean) ** 2, 0) / this.fixations.length)
            : 0;

          const raw: EyeMetrics = {
            gaze_x: gazeX,
            gaze_y: gazeY,
            gaze_drift_velocity: drift * 60, // per second approx
            fixation_duration_mean: fixMean,
            fixation_duration_std: fixStd,
            saccade_frequency: this.saccadeCount / elapsed,
            blink_rate: (this.blinkCount / elapsed) * 60,
            eye_openness_mean: eyeOpenness,
            face_confidence: 1.0,
            look_away_frequency: this.lookAwayCount / elapsed,
          };

          // Apply EMA smoothing
          if (this.smoothedMetrics) {
            this.smoothedMetrics = {
              gaze_x: ema(this.smoothedMetrics.gaze_x, raw.gaze_x),
              gaze_y: ema(this.smoothedMetrics.gaze_y, raw.gaze_y),
              gaze_drift_velocity: ema(this.smoothedMetrics.gaze_drift_velocity, raw.gaze_drift_velocity),
              fixation_duration_mean: ema(this.smoothedMetrics.fixation_duration_mean, raw.fixation_duration_mean),
              fixation_duration_std: ema(this.smoothedMetrics.fixation_duration_std, raw.fixation_duration_std),
              saccade_frequency: ema(this.smoothedMetrics.saccade_frequency, raw.saccade_frequency),
              blink_rate: ema(this.smoothedMetrics.blink_rate, raw.blink_rate),
              eye_openness_mean: ema(this.smoothedMetrics.eye_openness_mean, raw.eye_openness_mean),
              face_confidence: raw.face_confidence,
              look_away_frequency: ema(this.smoothedMetrics.look_away_frequency, raw.look_away_frequency),
            };
          } else {
            this.smoothedMetrics = raw;
          }

          this.onMetrics?.(this.smoothedMetrics);
        }
      } else {
        // No face detected
        if (this.smoothedMetrics) {
          this.smoothedMetrics.face_confidence = 0;
          this.onMetrics?.(this.smoothedMetrics);
        }
      }
    }

    this.animFrameId = requestAnimationFrame(this.processFrame);
  };

  stop() {
    this.running = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.video = null;
    this.smoothedMetrics = null;
  }

  reset() {
    this.blinkCount = 0;
    this.saccadeCount = 0;
    this.lookAwayCount = 0;
    this.fixations = [];
    this.startTime = performance.now();
  }
}

export const eyeTracker = new EyeTracker();
