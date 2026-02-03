import { useEffect, useRef, useState, useCallback } from 'react';

export interface HandPosition {
  x: number;
  y: number;
  velocity: number;
  isTracking: boolean;
}

export interface BladePoint {
  x: number;
  y: number;
  timestamp: number;
}

const VELOCITY_THRESHOLD = 5; // Lower = easier to trigger swipe
const TRAIL_LENGTH = 20; // Longer trail for better collision coverage

export function useHandTracking(canvasWidth: number, canvasHeight: number) {
  const [handPosition, setHandPosition] = useState<HandPosition>({
    x: 0,
    y: 0,
    velocity: 0,
    isTracking: false,
  });
  const [isSwiping, setIsSwiping] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(true);
  const [useMouseFallback, setUseMouseFallback] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [cameraAttempted, setCameraAttempted] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const trailRef = useRef<BladePoint[]>([]);
  const lastPositionRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);
  const isMouseDownRef = useRef(false);
  const initStartedRef = useRef(false);
  const canvasDimensionsRef = useRef({ width: canvasWidth, height: canvasHeight });
  const handTrackingActiveRef = useRef(false);
  const isInitializingRef = useRef(false);

  // Keep dimensions ref updated
  useEffect(() => {
    canvasDimensionsRef.current = { width: canvasWidth, height: canvasHeight };
  }, [canvasWidth, canvasHeight]);

  const getTrail = useCallback(() => trailRef.current, []);

  // Mouse/touch handlers - ALWAYS active as fallback
  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX;
    const y = clientY;
    const now = Date.now();

    // Calculate velocity
    let velocity = 0;
    if (lastPositionRef.current) {
      const dx = x - lastPositionRef.current.x;
      const dy = y - lastPositionRef.current.y;
      const dt = Math.max(1, now - lastPositionRef.current.timestamp);
      velocity = Math.sqrt(dx * dx + dy * dy) / (dt / 16.67);
    }

    lastPositionRef.current = { x, y, timestamp: now };

    // Update trail when mouse is down or touch is active
    const isActive = isMouseDownRef.current || 'touches' in e;
    if (isActive) {
      trailRef.current.push({ x, y, timestamp: now });
      if (trailRef.current.length > TRAIL_LENGTH) {
        trailRef.current.shift();
      }
    }

    // Only update position if hand tracking is not actively detecting
    // OR if we're using mouse fallback mode
    // OR if mouse/touch is being used (clicked/touched)
    if (useMouseFallback || isActive || !handTrackingActiveRef.current) {
      setIsSwiping(isActive && velocity > VELOCITY_THRESHOLD);
      setHandPosition({
        x,
        y,
        velocity,
        isTracking: true,
      });
    }
  }, [useMouseFallback]);

  const handlePointerDown = useCallback((e: MouseEvent | TouchEvent) => {
    isMouseDownRef.current = true;
    trailRef.current = [];
  }, []);

  const handlePointerUp = useCallback(() => {
    isMouseDownRef.current = false;
    setIsSwiping(false);
    // Only clear trail if not hand tracking
    if (!handTrackingActiveRef.current) {
      trailRef.current = [];
    }
  }, []);

  // Mouse/touch fallback events - ALWAYS active
  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerDown, handlePointerUp]);

  // MediaPipe hand tracking results handler
  const onResults = useCallback((results: any) => {
    const { width, height } = canvasDimensionsRef.current;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      handTrackingActiveRef.current = true;
      setHandDetected(true);
      
      const landmarks = results.multiHandLandmarks[0];
      // Index fingertip is landmark 8
      const fingertip = landmarks[8];

      // Convert normalized coordinates to canvas coordinates
      // Mirror the x coordinate since camera is mirrored
      const x = (1 - fingertip.x) * width;
      const y = fingertip.y * height;
      const now = Date.now();

      // Calculate velocity
      let velocity = 0;
      if (lastPositionRef.current) {
        const dx = x - lastPositionRef.current.x;
        const dy = y - lastPositionRef.current.y;
        const dt = Math.max(1, now - lastPositionRef.current.timestamp);
        velocity = Math.sqrt(dx * dx + dy * dy) / (dt / 16.67);
      }

      lastPositionRef.current = { x, y, timestamp: now };

      // Add every point for reliable collision detection
      trailRef.current.push({ x, y, timestamp: now });
      if (trailRef.current.length > TRAIL_LENGTH) {
        trailRef.current.shift();
      }

      // Detect swipe
      const newIsSwiping = velocity > VELOCITY_THRESHOLD;
      setIsSwiping(newIsSwiping);

      setHandPosition({
        x,
        y,
        velocity,
        isTracking: true,
      });
    } else {
      handTrackingActiveRef.current = false;
      setHandDetected(false);
      // Don't set isTracking to false - mouse might be active
      // Only clear trail if mouse is not down
      if (!isMouseDownRef.current) {
        trailRef.current = [];
      }
    }
  }, []);

  // Extracted initHandTracking as useCallback so it can be called from both useEffect and requestCamera
  const initHandTracking = useCallback(async () => {
    const INIT_TIMEOUT = 15000; // 15 second timeout (increased for slow networks)

    const initPromise = async () => {
      // Access MediaPipe from global window (loaded via CDN)
      const HandsClass = (window as any).Hands;
      const CameraClass = (window as any).Camera;

      if (!HandsClass || typeof HandsClass !== 'function') {
        throw new Error('MediaPipe failed to load. Check your internet connection.');
      }
      if (!CameraClass || typeof CameraClass !== 'function') {
        throw new Error('MediaPipe Camera failed to load. Check your internet connection.');
      }

      // === FIRST: Request camera permission DIRECTLY ===
      console.log('Requesting camera permission...');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        console.log('Camera permission granted!');
      } catch (permError: any) {
        console.error('Camera permission denied:', permError);
        throw permError; // Re-throw to be handled by outer catch with proper error type
      }

      // Create video element and attach the stream we already have
      const video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      video.style.position = 'absolute';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      document.body.appendChild(video);

      // Attach stream BEFORE playing
      video.srcObject = stream;
      await video.play();
      videoRef.current = video;
      streamRef.current = stream;

      // Initialize MediaPipe Hands with CDN files
      console.log('Loading MediaPipe Hands model...');
      const hands = new HandsClass({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onResults);
      handsRef.current = hands;

      // Camera class will reuse our existing video element with stream
      console.log('Starting hand tracking...');
      const camera = new CameraClass(video, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            try {
              await handsRef.current.send({ image: videoRef.current });
            } catch (e) {
              // Ignore send errors during cleanup
            }
          }
        },
        width: 640,
        height: 480,
      });

      cameraRef.current = camera;
      await camera.start();
      console.log('Hand tracking started successfully');
    };

    try {
      await Promise.race([
        initPromise(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Camera initialization timeout - please try again')), INIT_TIMEOUT)
        )
      ]);
      
      setCameraReady(true);
      setInitError(null);
      console.log('MediaPipe hand tracking initialized successfully');
    } catch (error: any) {
      console.error('Camera init failed:', error);
      
      // Clean up any partial stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Differentiate error types
      const errorMessage = error?.message || 'Unknown error';
      const isPermissionError = 
        error?.name === 'NotAllowedError' || 
        error?.name === 'PermissionDeniedError' ||
        (errorMessage.toLowerCase().includes('permission') && 
         !errorMessage.includes('MediaPipe'));
      
      if (isPermissionError) {
        setPermissionDenied(true);
        setInitError('Camera permission was denied. Check browser settings.');
      } else if (errorMessage.includes('timeout')) {
        setInitError('Camera initialization timed out. Please try again.');
        // Don't set permissionDenied - allow retry
      } else if (errorMessage.includes('MediaPipe')) {
        setInitError('Hand tracking library failed to load. Check your connection.');
        // Don't set permissionDenied - allow retry
      } else {
        setInitError(errorMessage);
        // Don't set permissionDenied - allow retry
      }
    }
  }, [onResults]);

  // Camera stream health monitoring - only run AFTER camera is ready
  useEffect(() => {
    // Don't run health check until camera is successfully initialized
    if (!cameraReady) return;
    
    let healthCheckInterval: ReturnType<typeof setInterval>;
    
    // Give the stream time to stabilize after initialization
    const stabilizationDelay = setTimeout(() => {
      healthCheckInterval = setInterval(() => {
        if (streamRef.current) {
          const videoTracks = streamRef.current.getVideoTracks();
          const isHealthy = videoTracks.length > 0 && 
                            videoTracks[0].readyState === 'live' &&
                            videoTracks[0].enabled;
          
          if (!isHealthy) {
            console.warn('Camera stream may be unhealthy - track state:', 
              videoTracks[0]?.readyState, 'enabled:', videoTracks[0]?.enabled);
            // Don't auto-recover - just log. User can retry manually if needed.
          }
        }
      }, 3000);
    }, 3000);

    return () => {
      clearTimeout(stabilizationDelay);
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
    };
  }, [cameraReady]);

  // Cleanup on unmount only - camera initialization is triggered by user clicking "Enable Camera"
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleCamera = useCallback(() => {
    setShowCamera((prev) => !prev);
  }, []);

  const enableMouseFallback = useCallback(() => {
    setUseMouseFallback(true);
    setPermissionDenied(false);
    setIsLoading(false);
    setHandPosition((prev) => ({ ...prev, isTracking: true }));
  }, []);

  // Explicitly request camera permission - triggers browser popup on user gesture
  const requestCamera = useCallback(async () => {
    // Only block permanently if permission was denied by user
    if (permissionDenied && initError?.includes('permission')) {
      console.log('requestCamera blocked - permission permanently denied');
      return;
    }
    
    // Block if already initializing
    if (isInitializingRef.current || isLoading) {
      console.log('requestCamera blocked - already initializing:', { 
        ref: isInitializingRef.current, 
        loading: isLoading 
      });
      return;
    }
    
    console.log('requestCamera starting...');
    setCameraAttempted(true);
    isInitializingRef.current = true;
    setIsLoading(true);
    setPermissionDenied(false);
    setCameraReady(false);
    setInitError(null); // Clear previous error for retry
    
    // Clean up existing camera/hands if any
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    if (videoRef.current?.parentNode) {
      videoRef.current.parentNode.removeChild(videoRef.current);
      videoRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    try {
      await initHandTracking();
    } finally {
      // Always reset the flag and loading state, even on error
      isInitializingRef.current = false;
      setIsLoading(false);
      console.log('requestCamera finished, ref reset');
    }
  }, [initHandTracking, permissionDenied, initError, isLoading]);

  return {
    handPosition,
    isSwiping,
    showCamera,
    toggleCamera,
    getTrail,
    isLoading,
    permissionDenied,
    useMouseFallback,
    enableMouseFallback,
    requestCamera,
    videoRef,
    streamRef,
    cameraReady,
    handDetected,
    cameraAttempted,
    initError,
  };
}
