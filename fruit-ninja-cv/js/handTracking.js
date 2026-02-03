/**
 * Hand Tracking for Fruit Ninja CV
 * Uses MediaPipe Hands for finger detection
 */

class HandTracker {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.isInitialized = false;
        this.isTracking = false;

        // Tracking data
        this.fingerPosition = null;
        this.lastFingerPosition = null;
        this.smoothedPosition = null;
        this.smoothingFactor = 0.4;

        // Canvas dimensions for coordinate mapping
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        // Video elements
        this.videoElement = null;
        this.cameraFeedElement = null;

        // Callbacks
        this.onTrackingStart = null;
        this.onTrackingUpdate = null;
        this.onTrackingLost = null;
    }

    async init(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.videoElement = document.getElementById('webcam');
        this.cameraFeedElement = document.getElementById('cameraFeed');

        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            this.videoElement.srcObject = stream;
            if (this.cameraFeedElement) {
                this.cameraFeedElement.srcObject = stream;
            }

            await this.videoElement.play();

            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 0, // 0 = lite model for speed
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results) => this.onResults(results));

            // Start camera processing
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.hands.send({ image: this.videoElement });
                },
                width: 640,
                height: 480
            });

            await this.camera.start();

            this.isInitialized = true;
            console.log('Hand tracking initialized');

            return true;
        } catch (error) {
            console.error('Hand tracking init failed:', error);
            return false;
        }
    }

    onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Get index finger tip (landmark 8)
            const indexTip = landmarks[8];

            // Convert normalized coordinates to canvas coordinates
            // Note: x is mirrored for intuitive control
            const x = (1 - indexTip.x) * this.canvasWidth;
            const y = indexTip.y * this.canvasHeight;

            this.lastFingerPosition = this.fingerPosition;
            this.fingerPosition = { x, y };

            // Apply smoothing
            if (this.smoothedPosition) {
                this.smoothedPosition.x += (x - this.smoothedPosition.x) * this.smoothingFactor;
                this.smoothedPosition.y += (y - this.smoothedPosition.y) * this.smoothingFactor;
            } else {
                this.smoothedPosition = { x, y };
            }

            if (!this.isTracking) {
                this.isTracking = true;
                if (this.onTrackingStart) this.onTrackingStart();
            }

            if (this.onTrackingUpdate) {
                this.onTrackingUpdate(this.smoothedPosition.x, this.smoothedPosition.y);
            }
        } else {
            // No hand detected
            if (this.isTracking) {
                this.isTracking = false;
                if (this.onTrackingLost) this.onTrackingLost();
            }
        }
    }

    updateCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    getPosition() {
        return this.smoothedPosition;
    }

    isHandDetected() {
        return this.isTracking;
    }

    async stop() {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.videoElement && this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
    }
}

const handTracker = new HandTracker();
