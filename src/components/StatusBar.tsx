import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Slider } from './ui/slider';

interface StatusBarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  canvasSize: { width: number; height: number };
  selectedCount: number;
}

export function StatusBar({ zoom, onZoomChange, canvasSize, selectedCount }: StatusBarProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(200, zoom + 10));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(25, zoom - 10));
  };

  const handleFitToScreen = () => {
    onZoomChange(100);
  };

  return (
    <div className="h-10 bg-[#2d2d2d] border-t border-[#3d3d3d] flex items-center justify-between px-4">
      <div className="flex items-center gap-4 text-xs text-white/60">
        <span>Canvas: {canvasSize.width} × {canvasSize.height}px</span>
        {selectedCount > 0 && (
          <>
            <span className="text-white/30">|</span>
            <span>{selectedCount} selected</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 w-32">
          <Slider
            value={[zoom]}
            onValueChange={(value) => onZoomChange(value[0])}
            min={25}
            max={200}
            step={5}
            className="cursor-pointer"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <span className="text-xs text-white/60 w-12 text-center">{zoom}%</span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
          onClick={handleFitToScreen}
          title="Fit to screen"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
