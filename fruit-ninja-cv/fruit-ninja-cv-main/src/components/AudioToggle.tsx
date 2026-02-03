import { Volume2, VolumeX } from 'lucide-react';
import { GestureButton } from './GestureButton';

interface AudioToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  handPosition: { x: number; y: number; isTracking: boolean };
}

export function AudioToggle({ isEnabled, onToggle, handPosition }: AudioToggleProps) {
  return (
    <GestureButton
      onActivate={onToggle}
      handPosition={handPosition}
      className="fixed bottom-4 right-48 z-50 px-4 py-2 rounded-lg font-game text-sm flex items-center gap-2"
      style={{
        background: 'linear-gradient(180deg, #a87832 0%, #8b6320 50%, #725217 100%)',
        border: '2px solid #4a3915',
        boxShadow: 'inset 0 1px 0 rgba(255, 220, 150, 0.3), 0 2px 0 #3d2e0f, 0 4px 8px rgba(0,0,0,0.3)',
        color: '#fff8e7',
        textShadow: '1px 1px 0 #3d2e0f',
      }}
    >
      {isEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      {isEnabled ? 'Sound' : 'Muted'}
    </GestureButton>
  );
}
