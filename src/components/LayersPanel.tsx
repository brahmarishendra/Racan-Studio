import { CanvasElement } from '../App';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Eye, EyeOff, Lock, Unlock, Copy, Trash2, Square, Type, Image as ImageIcon, Pen, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface LayersPanelProps {
  elements: CanvasElement[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
}

export function LayersPanel({ 
  elements, 
  selectedElement, 
  onSelectElement, 
  onUpdateElement, 
  onDeleteElement, 
  onDuplicateElement 
}: LayersPanelProps) {
  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const getIcon = (element: CanvasElement) => {
    switch (element.type) {
      case 'text':
        return <Type className="h-3.5 w-3.5 text-white/70" />;
      case 'shape':
        return <Square className="h-3.5 w-3.5 text-white/70" />;
      case 'image':
        return <ImageIcon className="h-3.5 w-3.5 text-white/70" />;
      case 'path':
        return <Pen className="h-3.5 w-3.5 text-white/70" />;
      default:
        return <Square className="h-3.5 w-3.5 text-white/70" />;
    }
  };

  const getLayerName = (element: CanvasElement) => {
    // Check if element has a custom name
    if ((element as any).name) {
      return (element as any).name;
    }
    
    if (element.type === 'text' && element.content) {
      return element.content.substring(0, 20);
    }
    if (element.type === 'shape') {
      return element.shapeType?.charAt(0).toUpperCase() + (element.shapeType?.slice(1) || 'Shape');
    }
    if (element.type === 'image') {
      return 'Image';
    }
    if (element.type === 'path') {
      return 'Path';
    }
    return 'Layer';
  };

  const startEditingLayer = (element: CanvasElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLayer(element.id);
    setEditingName(getLayerName(element));
  };

  const finishEditingLayer = (elementId: string) => {
    if (editingName.trim()) {
      onUpdateElement(elementId, { ...{ name: editingName.trim() } } as any);
      toast.success('Layer renamed');
    }
    setEditingLayer(null);
    setEditingName('');
  };

  return (
    <div className="h-64 bg-[#252525] border-t border-[#333]">
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-[#333]">
          <h3 className="text-white text-xs font-medium">Layers</h3>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {elements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/40 text-xs">No layers yet</p>
                <p className="text-white/30 text-xs mt-1">Add shapes, text, or images to get started</p>
              </div>
            ) : (
              [...elements].reverse().map((element) => (
                <div
                  key={element.id}
                  className={`
                    flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group
                    ${selectedElement === element.id ? 'bg-blue-600/30 border border-blue-500/50' : 'hover:bg-white/5'}
                  `}
                  onClick={() => onSelectElement(element.id)}
                >
                  {getIcon(element)}
                  
                  {editingLayer === element.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => finishEditingLayer(element.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          finishEditingLayer(element.id);
                        } else if (e.key === 'Escape') {
                          setEditingLayer(null);
                          setEditingName('');
                        }
                      }}
                      className="flex-1 h-6 text-xs bg-[#1e1e1e] border-[#3d3d3d] text-white px-2"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className={`flex-1 text-xs truncate ${selectedElement === element.id ? 'text-blue-300' : 'text-white'}`}>
                        {getLayerName(element)}
                      </span>
                      {((element.type === 'image' && element.imageSrc) || (element.type === 'shape' && (element as any).fillImageSrc)) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(element.type === 'image' ? element.imageSrc : (element as any).fillImageSrc) as string}
                          alt="preview"
                          className="h-4 w-6 object-cover rounded-sm border border-[#3d3d3d]"
                          onClick={(e) => { e.stopPropagation(); onSelectElement(element.id); }}
                        />
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
                      onClick={(e) => startEditingLayer(element, e)}
                      title="Rename layer"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement(element.id, { visible: !element.visible });
                        toast.success(element.visible ? 'Layer hidden' : 'Layer visible');
                      }}
                      title={element.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {element.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement(element.id, { locked: !element.locked });
                        toast.success(element.locked ? 'Layer unlocked' : 'Layer locked');
                      }}
                      title={element.locked ? 'Unlock layer' : 'Lock layer'}
                    >
                      {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateElement(element.id);
                      }}
                      title="Duplicate layer"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(element.id);
                      }}
                      title="Delete layer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
