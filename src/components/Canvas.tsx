import { forwardRef, useState, useRef, useEffect } from 'react';
import { CanvasElement } from '../App';
import { Rnd } from 'react-rnd';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from './ui/context-menu';
import { Copy, Trash2, Lock, Unlock, Eye, EyeOff, MoveUp, MoveDown, Layers } from 'lucide-react';

interface CanvasProps {
  elements: CanvasElement[];
  selectedElement: string | null;
  selectedIds?: string[];
  onSelectElement: (id: string | null) => void;
  onMultiSelect?: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onUpdateElementTransient: (id: string, updates: Partial<CanvasElement>) => void;
  tool: string;
  zoom: number;
  canvasSize: { width: number; height: number };
  canvasBg: string;
  canvasBgImage?: string | null;
  onAddElement: (element: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onCopy: () => void;
  onPaste: () => void;
  showGrid: boolean;
  showGuides: boolean;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(
  ({ elements, selectedElement, selectedIds, onSelectElement, onMultiSelect, onUpdateElement, onUpdateElementTransient, tool, zoom, canvasSize, canvasBg, canvasBgImage, onAddElement, onDeleteElement, onDuplicateElement, onBringToFront, onSendToBack, onCopy, onPaste, showGrid, showGuides }, ref) => {
    const [editingText, setEditingText] = useState<string | null>(null);
    const [textValue, setTextValue] = useState('');
    const [isPanning, setIsPanning] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);
    const [isDrawingPen, setIsDrawingPen] = useState(false);
    // Pencil tool state
    const [pencilPoints, setPencilPoints] = useState<{ x: number; y: number }[]>([]);
    const [isDrawingPencil, setIsDrawingPencil] = useState(false);
    const rafIdRef = useRef<number | null>(null);
    const [rotating, setRotating] = useState<{
      id: string | null;
      startAngle: number;
      startRotation: number;
      center: { x: number; y: number } | null;
    }>({ id: null, startAngle: 0, startRotation: 0, center: null });
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const zoomScale = zoom / 100;

    const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-artboard')) {
        // If using move tool and an element is selected, move it to the click position (centered), no dragging needed
        if (tool === 'move' && selectedElement) {
          const artboardEl = (ref as any)?.current as HTMLDivElement | null;
          const rect = artboardEl?.getBoundingClientRect();
          if (rect) {
            // Map click within transformed artboard to canvas coordinates
            const relX = ((e.clientX - rect.left) / rect.width) * canvasSize.width;
            const relY = ((e.clientY - rect.top) / rect.height) * canvasSize.height;
            const el = elements.find(el => el.id === selectedElement);
            if (el && !el.locked) {
              const newX = Math.round(relX - el.width / 2);
              const newY = Math.round(relY - el.height / 2);
              onUpdateElement(selectedElement, { x: newX, y: newY });
            }
            return; // prevent deselecting when we move
          }
        }
        // Otherwise, clicking empty canvas deselects and finalizes pen tool if active
        onSelectElement(null);
        if (tool === 'pen') {
          if (penPoints.length > 1) {
            finishPenDrawing();
          }
        }
      }
    };

    // Rotation handlers
    const beginRotate = (e: React.MouseEvent, elementId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const node = itemRefs.current[elementId];
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const startAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
      const el = elements.find(el => el.id === elementId);
      const startRotation = (el?.rotation || 0);
      setRotating({ id: elementId, startAngle, startRotation, center });
    };

