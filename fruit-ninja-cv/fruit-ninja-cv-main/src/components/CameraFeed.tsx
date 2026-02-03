import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { GestureButton } from './GestureButton';

interface CameraFeedProps {
  showCamera: boolean;
  toggleCamera: () => void;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  cameraReady: boolean;
  handPosition: { x: number; y: number; isTracking: boolean };
}

export function CameraFeed({ showCamera, toggleCamera, videoRef, streamRef, cameraReady, handPosition }: CameraFeedProps) {
  const displayVideoRef = useRef<HTMLVideoElement>(null);
  const [streamAttached, setStreamAttached] = useState(false);

  // Clone the stream to the display video when showing camera
  useEffect(() => {
    if (!showCamera || !cameraReady) {
      setStreamAttached(false);
      return;
    }

    const attachStream = () => {
      if (displayVideoRef.current) {
        // Try streamRef first (more reliable), then fallback to videoRef
        const stream = streamRef.current || (videoRef.current?.srcObject as MediaStream);
        if (stream) {
          displayVideoRef.current.srcObject = stream;
          displayVideoRef.current.play().catch(() => {});
          setStreamAttached(true);
          return true;
        }
      }
      return false;
    };

    // Try immediately
    if (attachStream()) return;

    // Retry a few times
    const interval = setInterval(() => {
      if (attachStream()) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [showCamera, cameraReady, videoRef, streamRef]);

  return (
    <>
      {/* Toggle Button - Bottom Right */}
      <GestureButton
        onActivate={toggleCamera}
        handPosition={handPosition}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg font-game text-sm flex items-center gap-2"
        style={{
          background: 'linear-gradient(180deg, #a87832 0%, #8b6320 50%, #725217 100%)',
          border: '2px solid #4a3915',
          boxShadow: 'inset 0 1px 0 rgba(255, 220, 150, 0.3), 0 2px 0 #3d2e0f, 0 4px 8px rgba(0,0,0,0.3)',
          color: '#fff8e7',
          textShadow: '1px 1px 0 #3d2e0f',
        }}
      >
        {showCamera ? (
          <>
            <VideoOff size={16} />
            Camera
          </>
        ) : (
          <>
            <Video size={16} />
            Camera
          </>
        )}
      </GestureButton>

      {/* Camera Preview - Bottom LEFT */}
      {showCamera && (
        <div
          className="fixed bottom-4 left-4 z-40 rounded-lg overflow-hidden shadow-2xl"
          style={{
            border: '3px solid rgba(255, 200, 50, 0.5)',
            width: '200px',
            height: '150px',
            background: '#1a1a1a',
          }}
        >
          {/* Camera Label */}
          <div
            className="absolute top-0 left-0 right-0 z-10 text-center py-1 text-xs font-bold"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'rgba(255, 200, 50, 0.9)',
            }}
          >
            CAMERA
          </div>
          <video
            ref={displayVideoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            autoPlay
            playsInline
            muted
          />
          {!streamAttached && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
