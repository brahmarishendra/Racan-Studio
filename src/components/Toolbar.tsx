import { 
  MousePointer2, 
  Hand, 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon,
  Pen,
  Pipette,
  ZoomIn,
  Move,
  Triangle,
  Star,
  Hexagon
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { CanvasElement } from '../App';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

interface ToolbarProps {
  selectedTool: string;
  onSelectTool: (tool: string) => void;
  onAddElement: (element: CanvasElement) => void;
}

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)', shortcut: 'V' },
  { id: 'hand', icon: Hand, label: 'Hand (H)', shortcut: 'H' },
  { id: 'move', icon: Move, label: 'Move (M)', shortcut: 'M' },
];

const shapes = [
  { id: 'rectangle', icon: Square, label: 'Rectangle (R)', shortcut: 'R' },
  { id: 'circle', icon: Circle, label: 'Circle (O)', shortcut: 'O' },
  { id: 'triangle', icon: Triangle, label: 'Triangle', shortcut: '' },
  { id: 'star', icon: Star, label: 'Star', shortcut: '' },
  { id: 'polygon', icon: Hexagon, label: 'Polygon', shortcut: '' },
];

const drawingTools = [
  { id: 'text', icon: Type, label: 'Text (T)', shortcut: 'T' },
  { id: 'pen', icon: Pen, label: 'Pen (P)', shortcut: 'P' },
  { id: 'image', icon: ImageIcon, label: 'Image (I)', shortcut: 'I' },
];

const utilityTools = [
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper (E)', shortcut: 'E' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom (Z)', shortcut: 'Z' },
];

export function Toolbar({ selectedTool, onSelectTool, onAddElement }: ToolbarProps) {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (toolId: string) => {
    onSelectTool(toolId);
    
    // Special handling for image tool
    if (toolId === 'image') {
      fileInputRef.current?.click();
      return;
    }
    
    toast.success(`${toolId} tool activated`, {
      duration: 2000,
      position: 'bottom-center'
    });
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'triangle' | 'star' | 'polygon') => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type: 'shape',
      shapeType,
      x: 100,
      y: 100,
      width: shapeType === 'circle' ? 100 : 150,
      height: 100,
      backgroundColor: '#3b82f6',
      opacity: 1,
      rotation: 0,
      visible: true,
      locked: false,
      borderRadius: 0,
      fillOpacity: 100,
      strokeColor: '#000000',
      strokeWidth: 0,
      strokeOpacity: 100,
    };
    onAddElement(newElement);
    onSelectTool('select');
    toast.success(`${shapeType} added`);
  };

  const handleAddText = () => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      content: 'Double click to edit',
      color: '#ffffff',
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 'normal',
      opacity: 1,
      rotation: 0,
      visible: true,
      locked: false,
    };
    onAddElement(newElement);
    onSelectTool('select');
    toast.success('Text layer added', {
      duration: 2000,
      position: 'bottom-center'
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newElement: CanvasElement = {
          id: `element-${Date.now()}`,
          type: 'image',
          x: 100,
          y: 100,
          width: img.width,
          height: img.height,
          imageSrc: imageUrl,
          opacity: 1,
          rotation: 0,
          visible: true,
          locked: false,
        };
        onAddElement(newElement);
        onSelectTool('select');
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
    
    // Reset the input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-14 bg-[#252525] border-r border-[#333] flex flex-col items-center py-3 gap-1">
        {/* Selection Tools */}
        {tools.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 transition-all ${
                  selectedTool === id
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => handleToolClick(id)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#2d2d2d] text-white border-[#3d3d3d] font-sans">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Separator className="my-2 bg-[#3d3d3d] w-8" />

        {/* Shapes Dropdown */}
        <DropdownMenu open={shapeMenuOpen} onOpenChange={setShapeMenuOpen}>
          <Tooltip>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 transition-all ${
                  shapes.some(s => selectedTool === s.id)
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Square className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <TooltipContent side="right" className="bg-[#2d2d2d] text-white border-[#3d3d3d] font-sans">
              <p>Shapes</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent 
            side="right" 
            align="start"
            className="bg-[#2d2d2d] border-[#3d3d3d] text-white ml-2"
          >
            {shapes.map((shape) => (
              <DropdownMenuItem
                key={shape.id}
                onClick={() => {
                  handleAddShape(shape.id as any);
                  setShapeMenuOpen(false);
                }}
                className="hover:bg-white/10 cursor-pointer flex items-center gap-2"
              >
                <shape.icon className="h-4 w-4" />
                <span>{shape.label}</span>
                {shape.shortcut && <span className="ml-auto text-xs text-white/50">{shape.shortcut}</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator className="my-2 bg-[#3d3d3d] w-8" />

        {/* Drawing Tools */}
        {drawingTools.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 transition-all ${
                  selectedTool === id
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => {
                  if (id === 'text') {
                    handleToolClick('text');
                    handleAddText();
                  } else {
                    handleToolClick(id);
                  }
                }}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#2d2d2d] text-white border-[#3d3d3d] font-sans">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Separator className="my-2 bg-[#3d3d3d] w-8" />

        {/* Utility Tools */}
        {utilityTools.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 transition-all ${
                  selectedTool === id
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => handleToolClick(id)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#2d2d2d] text-white border-[#3d3d3d] font-sans">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Hidden file input for image upload */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>
    </TooltipProvider>
  );
}