    useEffect(() => {
      const handleMove = (e: MouseEvent) => {
        if (!rotating.id || !rotating.center) return;
        const currentAngle = Math.atan2(e.clientY - rotating.center.y, e.clientX - rotating.center.x);
        const delta = currentAngle - rotating.startAngle;
        const deg = rotating.startRotation + (delta * 180) / Math.PI;
        onUpdateElementTransient(rotating.id, { rotation: deg });
      };

      const handleUp = () => {
        if (rotating.id != null) {
          // Commit rotation to history
          const el = elements.find(el => el.id === rotating.id);
          if (el) {
            onUpdateElement(rotating.id, { rotation: el.rotation });
          }
        }
        setRotating({ id: null, startAngle: 0, startRotation: 0, center: null });
      };

      if (rotating.id) {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp, { once: true });
      }
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }, [rotating, elements, onUpdateElementTransient]);

    const handleTextDoubleClick = (element: CanvasElement) => {
      setEditingText(element.id);
      setTextValue(element.content || '');
    };

    const handleTextBlur = () => {
      if (editingText) {
        onUpdateElement(editingText, { content: textValue });
        setEditingText(null);
      }
    };

    const handleTextKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextBlur();
      }
    };

    // Hand tool panning
    const handleMouseDown = (e: React.MouseEvent) => {
      if (tool === 'hand') {
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isPanning && tool === 'hand') {
        e.preventDefault();
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
      }
    };

    // Pen tool drawing
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (tool === 'pen' && e.target === e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        let x = (e.clientX - rect.left) / zoomScale;
        let y = (e.clientY - rect.top) / zoomScale;
        if (showGrid) {
          const grid = 10;
          x = Math.round(x / grid) * grid;
          y = Math.round(y / grid) * grid;
        }
        
        setIsDrawingPen(true);
        setPenPoints([{ x, y }]);
      } else if (tool === 'pencil' && e.target === e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomScale;
        const y = (e.clientY - rect.top) / zoomScale;
        setIsDrawingPencil(true);
        setPencilPoints([{ x, y }]);
        // start raf loop for live preview accumulation
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        const loop = () => {
          rafIdRef.current = requestAnimationFrame(loop);
          // no-op: we rely on state updates for preview through JSX
        };
        rafIdRef.current = requestAnimationFrame(loop);
      }
    };

    const handleCanvasMouseMoveForPen = (e: React.MouseEvent<HTMLDivElement>) => {
      if (tool === 'pen' && isDrawingPen) {
        const rect = e.currentTarget.getBoundingClientRect();
        let x = (e.clientX - rect.left) / zoomScale;
        let y = (e.clientY - rect.top) / zoomScale;
        if (showGrid) {
          const grid = 10;
          x = Math.round(x / grid) * grid;
          y = Math.round(y / grid) * grid;
        }
        setPenPoints(prev => [...prev, { x, y }]);
      } else if (tool === 'pencil' && isDrawingPencil) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomScale;
        const y = (e.clientY - rect.top) / zoomScale;
        setPencilPoints(prev => [...prev, { x, y }]);
      }
    };

    const handleCanvasMouseUpForPen = () => {
      if (tool === 'pen' && isDrawingPen) {
        setIsDrawingPen(false);
        if (penPoints.length > 1) {
          finishPenDrawing();
        }
      } else if (tool === 'pencil' && isDrawingPencil) {
        setIsDrawingPencil(false);
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (pencilPoints.length > 1) {
          finishPencilDrawing();
        }
      }
    };

    const finishPenDrawing = () => {
      if (penPoints.length < 2) return;

      // Calculate bounding box
      const xs = penPoints.map(p => p.x);
      const ys = penPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      // Normalize points relative to bounding box
      const normalizedPoints = penPoints.map(p => ({
        x: p.x - minX,
        y: p.y - minY,
      }));

      // Create SVG path
      let pathData = `M ${normalizedPoints[0].x} ${normalizedPoints[0].y}`;
      for (let i = 1; i < normalizedPoints.length; i++) {
        pathData += ` L ${normalizedPoints[i].x} ${normalizedPoints[i].y}`;
      }

      const newElement: CanvasElement = {
        id: `element-${Date.now()}`,
        type: 'path',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        pathData,
        points: normalizedPoints,
        strokeColor: '#3b82f6',
        strokeWidth: 2,
        opacity: 1,
        rotation: 0,
        visible: true,
        locked: false,
      };

      onAddElement(newElement);
      setPenPoints([]);
    };

    // Simple Chaikin smoothing applied AFTER drawing for Pencil
    const smoothPoints = (pts: { x: number; y: number }[], iterations = 2) => {
      let result = pts.slice();
      for (let it = 0; it < iterations; it++) {
        const newPts: { x: number; y: number }[] = [];
        for (let i = 0; i < result.length - 1; i++) {
          const p0 = result[i];
          const p1 = result[i + 1];
          const Q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
          const R = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
          newPts.push(Q, R);
        }
        result = [result[0], ...newPts, result[result.length - 1]];
      }
      return result;
    };

    const finishPencilDrawing = () => {
      if (pencilPoints.length < 2) return;
      const pts = smoothPoints(pencilPoints);

      // bounding box
      const xs = pts.map(p => p.x);
      const ys = pts.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      const normalized = pts.map(p => ({ x: p.x - minX, y: p.y - minY }));
      let pathData = `M ${normalized[0].x} ${normalized[0].y}`;
      for (let i = 1; i < normalized.length; i++) {
        pathData += ` L ${normalized[i].x} ${normalized[i].y}`;
      }

      const newElement: CanvasElement = {
        id: `element-${Date.now()}`,
        type: 'path',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        pathData,
        points: normalized,
        strokeColor: '#3b82f6',
        strokeWidth: 2,
        opacity: 1,
        rotation: 0,
        visible: true,
        locked: false,
      };
      onAddElement(newElement);
      setPencilPoints([]);
    };

    // Image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageSrc = event.target?.result as string;
          const newElement: CanvasElement = {
            id: `element-${Date.now()}`,
            type: 'image',
            x: 100,
            y: 100,
            width: 300,
            height: 200,
            imageSrc,
            opacity: 1,
            rotation: 0,
            visible: true,
            locked: false,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
          };
          onAddElement(newElement);
          // notifications disabled
        };
        reader.readAsDataURL(file);
      }
    };

    // Trigger image upload when image tool is selected
    // disable auto image picker from Canvas; Toolbar handles image uploads

    // Drag and drop for images
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageSrc = event.target?.result as string;
          const rect = canvasContainerRef.current?.getBoundingClientRect();
          const x = rect ? (e.clientX - rect.left) / zoomScale : 100;
          const y = rect ? (e.clientY - rect.top) / zoomScale : 100;
          // If a shape is selected, set its fillImageSrc instead of adding a new image layer
          if (selectedElement) {
            const sel = elements.find(el => el.id === selectedElement);
            if (sel && sel.type === 'shape') {
              onUpdateElement(selectedElement, { fillImageSrc: imageSrc } as any);
              return;
            }
          }
          // Otherwise, add as a new image element
          const newElement: CanvasElement = {
            id: `element-${Date.now()}`,
            type: 'image',
            x,
            y,
            width: 300,
            height: 200,
            imageSrc,
            opacity: 1,
            rotation: 0,
            visible: true,
            locked: false,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
          };
          onAddElement(newElement);
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div 
        className={`flex-1 bg-[#1e1e1e] overflow-hidden ${tool === 'hand' ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        <div
          ref={canvasContainerRef}
          className="relative w-full h-full flex items-center justify-center"
          style={{
            padding: '100px',
          }}
        >
          <div
            style={{
              transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
            }}
          >
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                ref={ref}
                className="canvas-artboard relative shadow-2xl border border-[#3d3d3d]"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  backgroundColor: canvasBg,
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMoveForPen}
                onMouseUp={handleCanvasMouseUpForPen}
              >
                {/* Background image cover-fit */}
                {canvasBgImage && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${canvasBgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                {/* Grid background */}
                {showGrid && (
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #999 1px, transparent 1px),
                        linear-gradient(to bottom, #999 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                    }}
                  />
                )}

                {/* Guides */}
                {showGuides && (
                  <>
                    {/* Vertical center */}
                    <div
                      className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400/50 pointer-events-none"
                      style={{ transform: 'translateX(-0.5px)' }}
                    />
                    {/* Horizontal center */}
                    <div
                      className="absolute left-0 right-0 top-1/2 h-px bg-cyan-400/50 pointer-events-none"
                      style={{ transform: 'translateY(-0.5px)' }}
                    />
                  </>
                )}

                {/* Pen tool preview */}
                {tool === 'pen' && penPoints.length > 0 && (
                  <svg className="absolute inset-0 pointer-events-none">
                    <polyline
                      points={penPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  </svg>
                )}

                {/* Render elements */}
                {elements.map((element) => {
                  if (!element.visible) return null;

                  const isSelected = (Array.isArray(selectedIds) && selectedIds.includes(element.id)) || element.id === selectedElement;
                  const isEditing = element.id === editingText;

                  return (
                    <ContextMenu key={element.id}>
                      <ContextMenuTrigger>
                        <Rnd
                          position={{ x: element.x, y: element.y }}
                          size={{ width: element.width, height: element.height }}
                          scale={zoomScale}
                          resizeHandleComponent={{
                            topLeft: <div className="w-3 h-3 rounded-sm bg-white border border-blue-500" />,
                            topRight: <div className="w-3 h-3 rounded-sm bg-white border border-blue-500" />,
                            bottomLeft: <div className="w-3 h-3 rounded-sm bg-white border border-blue-500" />,
                            bottomRight: <div className="w-3 h-3 rounded-sm bg-white border border-blue-500" />,
                          }}
                          onDrag={(e, d) => {
                            if (!element.locked && (tool === 'select' || tool === 'move')) {
                              onUpdateElementTransient(element.id, { x: d.x, y: d.y });
                            }
                          }}
                          onDragStop={(e, d) => {
                            if (!element.locked && (tool === 'select' || tool === 'move')) {
                              onUpdateElement(element.id, { x: d.x, y: d.y });
                            }
                          }}
                          onResize={(e, direction, ref, delta, position) => {
                            if (!element.locked && (tool === 'select' || tool === 'move')) {
                              onUpdateElementTransient(element.id, {
                                width: parseInt(ref.style.width),
                                height: parseInt(ref.style.height),
                                ...position,
                              });
                            }
                          }}
                          onResizeStop={(e, direction, ref, delta, position) => {
                            if (!element.locked) {
                              onUpdateElement(element.id, {
                                width: parseInt(ref.style.width),
                                height: parseInt(ref.style.height),
                                ...position,
                              });
                            }
                          }}
                          enableResizing={!element.locked && (tool === 'select' || tool === 'move')}
                          disableDragging={element.locked || !(tool === 'select' || tool === 'move')}
                          onMouseDown={(e) => {
                            if (tool === 'hand') {
                              // Don't stop propagation for hand tool - let it bubble up for panning
                              return;
                            }
                            e.stopPropagation();
                            if (!isEditing && (tool === 'select' || tool === 'move')) {
                              if (e.shiftKey && onMultiSelect) {
                                // toggle selection membership
                                const current = new Set<string>(selectedIds || (selectedElement ? [selectedElement] : []));
                                if (current.has(element.id)) current.delete(element.id); else current.add(element.id);
                                const ids = Array.from(current);
                                onMultiSelect(ids);
                                // also set primary for property panel focus
                                onSelectElement(ids[0] || null);
                              } else {
                                onSelectElement(element.id);
                                onMultiSelect && onMultiSelect([element.id]);
                              }
                            }
                          }}
                          className={`${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                            element.locked
                              ? 'cursor-not-allowed'
                              : (tool === 'select' || tool === 'move')
                                ? 'cursor-move'
                                : tool === 'hand'
                                  ? 'cursor-grab'
                                  : 'cursor-default'
                          }`}
                          style={{
                            opacity: element.opacity || 1,
                            pointerEvents: tool === 'hand' ? 'none' : 'auto',
                          }}
                        >
                          <div
                            ref={(el) => { itemRefs.current[element.id] = el; }}
                            className="w-full h-full relative"
                            style={{
                              transform: `rotate(${element.rotation || 0}deg) scaleX(${element.scaleX ?? 1}) scaleY(${element.scaleY ?? 1})`,
                            }}
                          >
                            {/* Rotation handle and size label when selected */}
                            {isSelected && (tool === 'select' || tool === 'move') && (
                              <>
                                {/* Rotation handle */}
                                <div
                                  onMouseDown={(e) => beginRotate(e, element.id)}
                                  className="absolute -top-6 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border border-blue-500 cursor-crosshair"
                                />
                                {/* Size label */}
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded">
                                  {Math.round(element.width)} × {Math.round(element.height)}
                                </div>
                              </>
                            )}
                            {/* Shape element */}
                            {element.type === 'shape' && (
                              <>
                                {element.shapeType === 'rectangle' && (
                                  <div className="w-full h-full relative"
                                    style={{
                                      borderRadius: `${element.borderRadius || 0}px`,
                                      border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.strokeColor}` : 'none',
                                    }}
                                  >
                                    {/* background color underlay */}
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        backgroundColor: element.backgroundColor,
                                        borderRadius: `${element.borderRadius || 0}px`,
                                        opacity: (element.fillOpacity || 100) / 100,
                                      }}
                                    />
                                    {/* image fill overlay */}
                                    {element.fillImageSrc && (
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          backgroundImage: `url(${element.fillImageSrc})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                          borderRadius: `${element.borderRadius || 0}px`,
                                        }}
                                      />
                                    )}
                                  </div>
                                )}
                                {element.shapeType === 'circle' && (
                                  <div className="w-full h-full relative"
                                    style={{
                                      borderRadius: '50%',
                                      border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.strokeColor}` : 'none',
                                    }}
                                  >
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        backgroundColor: element.backgroundColor,
                                        borderRadius: '50%',
                                        opacity: (element.fillOpacity || 100) / 100,
                                      }}
                                    />
                                    {element.fillImageSrc && (
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          backgroundImage: `url(${element.fillImageSrc})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                          borderRadius: '50%',
                                        }}
                                      />
                                    )}
                                  </div>
                                )}
                                {(element.shapeType === 'triangle' || element.shapeType === 'star' || element.shapeType === 'polygon') && (
                                  <svg className="w-full h-full" viewBox={`0 0 ${element.width} ${element.height}`}> 
                                    <defs>
                                      <clipPath id={`clip-${element.id}`}>
                                        {element.shapeType === 'triangle' && (
                                          <polygon points={`${element.width / 2},0 ${element.width},${element.height} 0,${element.height}`} />
                                        )}
                                        {element.shapeType === 'star' && (() => {
                                          const cx = element.width / 2; const cy = element.height / 2;
                                          const outerR = Math.min(element.width, element.height) / 2;
                                          const innerR = outerR / 2.5; const points: string[] = [];
                                          for (let i = 0; i < 10; i++) {
                                            const ang = (Math.PI / 5) * i - Math.PI / 2;
                                            const r = i % 2 === 0 ? outerR : innerR;
                                            const x = cx + r * Math.cos(ang);
                                            const y = cy + r * Math.sin(ang);
                                            points.push(`${x},${y}`);
                                          }
                                          return <polygon points={points.join(' ')} />;
                                        })()}
                                        {element.shapeType === 'polygon' && (() => {
                                          const sides = 6; const cx = element.width / 2; const cy = element.height / 2;
                                          const r = Math.min(element.width, element.height) / 2; const pts: string[] = [];
                                          for (let i = 0; i < sides; i++) {
                                            const ang = (2 * Math.PI * i) / sides - Math.PI / 2;
                                            const x = cx + r * Math.cos(ang);
                                            const y = cy + r * Math.sin(ang);
                                            pts.push(`${x},${y}`);
                                          }
                                          return <polygon points={pts.join(' ')} />;
                                        })()}
                                      </clipPath>
                                    </defs>
                                    {/* background color underlay */}
                                    {element.shapeType === 'triangle' && (
                                      <polygon
                                        points={`${element.width / 2},0 ${element.width},${element.height} 0,${element.height}`}
                                        fill={element.backgroundColor || 'transparent'}
                                        fillOpacity={(element.fillOpacity || 100) / 100}
                                        stroke={element.strokeWidth ? element.strokeColor : 'none'}
                                        strokeWidth={element.strokeWidth || 0}
                                        opacity={element.opacity || 1}
                                      />
                                    )}
                                    {element.shapeType === 'star' && (() => {
                                      const cx = element.width / 2; const cy = element.height / 2;
                                      const outerR = Math.min(element.width, element.height) / 2;
                                      const innerR = outerR / 2.5; const points: string[] = [];
                                      for (let i = 0; i < 10; i++) {
                                        const ang = (Math.PI / 5) * i - Math.PI / 2;
                                        const r = i % 2 === 0 ? outerR : innerR;
                                        const x = cx + r * Math.cos(ang);
                                        const y = cy + r * Math.sin(ang);
                                        points.push(`${x},${y}`);
                                      }
                                      return (
                                        <polygon
                                          points={points.join(' ')}
                                          fill={element.backgroundColor || 'transparent'}
                                          fillOpacity={(element.fillOpacity || 100) / 100}
                                          stroke={element.strokeWidth ? element.strokeColor : 'none'}
                                          strokeWidth={element.strokeWidth || 0}
                                          opacity={element.opacity || 1}
                                        />
                                      );
                                    })()}
                                    {element.shapeType === 'polygon' && (() => {
                                      const sides = 6; const cx = element.width / 2; const cy = element.height / 2;
                                      const r = Math.min(element.width, element.height) / 2; const pts: string[] = [];
                                      for (let i = 0; i < sides; i++) {
                                        const ang = (2 * Math.PI * i) / sides - Math.PI / 2;
                                        const x = cx + r * Math.cos(ang);
                                        const y = cy + r * Math.sin(ang);
                                        pts.push(`${x},${y}`);
                                      }
                                      return (
                                        <polygon
                                          points={pts.join(' ')}
                                          fill={element.backgroundColor || 'transparent'}
                                          fillOpacity={(element.fillOpacity || 100) / 100}
                                          stroke={element.strokeWidth ? element.strokeColor : 'none'}
                                          strokeWidth={element.strokeWidth || 0}
                                          opacity={element.opacity || 1}
                                        />
                                      );
                                    })()}
                                    {/* image fill overlay clipped to shape */}
                                    {element.fillImageSrc && (
                                      <image
                                        href={element.fillImageSrc}
                                        x={0}
                                        y={0}
                                        width={element.width}
                                        height={element.height}
                                        preserveAspectRatio="xMidYMid slice"
                                        clipPath={`url(#clip-${element.id})`}
                                      />
                                    )}
                                  </svg>
                                )}
                              </>
                            )}

                            {/* Text element */}
                            {element.type === 'text' && (
                              <>
                                {isEditing ? (
                                  <textarea
                                    className="w-full h-full bg-transparent border-none outline-none resize-none"
                                    style={{
                                      color: element.color,
                                      fontSize: element.fontSize,
                                      fontWeight: element.fontWeight,
                                      fontFamily: element.fontFamily || 'Inter, Arial, sans-serif',
                                    }}
                                    value={textValue}
                                    onChange={(e) => setTextValue(e.target.value)}
                                    onBlur={handleTextBlur}
                                    onKeyDown={handleTextKeyDown}
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center cursor-text"
                                    style={{
                                      color: element.color,
                                      fontSize: element.fontSize,
                                      fontWeight: element.fontWeight,
                                      fontFamily: element.fontFamily || 'Inter, Arial, sans-serif',
                                      wordBreak: 'break-word',
                                    }}
                                    onDoubleClick={() => handleTextDoubleClick(element)}
                                  >
                                    {element.content}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Image element */}
                            {element.type === 'image' && element.imageSrc && (
                              <img
                                src={element.imageSrc}
                                alt="Canvas element"
                                className="w-full h-full object-cover"
                                style={{
                                  filter: `blur(${element.blur || 0}px) brightness(${element.brightness || 100}%) contrast(${element.contrast || 100}%) saturate(${element.saturation || 100}%)`,
                                  borderRadius: `${element.borderRadius || 0}px`,
                                }}
                              />
                            )}

                            {/* Path element */}
                            {element.type === 'path' && element.pathData && (
                              <svg className="w-full h-full" viewBox={`0 0 ${element.width} ${element.height}`}>
                                <path
                                  d={element.pathData}
                                  fill="none"
                                  stroke={element.strokeColor}
                                  strokeWidth={element.strokeWidth}
                                  opacity={(element.strokeOpacity || 100) / 100}
                                />
                              </svg>
                            )}
                          </div>
                        </Rnd>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
                        <ContextMenuItem onClick={() => onCopy()} className="hover:bg-white/10 cursor-pointer">
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onPaste()} className="hover:bg-white/10 cursor-pointer">
                          <Layers className="mr-2 h-4 w-4" />
                          Paste
                          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onDuplicateElement(element.id)} className="hover:bg-white/10 cursor-pointer">
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-[#3d3d3d]" />
                        <ContextMenuItem onClick={() => onBringToFront(element.id)} className="hover:bg-white/10 cursor-pointer">
                          <MoveUp className="mr-2 h-4 w-4" />
                          Bring to Front
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onSendToBack(element.id)} className="hover:bg-white/10 cursor-pointer">
                          <MoveDown className="mr-2 h-4 w-4" />
                          Send to Back
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-[#3d3d3d]" />
                        <ContextMenuItem 
                          onClick={() => onUpdateElement(element.id, { locked: !element.locked })}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          {element.locked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                          {element.locked ? 'Unlock' : 'Lock'}
                        </ContextMenuItem>
                        <ContextMenuItem 
                          onClick={() => onUpdateElement(element.id, { visible: !element.visible })}
                          className="hover:bg-white/10 cursor-pointer"
                        >
                          {element.visible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                          {element.visible ? 'Hide' : 'Show'}
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-[#3d3d3d]" />
                        <ContextMenuItem 
                          onClick={() => onDeleteElement(element.id)}
                          className="hover:bg-red-500/10 text-red-400 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                          <ContextMenuShortcut>Del</ContextMenuShortcut>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
              <ContextMenuItem onClick={() => onPaste()} className="hover:bg-white/10 cursor-pointer">
                <Layers className="mr-2 h-4 w-4" />
                Paste
                <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-[#3d3d3d]" />
              <ContextMenuItem 
                className="hover:bg-white/10 cursor-pointer"
                onClick={() => {
                  // Placeholder until multi-select refactor
                  if (elements.length > 0) {
                    onSelectElement(elements[elements.length - 1].id);
                  }
                }}
              >
                Select All
                <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          </div>
        </div>
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';
