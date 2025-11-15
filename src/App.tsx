import { useState, useRef, useEffect } from 'react';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel';
import { StatusBar } from './components/StatusBar';
import { Toaster } from './components/ui/sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { toast } from 'sonner';
import { AuthDialog } from './components/AuthDialog';
import LoginScreen from './pages/LoginScreen';
import { api } from './lib/api';
import { TemplatesPage } from './pages/TemplatesPage';
import RacanAIWidget from './components/RacanAIWidget';

export interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
  fontFamily?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  rotation?: number;
  opacity?: number;
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'polygon' | 'line';
  imageSrc?: string;
  locked?: boolean;
  visible?: boolean;
  borderRadius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  grayscale?: number;
  glow?: number;
  shadow?: number;
  vignette?: number;
  glass?: number;
  pathData?: string;
  points?: { x: number; y: number }[];
  // Path editing
  controls?: { cx: number; cy: number }[];
  closed?: boolean;
  scaleX?: number;
  scaleY?: number;
  // Image fill for shapes
  fillImageSrc?: string;
  // Image editing
  erasing?: boolean;
  eraseSize?: number;
  // Non-destructive image base
  baseImageSrc?: string;
  // Object removal workflow
  removingObject?: boolean;
  removeBrushSize?: number;
  objectMask?: string; // grayscale mask dataURL (white = remove)
  maskOverlay?: string; // red overlay preview dataURL
  // Background removal preview
  isPreview?: boolean;
  tmpOriginalImage?: string;
}

export interface HistoryState {
  elements: CanvasElement[];
  timestamp: number;
}

interface SavedTemplate {
  id: string;
  name: string;
  elements: CanvasElement[];
  canvasSize: { width: number; height: number };
  canvasBg: string;
  thumbnail: string; // data URL
  createdAt: number;
  isPublic?: boolean;
}

export default function App() {
  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<string>('select');
  const [history, setHistory] = useState<HistoryState[]>([{ elements: [], timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(50);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [canvasBg, setCanvasBg] = useState('#FFFFFF');
  const [canvasBgImage, setCanvasBgImage] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [projectName, setProjectName] = useState<string>('');
  const [askProjectName, setAskProjectName] = useState<boolean>(false);
  const fileOpenRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplatesPage, setShowTemplatesPage] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name: string; avatarUrl?: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [exportPreview, setExportPreview] = useState<{ url: string; format: 'png'|'jpeg'|'svg'; filename: string } | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const lastCloudSaveRef = useRef<number>(0);
  const [exportScale, setExportScale] = useState<1|2|4>(1);
  const [exportTransparent, setExportTransparent] = useState<boolean>(false);

  // Fast restore on refresh (within ms) and autosave
  useEffect(() => {
    try {
      const raw = localStorage.getItem('brand-kit-autosave');
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.elements)) setElements(data.elements);
        if (data && data.canvasSize) setCanvasSize(data.canvasSize);
        if (data && typeof data.canvasBg === 'string') setCanvasBg(data.canvasBg);
        if (data && typeof data.canvasBgImage === 'string') setCanvasBgImage(data.canvasBgImage);
        if (data && typeof data.projectName === 'string') setProjectName(data.projectName);
      }
    } catch {}
    const onBeforeUnload = () => {
      try {
        const payload = JSON.stringify({ elements, canvasSize, canvasBg, canvasBgImage, projectName });
        localStorage.setItem('brand-kit-autosave', payload);
      } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global drag/drop guard to stop browser navigation on drop outside canvas
  useEffect(() => {
    let lastToast = 0;
    const allowDropOnCanvas = (ev: Event) => {
      const t = ev.target as HTMLElement | null;
      if (!t) return false;
      return !!t.closest?.('.canvas-artboard');
    };
    const onDragOver = (e: DragEvent) => {
      if (!allowDropOnCanvas(e)) {
        e.preventDefault();
        try { e.dataTransfer!.dropEffect = 'none'; } catch {}
      }
    };
    const onDrop = (e: DragEvent) => {
      if (!allowDropOnCanvas(e)) {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (now - lastToast > 2000) {
          lastToast = now;
          try { toast.info('Drop onto the canvas to import'); } catch {}
        }
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  // Debounced autosave to localStorage (<= 500ms)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const payload = JSON.stringify({ elements, canvasSize, canvasBg, canvasBgImage, projectName });
        localStorage.setItem('brand-kit-autosave', payload);
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [elements, canvasSize, canvasBg, canvasBgImage, projectName]);

  // Validate and set canvas background color
  const handleCanvasBgChange = (color: string) => {
    // Simple validation - ensure it's a valid color
    const hexRegex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    if (hexRegex.test(color)) {
      const normalizedColor = color.startsWith('#') ? color : `#${color}`;
      setCanvasBg(normalizedColor.toUpperCase());
    } else if (color.trim() === '') {
      setCanvasBg('#FFFFFF');
    } else {
      // Invalid color, keep current value
    }
  };

  const handleCanvasBgImageChange = (dataUrl: string | null) => {
    setCanvasBgImage(dataUrl);
  };

  const changeTemplateCover = async (id: string, dataUrl: string) => {
    try {
      if (user) {
        const updated = await api.templates.update(id, { thumbnail: dataUrl } as any);
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, thumbnail: updated.thumbnail } : t));
        toast.success('Cover updated');
      } else {
        // Local-only mode: update in-memory and localStorage cache if present
        setTemplates(prev => {
          const next = prev.map(t => t.id === id ? { ...t, thumbnail: dataUrl } : t);
          localStorage.setItem('brand-kit-templates', JSON.stringify(next));
          return next;
        });
        toast.success('Cover updated (local)');
      }
    } catch {
      toast.error('Failed to update cover');
    }
  };

  // Google Drive stubs (requires OAuth/Picker setup)
  const openFromDrive = async () => {
    toast.info('Connect Google Drive to enable opening from Drive');
  };
  const saveToDrive = async () => {
    toast.info('Connect Google Drive to enable saving to Drive');
  };

  // Change avatar
  const changeAvatar = async (file: File) => {
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      if (user) {
        const res = await api.auth.updateProfile({ avatarUrl: dataUrl });
        setUser(res.user);
        toast.success('Profile photo updated');
      } else {
        setUser(prev => {
          const next = prev ? { ...prev, avatarUrl: dataUrl } : { id: 'local', email: '', name: 'Guest', avatarUrl: dataUrl };
          try { localStorage.setItem('brand-kit-user-local', JSON.stringify(next)); } catch {}
          return next;
        });
        toast.success('Profile photo set (local)');
      }
    } catch {
      toast.error('Failed to update avatar');
    }
  };

  // Generate thumbnail PNG data URL of current canvas state
  const generateThumbnail = async (): Promise<string> => {
    // Render to offscreen canvas with max width 400 keeping aspect
    const maxW = 400;
    const scale = Math.min(1, maxW / canvasSize.width);
    const w = Math.max(1, Math.round(canvasSize.width * scale));
    const h = Math.max(1, Math.round(canvasSize.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    // Fill background
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.scale(scale, scale);
    // Draw elements (reuse PNG branch logic at scale=scale)
    // Load images first (both image elements and shape fills)
    const imagePromises: Promise<HTMLImageElement>[] = [];
    const imageMap = new Map<string, HTMLImageElement>();
    for (const el of elements) {
      if (el.type === 'image' && el.imageSrc) {
        const p = new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image(); img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img); img.onerror = () => reject(new Error('img'));
          const u = el.imageSrc!;
          img.src = /^https?:\/\//i.test(u) ? `${API_BASE}/proxy/image?url=${encodeURIComponent(u)}` : u;
        }).then(img=>{ imageMap.set(`img:${el.id}`, img); return img; });
        imagePromises.push(p);
      }
      if (el.type === 'shape' && el.fillImageSrc) {
        const p2 = new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image(); img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img); img.onerror = () => reject(new Error('img'));
          const u = el.fillImageSrc!;
          img.src = /^https?:\/\//i.test(u) ? `${API_BASE}/proxy/image?url=${encodeURIComponent(u)}` : u;
        }).then(img=>{ imageMap.set(`fill:${el.id}`, img); return img; });
        imagePromises.push(p2);
      }
    }
    await Promise.allSettled(imagePromises);
    for (const el of elements) {
      if (!el.visible) continue;
      ctx.save();
      ctx.translate(el.x + el.width/2, el.y + el.height/2);
      ctx.rotate((el.rotation || 0) * Math.PI/180);
      ctx.scale(el.scaleX ?? 1, el.scaleY ?? 1);
      ctx.globalAlpha = el.opacity || 1;
      if (el.type === 'shape') {
        // draw background color first (under the image)
        if (el.backgroundColor) {
          ctx.fillStyle = el.backgroundColor;
          ctx.globalAlpha = (el.fillOpacity || 100)/100;
          if (el.shapeType === 'rectangle') {
            if (el.borderRadius) {
              const x=-el.width/2, y=-el.height/2, r=el.borderRadius;
              ctx.beginPath(); ctx.moveTo(x+r,y);
              ctx.arcTo(x+el.width,y,x+el.width,y+el.height,r);
              ctx.arcTo(x+el.width,y+el.height,x,y+el.height,r);
              ctx.arcTo(x,y+el.height,x,y,r);
              ctx.arcTo(x,y,x+el.width,y,r);
              ctx.closePath(); ctx.fill();
            } else {
              ctx.fillRect(-el.width/2, -el.height/2, el.width, el.height);
            }
          } else if (el.shapeType === 'circle') {
            ctx.beginPath(); ctx.arc(0,0,Math.min(el.width, el.height)/2,0,Math.PI*2); ctx.fill();
          } else if (el.shapeType === 'triangle') {
            ctx.beginPath(); ctx.moveTo(0, -el.height/2); ctx.lineTo(el.width/2, el.height/2); ctx.lineTo(-el.width/2, el.height/2); ctx.closePath(); ctx.fill();
          } else if (el.shapeType === 'star') {
            const outerR = Math.min(el.width, el.height)/2; const innerR = outerR*0.4;
            ctx.beginPath(); for (let i=0;i<10;i++){ const r=i%2===0?outerR:innerR; const ang=(i*Math.PI)/5 - Math.PI/2; const x=r*Math.cos(ang); const y=r*Math.sin(ang); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath(); ctx.fill();
          } else if (el.shapeType === 'polygon') {
            const sides=6; const r=Math.min(el.width, el.height)/2; ctx.beginPath(); for (let i=0;i<sides;i++){ const ang=(2*Math.PI*i)/sides - Math.PI/2; const x=r*Math.cos(ang); const y=r*Math.sin(ang); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath(); ctx.fill();
          }
        }
        // draw image fill on top
        if (el.fillImageSrc) {
          const img = imageMap.get(`fill:${el.id}`);
          if (img) {
            ctx.save();
            // build clip path per shape
            if (el.shapeType === 'rectangle') {
              if (el.borderRadius) {
                const x=-el.width/2, y=-el.height/2, r=el.borderRadius;
                ctx.beginPath(); ctx.moveTo(x+r,y);
                ctx.arcTo(x+el.width,y,x+el.width,y+el.height,r);
                ctx.arcTo(x+el.width,y+el.height,x,y+el.height,r);
                ctx.arcTo(x,y+el.height,x,y,r);
                ctx.arcTo(x,y,x+el.width,y,r);
                ctx.closePath(); ctx.clip();
              } else {
                ctx.beginPath(); ctx.rect(-el.width/2, -el.height/2, el.width, el.height); ctx.clip();
              }
            } else if (el.shapeType === 'circle') {
              ctx.beginPath(); ctx.arc(0,0,Math.min(el.width, el.height)/2,0,Math.PI*2); ctx.clip();
            } else if (el.shapeType === 'triangle') {
              ctx.beginPath(); ctx.moveTo(0, -el.height/2); ctx.lineTo(el.width/2, el.height/2); ctx.lineTo(-el.width/2, el.height/2); ctx.closePath(); ctx.clip();
            } else if (el.shapeType === 'star') {
              const outerR = Math.min(el.width, el.height)/2; const innerR = outerR*0.4;
              ctx.beginPath();
              for (let i=0;i<10;i++){ const r=i%2===0?outerR:innerR; const ang=(i*Math.PI)/5 - Math.PI/2; const x=r*Math.cos(ang); const y=r*Math.sin(ang); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath(); ctx.clip();
            } else if (el.shapeType === 'polygon') {
              const sides=6; const r=Math.min(el.width, el.height)/2; ctx.beginPath();
              for (let i=0;i<sides;i++){ const ang=(2*Math.PI*i)/sides - Math.PI/2; const x=r*Math.cos(ang); const y=r*Math.sin(ang); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath(); ctx.clip();
            }
            // cover fit
            const dstW = el.width, dstH = el.height;
            const dstAspect = dstW / dstH;
            const srcAspect = img.width / img.height;
            let sx=0, sy=0, sw=img.width, sh=img.height;
            if (srcAspect > dstAspect) { // crop width
              const newW = img.height * dstAspect; sx = (img.width - newW)/2; sw = newW;
            } else if (srcAspect < dstAspect) { // crop height
              const newH = img.width / dstAspect; sy = (img.height - newH)/2; sh = newH;
            }
            ctx.drawImage(img, sx, sy, sw, sh, -el.width/2, -el.height/2, el.width, el.height);
            ctx.restore();
          }
        }
        if (el.backgroundColor) {
          ctx.fillStyle = el.backgroundColor;
          ctx.globalAlpha = (el.fillOpacity || 100)/100;
          if (el.shapeType === 'rectangle') {
            if (el.borderRadius) {
              const x=-el.width/2, y=-el.height/2, r=el.borderRadius;
              ctx.beginPath(); ctx.moveTo(x+r,y);
              ctx.arcTo(x+el.width,y,x+el.width,y+el.height,r);
              ctx.arcTo(x+el.width,y+el.height,x,y+el.height,r);
              ctx.arcTo(x,y+el.height,x,y,r);
              ctx.arcTo(x,y,x+el.width,y,r);
              ctx.closePath(); ctx.fill();
            } else { ctx.fillRect(-el.width/2, -el.height/2, el.width, el.height); }
          } else if (el.shapeType === 'circle') {
            ctx.beginPath(); ctx.arc(0,0,Math.min(el.width, el.height)/2,0,Math.PI*2); ctx.fill();
          }
        }
        if (el.strokeColor && el.strokeWidth) {
          ctx.strokeStyle = el.strokeColor; ctx.lineWidth = el.strokeWidth;
          if (el.shapeType === 'rectangle') {
            if (el.borderRadius) {
              const x=-el.width/2, y=-el.height/2, r=el.borderRadius;
              ctx.beginPath(); ctx.moveTo(x+r,y);
              ctx.arcTo(x+el.width,y,x+el.width,y+el.height,r);
              ctx.arcTo(x+el.width,y+el.height,x,y+el.height,r);
              ctx.arcTo(x,y+el.height,x,y,r);
              ctx.arcTo(x,y,x+el.width,y,r);
              ctx.closePath(); ctx.stroke();
            } else { ctx.strokeRect(-el.width/2, -el.height/2, el.width, el.height); }
          } else if (el.shapeType === 'circle') {
            ctx.beginPath(); ctx.arc(0,0,Math.min(el.width, el.height)/2,0,Math.PI*2); ctx.stroke();
          }
        }
      } else if (el.type === 'text') {
        ctx.fillStyle = el.color || '#000';
        const fontStyle = el.fontStyle === 'italic' ? 'italic' : '';
        const fontWeight = el.fontWeight || 'normal';
        const fontSize = el.fontSize || 16;
        const fontFamily = el.fontFamily || 'Arial';
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`.trim();
        ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content || '', 0, 0);
      } else if (el.type === 'image' && el.imageSrc) {
        const img = imageMap.get(`img:${el.id}`);
        if (img) {
          const blur = Math.max(0, el.blur || 0);
          const brightness = (el.brightness || 100) / 100;
          const contrast = (el.contrast || 100) / 100;
          const saturation = (el.saturation || 100) / 100;
          const grayscale = (el.grayscale || 0) / 100;
          const filterParts = [] as string[];
          if (blur) filterParts.push(`blur(${blur}px)`);
          if (brightness !== 1) filterParts.push(`brightness(${brightness})`);
          if (contrast !== 1) filterParts.push(`contrast(${contrast})`);
          if (saturation !== 1) filterParts.push(`saturate(${saturation})`);
          if (grayscale > 0) filterParts.push(`grayscale(${grayscale})`);
          const prevFilter = (ctx as any).filter as string | undefined;
          (ctx as any).filter = filterParts.join(' ') || 'none';
          // Compute cover crop
          const dstW = el.width, dstH = el.height;
          const dstAspect = dstW / dstH;
          const srcAspect = img.width / img.height;
          let sx=0, sy=0, sw=img.width, sh=img.height;
          if (srcAspect > dstAspect) { const newW = img.height * dstAspect; sx = (img.width - newW)/2; sw = newW; }
          else if (srcAspect < dstAspect) { const newH = img.width / dstAspect; sy = (img.height - newH)/2; sh = newH; }
          // Clip to rounded rect if borderRadius present
          if (el.borderRadius && el.borderRadius > 0) {
            const x = -el.width / 2, y = -el.height / 2, w = el.width, h = el.height;
            const r = Math.min(el.borderRadius, Math.min(w, h) / 2);
            ctx.save();
            ctx.beginPath(); ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath(); ctx.clip();
            ctx.drawImage(img, sx, sy, sw, sh, -el.width/2, -el.height/2, el.width, el.height);
            ctx.restore();
          } else {
            ctx.drawImage(img, sx, sy, sw, sh, -el.width/2, -el.height/2, el.width, el.height);
          }
          (ctx as any).filter = prevFilter || 'none';
        }
      }
 else if (el.type === 'path' && el.pathData) {
        const path = new Path2D(el.pathData);
        ctx.translate(-el.width/2, -el.height/2);
        if (el.backgroundColor) { ctx.fillStyle = el.backgroundColor; ctx.fill(path); }
        if (el.strokeColor && el.strokeWidth) { ctx.strokeStyle = el.strokeColor; ctx.lineWidth = el.strokeWidth; ctx.stroke(path); }
      }
      ctx.restore();
    }
    ctx.restore();
    return canvas.toDataURL('image/png');
  };

  // Post current canvas as a template
  const postAsTemplate = async () => {
    let defaultName = projectName && projectName.trim().length ? projectName.trim() : `Template ${new Date().toLocaleString()}`;
    // Allow quick rename while saving
    const promptName = window.prompt('Template name', defaultName);
    const name = (promptName && promptName.trim()) ? promptName.trim() : defaultName;
    const thumbnail = await generateThumbnail();
    const payload = {
      name,
      elements: JSON.parse(JSON.stringify(elements)),
      canvasSize: { ...canvasSize },
      canvasBg,
      thumbnail,
    };
    try {
      if (user) {
        // If a template is currently loaded, ask to overwrite or save new
        if (currentTemplateId && window.confirm('Overwrite the currently loaded template with your changes?')) {
          try {
            const updated = await api.templates.update(currentTemplateId, payload as any);
            setTemplates(prev => prev.map(t => t.id === currentTemplateId ? {
              ...t,
              name: updated.name,
              elements: updated.elements,
              canvasSize: updated.canvasSize,
              canvasBg: updated.canvasBg,
              thumbnail: updated.thumbnail,
            } : t));
            toast.success('Template updated');
          } catch (e: any) {
            // Not owned or not found -> create a duplicate instead
            const copyName = `${name} (1 copy)`;
            const created = await api.templates.create({ ...payload, name: copyName } as any);
            const mapped: SavedTemplate = {
              id: (created as any)._id || created.id || `tpl-${Date.now()}`,
              name: created.name,
              elements: created.elements,
              canvasSize: created.canvasSize,
              canvasBg: created.canvasBg,
              thumbnail: created.thumbnail,
              createdAt: new Date((created as any).createdAt || Date.now()).getTime(),
              isPublic: !!(created as any).isPublic,
            };
            setTemplates(prev => [mapped, ...prev]);
            setCurrentTemplateId(mapped.id);
            toast.success('Saved a copy');
          }
        } else {
          const created = await api.templates.create(payload as any);
          const mapped: SavedTemplate = {
            id: (created as any)._id || created.id || `tpl-${Date.now()}`,
            name: created.name,
            elements: created.elements,
            canvasSize: created.canvasSize,
            canvasBg: created.canvasBg,
            thumbnail: created.thumbnail,
            createdAt: new Date((created as any).createdAt || Date.now()).getTime(),
            isPublic: !!(created as any).isPublic,
          };
          setTemplates(prev => [mapped, ...prev]);
          setCurrentTemplateId(mapped.id);
          toast.success('Posted as template');
        }
      } else {
        // Fallback to local when not logged in
        const tpl: SavedTemplate = {
          id: `tpl-${Date.now()}`,
          name,
          elements: payload.elements as any,
          canvasSize: payload.canvasSize as any,
          canvasBg: payload.canvasBg,
          thumbnail: payload.thumbnail,
          createdAt: Date.now(),
        };
        const next = [tpl, ...templates];
        setTemplates(next);
        localStorage.setItem('brand-kit-templates', JSON.stringify(next));
        toast.success('Posted as template');
      }
    } catch (e) {
      toast.error('Failed to post template');
    }
  };

  // Load a template into the editor
  const loadTemplate = (tpl: SavedTemplate) => {
    setElements(JSON.parse(JSON.stringify(tpl.elements)));
    setCanvasSize({ ...tpl.canvasSize });
    setCanvasBg(tpl.canvasBg);
    addToHistory(tpl.elements);
    setShowTemplates(false);
    setCurrentTemplateId(tpl.id);
    toast.success('Template loaded');
  };

  const refreshTemplates = async () => {
    try {
      if (user) {
        const t = await api.templates.list();
        const items: SavedTemplate[] = (t.items || []).map((it: any) => ({
          id: it._id || it.id,
          name: it.name,
          elements: it.elements,
          canvasSize: it.canvasSize,
          canvasBg: it.canvasBg,
          thumbnail: it.thumbnail,
          createdAt: new Date(it.createdAt || Date.now()).getTime(),
          isPublic: !!it.isPublic,
        }));
        setTemplates(items);
      } else {
        // Load public templates from server for unauthenticated users
        try {
          const t = await api.templates.publicList();
          const items: SavedTemplate[] = (t.items || t || []).map((it: any) => ({
            id: it._id || it.id,
            name: it.name,
            elements: it.elements,
            canvasSize: it.canvasSize,
            canvasBg: it.canvasBg,
            thumbnail: it.thumbnail,
            createdAt: new Date(it.createdAt || Date.now()).getTime(),
            isPublic: true,
          }));
          setTemplates(items);
        } catch {
          const saved = localStorage.getItem('brand-kit-templates');
          if (saved) setTemplates(JSON.parse(saved));
        }
      }
    } catch {}
  };

  const openTemplateById = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl) loadTemplate(tpl);
  };

  const renameTemplate = async (id: string, name: string) => {
    try {
      if (user) {
        await api.templates.update(id, { name });
        await refreshTemplates();
        toast.success('Template renamed');
      } else {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, name } : t));
        localStorage.setItem('brand-kit-templates', JSON.stringify(templates.map(t => t.id === id ? { ...t, name } : t)));
      }
    } catch {
      toast.error('Rename failed');
    }
  };

  const togglePublic = async (id: string, isPublic: boolean) => {
    try {
      if (user) {
        await api.templates.update(id, { isPublic });
        await refreshTemplates();
        toast.success(isPublic ? 'Made Public' : 'Made Private');
      } else {
        toast.error('Login to change visibility');
      }
    } catch {
      toast.error('Update failed');
    }
  };

  // Select all elements
  const selectAll = () => {
    const ids = elements.map(e=>e.id);
    setSelectedIds(ids);
    setSelectedElement(ids[0] || null);
  };

  // Frame size presets
  const setCanvasPreset = (preset: 'instagram'|'story'|'banner'|'custom', custom?: {width:number;height:number}) => {
    if (preset === 'instagram') setCanvasSize({ width: 1080, height: 1080 });
    else if (preset === 'story') setCanvasSize({ width: 1080, height: 1920 });
    else if (preset === 'banner') setCanvasSize({ width: 1920, height: 600 });
    else if (preset === 'custom' && custom) setCanvasSize({ width: custom.width, height: custom.height });
  };

  // Autosave editor state
  useEffect(() => {
    // Build a storage-friendly payload that avoids huge data URIs
    const shrinkElements = (els: CanvasElement[]) => els.map(el => {
      if (el.type === 'image' && el.imageSrc) {
        const isDataUri = typeof el.imageSrc === 'string' && el.imageSrc.startsWith('data:');
        if (isDataUri) {
          const { imageSrc, ...rest } = el as any;
          return { ...rest, imageSrc: undefined } as CanvasElement;
        }
      }
      return el;
    });

    const storagePayload = {
      elements: shrinkElements(elements),
      canvasSize,
      canvasBg,
      canvasBgImage,
      zoom,
      showGrid,
      showRulers,
      showGuides,
      projectName,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('brand-kit-autosave', JSON.stringify(storagePayload));
    } catch {}

    // Cloud autosave when logged in (can handle larger payloads server-side)
    (async () => {
      if (user && projectName) {
        try { await api.projects.upsert({ name: projectName, data: storagePayload }); } catch {}
      }
    })();
  }, [elements, canvasSize, canvasBg, zoom, showGrid, showRulers, showGuides, projectName]);

  // Autoload on startup
  useEffect(() => {
    const saved = localStorage.getItem('brand-kit-autosave');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (Array.isArray(data.elements)) setElements(data.elements);
        if (data.canvasSize) setCanvasSize(data.canvasSize);
        if (data.canvasBg) setCanvasBg(data.canvasBg);
        if (typeof data.canvasBgImage === 'string') setCanvasBgImage(data.canvasBgImage);
        if (typeof data.zoom === 'number') setZoom(data.zoom);
        if (typeof data.showGrid === 'boolean') setShowGrid(data.showGrid);
        if (typeof data.showRulers === 'boolean') setShowRulers(data.showRulers);
        if (typeof data.showGuides === 'boolean') setShowGuides(data.showGuides);
        if (typeof data.projectName === 'string') setProjectName(data.projectName);
        addToHistory(data.elements || []);
      } catch {}
    }
    // Ask for project name if not set
    setAskProjectName(!localStorage.getItem('brand-kit-autosave') || !JSON.parse(localStorage.getItem('brand-kit-autosave') || '{}').projectName);
    // Load saved templates
    const savedTemplates = localStorage.getItem('brand-kit-templates');
    if (window.location?.pathname === '/Brand-kit-Template') {
      setTemplates([]);
    } else if (savedTemplates) {
      try { setTemplates(JSON.parse(savedTemplates)); } catch {}
    }
    // Also attempt to fetch public templates from server
    (async () => {
      if (!user) {
        try { await refreshTemplates(); } catch {}
      }
    })();

    // If opened via shareable URL, show Templates page (public)
    try {
      if (window.location?.pathname === '/Brand-kit-Template') {
        setShowTemplatesPage(true);
        refreshTemplates();
      }
    } catch {}
  }, []);

  // Try session restore
  useEffect(() => {
    (async () => {
      try {
        const res = await api.auth.me();
        if (res && res.user) {
          setUser(res.user);
        }
      } catch {}
    })();
  }, []);

  // When logged in, fetch templates & project draft
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const t = await api.templates.list();
        const items: SavedTemplate[] = (t.items || []).map((it: any) => ({
          id: it._id || it.id,
          name: it.name,
          elements: it.elements,
          canvasSize: it.canvasSize,
          canvasBg: it.canvasBg,
          thumbnail: it.thumbnail,
          createdAt: new Date(it.createdAt || Date.now()).getTime(),
          isPublic: !!it.isPublic,
        }));
        setTemplates(items);
      } catch {}
      try {
        if (projectName) {
          const res = await api.projects.get(projectName);
          const cloud = res && res.project && res.project.data ? res.project.data : null;
          const localRaw = localStorage.getItem('brand-kit-autosave');
          let local: any = null;
          try { local = localRaw ? JSON.parse(localRaw) : null; } catch {}
          const localTs = Number(local?.timestamp || 0);
          const cloudTs = Number(cloud?.timestamp || 0);
          const pick = cloudTs > localTs ? cloud : (local || cloud);
          if (pick) {
            if (Array.isArray(pick.elements)) setElements(pick.elements);
            if (pick.canvasSize) setCanvasSize(pick.canvasSize);
            if (pick.canvasBg) setCanvasBg(pick.canvasBg);
            if (typeof pick.canvasBgImage === 'string') setCanvasBgImage(pick.canvasBgImage);
            if (typeof pick.projectName === 'string') setProjectName(pick.projectName);
            addToHistory(pick.elements || []);
          }
        }
      } catch {}
    })();
  }, [user]);

  // Background cloud autosave every 30s (latest wins), throttled toast
  useEffect(() => {
    if (!user || !projectName) return;
    const id = setInterval(async () => {
      try {
        const payload = {
          elements,
          canvasSize,
          canvasBg,
          canvasBgImage,
          projectName,
          timestamp: Date.now(),
        };
        await api.projects.upsert({ name: projectName, data: payload });
        // Toast at most once every 60s
        const now = Date.now();
        if (now - lastCloudSaveRef.current > 60000) {
          lastCloudSaveRef.current = now;
          try { toast.success('Design saved to cloud'); } catch {}
        }
      } catch {}
    }, 30000);
    return () => clearInterval(id);
  }, [user, projectName, elements, canvasSize, canvasBg, canvasBgImage]);

  // Add to history
  const addToHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: JSON.parse(JSON.stringify(newElements)), timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex - 1].elements)));
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex + 1].elements)));
    }
  };

  // Copy
  const copyElement = async () => {
    if (selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        setClipboard(element);
        try {
          await navigator.clipboard.writeText(JSON.stringify({ type: 'brand-kit-element', element }));
        } catch {}
      }
    }
  };

  // Paste
  const pasteElement = async () => {
    let handled = false;
    // 1) Try image from clipboard and paste as fill into selected shape
    try {
      // @ts-ignore - read() not in older TS lib
      const items = await (navigator.clipboard as any).read?.();
      if (items && items.length) {
        for (const item of items) {
          const type: string = item.types?.find((t: string) => t.startsWith('image/'));
          if (type) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            const dataUrl: string = await new Promise((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            if (selectedElement) {
              const el = elements.find(e => e.id === selectedElement);
              if (el && el.type === 'shape') {
                updateElement(selectedElement, { fillImageSrc: dataUrl } as any);
                handled = true;
                break;
              }
            }
            // No shape selected: add as new image element
            const newImage: any = {
              id: `element-${Date.now()}`,
              type: 'image',
              x: 100,
              y: 100,
              width: 300,
              height: 300,
              rotation: 0,
              visible: true,
              opacity: 1,
              imageSrc: dataUrl,
            };
            addElement(newImage);
            handled = true;
            break;
          }
        }
      }
    } catch {}

    if (handled) return;

    // 2) Try reading clipboard text for image URLs or data URLs
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const trimmed = text.trim();
        const isDataUrl = /^data:image\//i.test(trimmed);
        const isImageUrl = /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(trimmed);
        if (isDataUrl || isImageUrl) {
          const src = trimmed;
          if (selectedElement) {
            const el = elements.find(e => e.id === selectedElement);
            if (el && el.type === 'shape') {
              updateElement(selectedElement, { fillImageSrc: src } as any);
              handled = true;
            }
          }
          if (!handled) {
            const newImage: any = {
              id: `element-${Date.now()}`,
              type: 'image',
              x: 100,
              y: 100,
              width: 300,
              height: 300,
              rotation: 0,
              visible: true,
              opacity: 1,
              imageSrc: src,
            };
            addElement(newImage);
            handled = true;
          }
        }
      }
    } catch {}

    if (handled) return;

    // 3) Fallback to internal element clipboard or structured JSON text
    let payload: CanvasElement | null = clipboard;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.type === 'brand-kit-element' && parsed.element) {
            payload = parsed.element as CanvasElement;
          }
        } catch {}
      }
    } catch {}
    if (payload) {
      const newElement = {
        ...payload,
        id: `element-${Date.now()}`,
        x: payload.x + 20,
        y: payload.y + 20,
      };
      addElement(newElement);
    }
  };

  // Cut
  const cutElement = async () => {
    if (selectedElement) {
      const el = elements.find(e => e.id === selectedElement);
      if (el) {
        setClipboard(el);
        try { await navigator.clipboard.writeText(JSON.stringify({ type: 'brand-kit-element', element: el })); } catch {}
      }
      handleDeleteElement(selectedElement);
    }
  };

  // Keyboard shortcuts (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts while typing in form fields or editable areas
      const target = e.target as HTMLElement | null;
      const ae = (document.activeElement as HTMLElement | null);
      const isFormEl = (el: HTMLElement | null) => !!el && (
        el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as any).isContentEditable
      );
      if (isFormEl(target) || isFormEl(ae)) {
        return;
      }
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } 
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
      // Ctrl+= or Ctrl++ - Zoom In
      else if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom((z) => Math.min(400, z + 10));
      }
      // Ctrl+- - Zoom Out
      else if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom((z) => Math.max(10, z - 10));
      }
      // Ctrl+0 - Fit to screen (reset zoom to 100%)
      else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        setZoom(100);
      }
      // Ctrl+L - Open Login dialog
      else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setShowAuth(true);
      }
      // Ctrl+S - Save (.Racan)
      else if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Shift+S - Save As
      else if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        handleSaveAs();
      }
      // Ctrl+O - Open .Racan
      else if (e.ctrlKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenFile();
      }
      // Ctrl+C - Copy
      else if (e.ctrlKey && e.key === 'c' && selectedElement) {
        e.preventDefault();
        copyElement();
      }
      // Ctrl+X - Cut
      else if (e.ctrlKey && e.key === 'x' && selectedElement) {
        e.preventDefault();
        cutElement();
      }
      // Ctrl+V - Paste
      else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteElement();
      }
      // Ctrl+D - Duplicate
      else if (e.ctrlKey && e.key === 'd' && selectedElement) {
        e.preventDefault();
        duplicateElement(selectedElement);
      }
      // Delete - Delete element
      else if (e.key === 'Delete' && selectedElement) {
        e.preventDefault();
        handleDeleteElement(selectedElement);
      }
      // V - Select tool
      else if (e.key === 'v' && !e.ctrlKey) {
        e.preventDefault();
        setTool('select');
      }
      // H - Hand tool
      else if (e.key === 'h' && !e.ctrlKey) {
        e.preventDefault();
        setTool('hand');
        toast.success('Hand tool activated (H)');
      }
      // M - Move tool
      else if (e.key === 'm' && !e.ctrlKey) {
        e.preventDefault();
        setTool('move');
        toast.success('Move tool activated (M)');
      }
      // R - Rectangle
      else if (e.key === 'r' && !e.ctrlKey) {
        e.preventDefault();
        setTool('rectangle');
      }
      // O - Circle
      else if (e.key === 'o' && !e.ctrlKey) {
        e.preventDefault();
        setTool('circle');
      }
      // T - Text
      else if (e.key === 't' && !e.ctrlKey) {
        e.preventDefault();
        setTool('text');
      }
      // P - Pen
      else if (e.key === 'p' && !e.ctrlKey) {
        e.preventDefault();
        setTool('pen');
      }
      // (Removed) N - Pencil
      // Delete/Backspace - delete selected element
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey) {
        if (selectedElement) {
          e.preventDefault();
          handleDeleteElement(selectedElement);
        }
      }
      // I - Image
      else if (e.key === 'i' && !e.ctrlKey) {
        e.preventDefault();
        setTool('image');
      }
      // Escape - Deselect
      else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedElement(null);
        setSelectedIds([]);
        setTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedElement, elements, clipboard]);

  // Native paste event handler to capture image blobs (Figma-like behavior)
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const dt = e.clipboardData;
      if (!dt) return;
      // Look for image items first
      const items = dt.items ? Array.from(dt.items) : [];
      const imgItem = items.find((it) => it.type && it.type.startsWith('image/'));
      if (imgItem) {
        const blob = imgItem.getAsFile();
        if (blob) {
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          if (selectedElement) {
            const el = elements.find(e => e.id === selectedElement);
            if (el && el.type === 'shape') {
              e.preventDefault();
              updateElement(selectedElement, { fillImageSrc: dataUrl } as any);
              return;
            }
          }
          // No eligible shape selected: insert as image element
          e.preventDefault();
          const newImage: any = {
            id: `element-${Date.now()}`,
            type: 'image',
            x: 100,
            y: 100,
            width: 300,
            height: 300,
            rotation: 0,
            visible: true,
            opacity: 1,
            imageSrc: dataUrl,
          };
          addElement(newImage);
          return;
        }
      }
      // If text is an image URL or data URL, handle similarly
      const text = dt.getData('text')?.trim();
      if (text && (/^data:image\//i.test(text) || /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(text))) {
        if (selectedElement) {
          const el = elements.find(e => e.id === selectedElement);
          if (el && el.type === 'shape') {
            e.preventDefault();
            updateElement(selectedElement, { fillImageSrc: text } as any);
            return;
          }
        }
        e.preventDefault();
        const newImage: any = {
          id: `element-${Date.now()}`,
          type: 'image',
          x: 100,
          y: 100,
          width: 300,
          height: 300,
          rotation: 0,
          visible: true,
          opacity: 1,
          imageSrc: text,
        };
        addElement(newImage);
      }
    };
    window.addEventListener('paste', onPaste as any);
    return () => window.removeEventListener('paste', onPaste as any);
  }, [selectedElement, elements]);

  // Ctrl + Mouse Wheel zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY;
        if (delta > 0) {
          setZoom((z) => Math.max(10, z - 10));
        } else if (delta < 0) {
          setZoom((z) => Math.min(400, z + 10));
        }
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel as any);
  }, []);

  // Add element
  const addElement = (element: CanvasElement) => {
    const newElements = [...elements, element];
    setElements(newElements);
    addToHistory(newElements);
    setSelectedElement(element.id);
    setSelectedIds([element.id]);
  };

  // Insert AI image and adjust canvas size based on kind
  const insertAIImage = (dataUrl: string, kind: 'poster'|'logo'|'apparel'|'model'|'generic') => {
    // determine target frame size by kind
    const sizeMap: Record<string, { width: number; height: number }> = {
      poster: { width: 1080, height: 1350 },
      logo: { width: 512, height: 512 },
      apparel: { width: 1024, height: 1024 },
      model: { width: 1080, height: 1350 },
      generic: canvasSize,
    };
    const target = sizeMap[kind] || canvasSize;
    // update canvas frame first
    setCanvasSize({ width: target.width, height: target.height });
    // add image layer filling the frame
    const el: CanvasElement = {
      id: `element-${Date.now()}`,
      type: 'image',
      x: 0,
      y: 0,
      width: target.width,
      height: target.height,
      imageSrc: dataUrl,
      opacity: 1,
      rotation: 0,
      visible: true,
      locked: false,
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
    };
    addElement(el);
    setSelectedElement(el.id);
    setSelectedIds([el.id]);
    toast.success('AI image inserted');
  };

  // Update element
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    // ... (rest of the code remains the same)
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    addToHistory(newElements);
  };

  // Transient update (no history) for smooth dragging/resizing
  const updateElementTransient = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, ...updates } : el)));
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    addToHistory(newElements);
    setSelectedElement(null);
    setSelectedIds([]);
  };

  // Duplicate element
  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: `element-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
      };
      addElement(newElement);
      toast.success('Element duplicated');
    }
  };

  // Bring to front
  const bringToFront = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElements = elements.filter(el => el.id !== id);
      newElements.push(element);
      setElements(newElements);
      addToHistory(newElements);
      toast.success('Brought to front');
    }
  };

  // Send to back
  const sendToBack = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElements = elements.filter(el => el.id !== id);
      newElements.unshift(element);
      setElements(newElements);
      addToHistory(newElements);
      toast.success('Sent to back');
    }
  };

  // Export
  const exportingRef = useRef<boolean>(false);
  const handleExport = async (format: 'png' | 'pdf' | 'svg' | 'jpeg') => {

    try {
      if (exportingRef.current) return; // prevent double-click overlaps
      exportingRef.current = true;
      if (format === 'png' || format === 'jpeg') {
        const canvas = document.createElement('canvas');
        // scaleFactor: 1x/2x/4x selectable
        const scaleFactor = exportScale || 1;
        canvas.width = Math.max(1, Math.round(canvasSize.width * scaleFactor));
        canvas.height = Math.max(1, Math.round(canvasSize.height * scaleFactor));
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Scale drawing to match the logical canvas units
          ctx.scale(scaleFactor, scaleFactor);
          // Fill background
          const allowTransparency = format === 'png' && exportTransparent;
          if (!allowTransparency) {
            ctx.fillStyle = canvasBg;
            ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
          }
          // Draw background image (cover) if present
          if (canvasBgImage && !allowTransparency) {
            try {
              const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                const im = new Image(); im.crossOrigin = 'anonymous';
                im.onload = () => resolve(im); im.onerror = () => reject(new Error('bg'));
                const u = canvasBgImage!;
                im.src = /^https?:\/\//i.test(u) ? `${API_BASE}/proxy/image?url=${encodeURIComponent(u)}` : u;
              });
              const dstW = canvasSize.width, dstH = canvasSize.height;
              const dstAspect = dstW / dstH;
              const srcAspect = bgImg.width / bgImg.height;
              let sx=0, sy=0, sw=bgImg.width, sh=bgImg.height;
              if (srcAspect > dstAspect) { const newW = bgImg.height * dstAspect; sx = (bgImg.width - newW) / 2; sw = newW; }
              else if (srcAspect < dstAspect) { const newH = bgImg.width / dstAspect; sy = (bgImg.height - newH) / 2; sh = newH; }
              ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, dstW, dstH);
            } catch {}
          }

          // Load all images first (element images and shape fill images)
          const imagePromises: Promise<HTMLImageElement>[] = [];
          const imageMap = new Map<string, HTMLImageElement>();

          for (const element of elements) {
            if (element.type === 'image' && element.imageSrc) {
              const promise = new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                const u = element.imageSrc!;
                img.src = /^https?:\/\//i.test(u) ? `${API_BASE}/proxy/image?url=${encodeURIComponent(u)}` : u;
              }).then(img => {
                imageMap.set(element.id, img);
                return img;
              });
              imagePromises.push(promise);
            }
            if (element.type === 'shape' && element.fillImageSrc) {
              const promise2 = new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load shape fill image'));
                const u = element.fillImageSrc!;
                img.src = /^https?:\/\//i.test(u) ? `${API_BASE}/proxy/image?url=${encodeURIComponent(u)}` : u;
              }).then(img => {
                imageMap.set(`fill:${element.id}`, img);
                return img;
              });
              imagePromises.push(promise2);
            }
          }

          // Wait for all images to load (do not fail export if some images fail)
          await Promise.allSettled(imagePromises);

          // Draw elements
          for (const element of elements) {
            if (!element.visible) continue;

            ctx.save();
            ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
            ctx.rotate((element.rotation || 0) * Math.PI / 180);
            ctx.scale(element.scaleX ?? 1, element.scaleY ?? 1);
            ctx.globalAlpha = element.opacity || 1;

            if (element.type === 'shape') {
              // Draw background color first (under the image fill)
              if (element.backgroundColor) {
                ctx.fillStyle = element.backgroundColor;
                ctx.globalAlpha = (element.fillOpacity || 100) / 100;
                
                if (element.shapeType === 'rectangle') {
                  if (element.borderRadius) {
                    const x = -element.width / 2;
                    const y = -element.height / 2;
                    const r = element.borderRadius;
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.arcTo(x + element.width, y, x + element.width, y + element.height, r);
                    ctx.arcTo(x + element.width, y + element.height, x, y + element.height, r);
                    ctx.arcTo(x, y + element.height, x, y, r);
                    ctx.arcTo(x, y, x + element.width, y, r);
                    ctx.closePath();
                    ctx.fill();
                  } else {
                    ctx.fillRect(-element.width / 2, -element.height / 2, element.width, element.height);
                  }
                } else if (element.shapeType === 'circle') {
                  ctx.beginPath();
                  ctx.arc(0, 0, Math.min(element.width, element.height) / 2, 0, Math.PI * 2);
                  ctx.fill();
                } else if (element.shapeType === 'triangle') {
                  ctx.beginPath();
                  ctx.moveTo(0, -element.height / 2);
                  ctx.lineTo(element.width / 2, element.height / 2);
                  ctx.lineTo(-element.width / 2, element.height / 2);
                  ctx.closePath();
                  ctx.fill();
                } else if (element.shapeType === 'star') {
                  const outerRadius = Math.min(element.width, element.height) / 2;
                  const innerRadius = outerRadius * 0.4;
                  ctx.beginPath();
                  for (let i = 0; i < 10; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / 5 - Math.PI / 2;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.closePath();
                  ctx.fill();
                } else if (element.shapeType === 'polygon') {
                  const radius = Math.min(element.width, element.height) / 2;
                  ctx.beginPath();
                  for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3 - Math.PI / 2;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.closePath();
                  ctx.fill();
                }
              }

              // Draw image fill on top, clipped to shape (cover fit)
              if (element.fillImageSrc) {
                const img = imageMap.get(`fill:${element.id}`);
                if (img) {
                  ctx.save();
                  // Build clip path for shape
                  if (element.shapeType === 'rectangle') {
                    if (element.borderRadius) {
                      const x = -element.width / 2, y = -element.height / 2, r = element.borderRadius;
                      ctx.beginPath(); ctx.moveTo(x + r, y);
                      ctx.arcTo(x + element.width, y, x + element.width, y + element.height, r);
                      ctx.arcTo(x + element.width, y + element.height, x, y + element.height, r);
                      ctx.arcTo(x, y + element.height, x, y, r);
                      ctx.arcTo(x, y, x + element.width, y, r);
                      ctx.closePath(); ctx.clip();
                    } else {
                      ctx.beginPath(); ctx.rect(-element.width / 2, -element.height / 2, element.width, element.height); ctx.clip();
                    }
                  } else if (element.shapeType === 'circle') {
                    ctx.beginPath(); ctx.arc(0, 0, Math.min(element.width, element.height) / 2, 0, Math.PI * 2); ctx.clip();
                  } else if (element.shapeType === 'triangle') {
                    ctx.beginPath(); ctx.moveTo(0, -element.height / 2); ctx.lineTo(element.width / 2, element.height / 2); ctx.lineTo(-element.width / 2, element.height / 2); ctx.closePath(); ctx.clip();
                  } else if (element.shapeType === 'star') {
                    const outerR = Math.min(element.width, element.height) / 2; const innerR = outerR * 0.4;
                    ctx.beginPath();
                    for (let i = 0; i < 10; i++) { const r = i % 2 === 0 ? outerR : innerR; const ang = (i * Math.PI) / 5 - Math.PI / 2; const x = r * Math.cos(ang); const y = r * Math.sin(ang); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);} ctx.closePath(); ctx.clip();
                  } else if (element.shapeType === 'polygon') {
                    const sides = 6; const r = Math.min(element.width, element.height) / 2; ctx.beginPath();
                    for (let i = 0; i < sides; i++) { const ang = (2 * Math.PI * i) / sides - Math.PI / 2; const x = r * Math.cos(ang); const y = r * Math.sin(ang); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);} ctx.closePath(); ctx.clip();
                  }
                  // cover fit crop
                  const dstW = element.width, dstH = element.height;
                  const dstAspect = dstW / dstH;
                  const srcAspect = img.width / img.height;
                  let sx = 0, sy = 0, sw = img.width, sh = img.height;
                  if (srcAspect > dstAspect) { const newW = img.height * dstAspect; sx = (img.width - newW) / 2; sw = newW; }
                  else if (srcAspect < dstAspect) { const newH = img.width / dstAspect; sy = (img.height - newH) / 2; sh = newH; }
                  ctx.drawImage(img, sx, sy, sw, sh, -element.width / 2, -element.height / 2, element.width, element.height);
                  ctx.restore();
                }
              }

              // Apply stroke
              if (element.strokeColor && element.strokeWidth) {
                ctx.strokeStyle = element.strokeColor;
                ctx.lineWidth = element.strokeWidth;
                ctx.globalAlpha = (element.strokeOpacity || 100) / 100;
                
                if (element.shapeType === 'rectangle') {
                  if (element.borderRadius) {
                    const x = -element.width / 2;
                    const y = -element.height / 2;
                    const r = element.borderRadius;
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.arcTo(x + element.width, y, x + element.width, y + element.height, r);
                    ctx.arcTo(x + element.width, y + element.height, x, y + element.height, r);
                    ctx.arcTo(x, y + element.height, x, y, r);
                    ctx.arcTo(x, y, x + element.width, y, r);
                    ctx.closePath();
                    ctx.stroke();
                  } else {
                    ctx.strokeRect(-element.width / 2, -element.height / 2, element.width, element.height);
                  }
                } else if (element.shapeType === 'circle') {
                  ctx.beginPath();
                  ctx.arc(0, 0, Math.min(element.width, element.height) / 2, 0, Math.PI * 2);
                  ctx.stroke();
                } else if (element.shapeType === 'triangle') {
                  ctx.beginPath();
                  ctx.moveTo(0, -element.height / 2);
                  ctx.lineTo(element.width / 2, element.height / 2);
                  ctx.lineTo(-element.width / 2, element.height / 2);
                  ctx.closePath();
                  ctx.stroke();
                } else if (element.shapeType === 'star') {
                  const outerRadius = Math.min(element.width, element.height) / 2;
                  const innerRadius = outerRadius * 0.4;
                  ctx.beginPath();
                  for (let i = 0; i < 10; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / 5 - Math.PI / 2;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.closePath();
                  ctx.stroke();
                } else if (element.shapeType === 'polygon') {
                  const radius = Math.min(element.width, element.height) / 2;
                  ctx.beginPath();
                  for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3 - Math.PI / 2;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.closePath();
                  ctx.stroke();
                }
              }
            } else if (element.type === 'text') {
              ctx.fillStyle = element.color || '#000000';
              const fontStyle = element.fontStyle === 'italic' ? 'italic' : '';
              const fontWeight = element.fontWeight || 'normal';
              const fontSize = element.fontSize || 16;
              const fontFamily = element.fontFamily || 'Arial';
              ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`.trim();
              ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'center';
              ctx.textBaseline = 'middle';
              
              // Apply text decoration manually if needed
              const text = element.content || '';
              ctx.fillText(text, 0, 0);
              
              if (element.textDecoration === 'underline') {
                const metrics = ctx.measureText(text);
                ctx.beginPath();
                ctx.moveTo(-metrics.width / 2, fontSize * 0.1);
                ctx.lineTo(metrics.width / 2, fontSize * 0.1);
                ctx.strokeStyle = element.color || '#000000';
                ctx.lineWidth = Math.max(1, fontSize * 0.05);
                ctx.stroke();
              }
            } else if (element.type === 'image' && element.imageSrc) {
              const img = imageMap.get(element.id);
              if (img) {
                // cover-fit crop to match editor (object-cover)
                const dstW = element.width, dstH = element.height;
                const dstAspect = dstW / dstH;
                const srcAspect = img.width / img.height;
                let sx = 0, sy = 0, sw = img.width, sh = img.height;
                if (srcAspect > dstAspect) { const newW = img.height * dstAspect; sx = (img.width - newW) / 2; sw = newW; }
                else if (srcAspect < dstAspect) { const newH = img.width / dstAspect; sy = (img.height - newH) / 2; sh = newH; }
                // Clip to rounded rect if borderRadius present
                if (element.borderRadius && element.borderRadius > 0) {
                  const x = -element.width / 2;
                  const y = -element.height / 2;
                  const w = element.width;
                  const h = element.height;
                  const r = Math.min(element.borderRadius, Math.min(w, h) / 2);
                  ctx.beginPath();
                  ctx.moveTo(x + r, y);
                  ctx.arcTo(x + w, y, x + w, y + h, r);
                  ctx.arcTo(x + w, y + h, x, y + h, r);
                  ctx.arcTo(x, y + h, x, y, r);
                  ctx.arcTo(x, y, x + w, y, r);
                  ctx.closePath();
                  ctx.clip();
                }
                ctx.drawImage(img, sx, sy, sw, sh, -element.width / 2, -element.height / 2, element.width, element.height);
              }
            } else if (element.type === 'path' && element.pathData) {
              const path = new Path2D(element.pathData);
              ctx.translate(-element.width / 2, -element.height / 2);
              
              if (element.backgroundColor) {
                ctx.fillStyle = element.backgroundColor;
                ctx.fill(path);
              }
              
              if (element.strokeColor && element.strokeWidth) {
                ctx.strokeStyle = element.strokeColor;
                ctx.lineWidth = element.strokeWidth;
                ctx.stroke(path);
              }
            }

            ctx.restore();
          }

          const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
          const extension = format === 'jpeg' ? 'jpg' : 'png';
          let blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b)=>resolve(b), mimeType, format === 'jpeg' ? 0.95 : undefined));
          if (!blob) {
            // Fallback for environments where toBlob may return null
            const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.95 : undefined);
            try { blob = await fetch(dataUrl).then(r=>r.blob()); } catch {}
          }
          if (blob) {
            const url = URL.createObjectURL(blob);
            // Reset preview first to ensure dialog re-renders with new URL
            setExportPreview(null);
            setExportPreview({ url, format, filename: `brand-kit-design-${Date.now()}.${extension}` });
          } else {
            throw new Error('Failed to generate image blob');
          }
        }
      } else if (format === 'svg') {
        // Pre-embed all http(s) images as data URLs so SVG retains fills offline
        const toDataUrl = async (u: string): Promise<string> => {
          try {
            const src = /^https?:\/\//i.test(u) ? `${API_BASE}/proxy/image?url=${encodeURIComponent(u)}` : u;
            if (src.startsWith('data:')) return src;
            const resp = await fetch(src);
            const blob = await resp.blob();
            const dataUrl: string = await new Promise((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result as string); fr.readAsDataURL(blob); });
            return dataUrl;
          } catch { return u; }
        };
        const svgImageMap = new Map<string, string>();
        const embedPromises: Promise<void>[] = [];
        for (const el of elements) {
          if (el.type === 'image' && el.imageSrc) {
            const key = `img:${el.id}`;
            embedPromises.push(toDataUrl(el.imageSrc).then(d => { svgImageMap.set(key, d); }));
          }
          if (el.type === 'shape' && el.fillImageSrc) {
            const key = `fill:${el.id}`;
            embedPromises.push(toDataUrl(el.fillImageSrc).then(d => { svgImageMap.set(key, d); }));
          }
        }
        await Promise.allSettled(embedPromises);
        let svg = `<svg width="${canvasSize.width}" height="${canvasSize.height}" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="100%" height="100%" fill="${canvasBg}"/>`;
        if (canvasBgImage) {
          const href = canvasBgImage.startsWith('data:') ? canvasBgImage : (await toDataUrl(canvasBgImage));
          svg += `<image href="${href}" x="0" y="0" width="${canvasSize.width}" height="${canvasSize.height}" preserveAspectRatio="xMidYMid slice"/>`;
        }
        const defs: string[] = [];
        const body: string[] = [];
        elements.forEach((el, idx) => {
          if (!el.visible) return;
          const gid = `g${idx}`;
          const tx = el.x + el.width/2;
          const ty = el.y + el.height/2;
          const rot = el.rotation || 0;
          const scx = el.scaleX ?? 1;
          const scy = el.scaleY ?? 1;
          const op = el.opacity || 1;
          const open = `<g transform="translate(${tx},${ty}) rotate(${rot}) scale(${scx},${scy})" opacity="${op}">`;
          const close = `</g>`;
          if (el.type === 'shape') {
            if (el.shapeType === 'rectangle') {
              if (el.backgroundColor) body.push(open + `<rect x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" fill="${el.backgroundColor}" rx="${el.borderRadius || 0}"/>` + close);
              if (el.fillImageSrc) {
                const clipId = `clip-${gid}`;
                if (el.borderRadius) defs.push(`<clipPath id="${clipId}"><rect x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" rx="${el.borderRadius}"/></clipPath>`);
                else defs.push(`<clipPath id="${clipId}"><rect x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}"/></clipPath>`);
                const href = svgImageMap.get(`fill:${el.id}`) || el.fillImageSrc;
                body.push(open + `<image href="${href}" x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>` + close);
              }
            } else if (el.shapeType === 'circle') {
              const r = Math.min(el.width, el.height)/2;
              if (el.backgroundColor) body.push(open + `<circle cx="0" cy="0" r="${r}" fill="${el.backgroundColor}"/>` + close);
              if (el.fillImageSrc) {
                const clipId = `clip-${gid}`;
                defs.push(`<clipPath id="${clipId}"><circle cx="0" cy="0" r="${r}"/></clipPath>`);
                const href = svgImageMap.get(`fill:${el.id}`) || el.fillImageSrc;
                body.push(open + `<image href="${href}" x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>` + close);
              }
            } else if (el.shapeType === 'triangle') {
              const pts = `0,${-el.height/2} ${el.width/2},${el.height/2} ${-el.width/2},${el.height/2}`;
              if (el.backgroundColor) body.push(open + `<polygon points="${pts}" fill="${el.backgroundColor}"/>` + close);
              if (el.fillImageSrc) {
                const clipId = `clip-${gid}`;
                defs.push(`<clipPath id="${clipId}"><polygon points="${pts}"/></clipPath>`);
                const href = svgImageMap.get(`fill:${el.id}`) || el.fillImageSrc;
                body.push(open + `<image href="${href}" x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>` + close);
              }
            } else if (el.shapeType === 'star' || el.shapeType === 'polygon') {
              const sides = el.shapeType === 'star' ? 10 : 6;
              const outerR = Math.min(el.width, el.height)/2;
              const innerR = el.shapeType === 'star' ? outerR/2.5 : outerR;
              const pts: string[] = [];
              for (let i=0;i<sides;i++) {
                const r = el.shapeType==='star' && i%2===1 ? innerR : outerR;
                const ang = (2*Math.PI*i)/sides - Math.PI/2;
                const x = r*Math.cos(ang);
                const y = r*Math.sin(ang);
                pts.push(`${x},${y}`);
              }
              const ptsStr = pts.join(' ');
              if (el.backgroundColor) body.push(open + `<polygon points="${ptsStr}" fill="${el.backgroundColor}"/>` + close);
              if (el.fillImageSrc) {
                const clipId = `clip-${gid}`;
                defs.push(`<clipPath id="${clipId}"><polygon points="${ptsStr}"/></clipPath>`);
                const href = svgImageMap.get(`fill:${el.id}`) || el.fillImageSrc;
                body.push(open + `<image href="${href}" x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>` + close);
              }
            }
            if (el.strokeColor && el.strokeWidth) body.push(open + `<rect x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" fill="none" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}"/>` + close);
          } else if (el.type === 'image' && el.imageSrc) {
            if (el.borderRadius && el.borderRadius > 0) {
              const clipId = `clip-${gid}`;
              defs.push(`<clipPath id="${clipId}"><rect x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" rx="${Math.min(el.borderRadius, Math.min(el.width, el.height)/2)}"/></clipPath>`);
              const href = svgImageMap.get(`img:${el.id}`) || el.imageSrc;
              body.push(open + `<image href="${href}" x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>` + close);
            } else {
              const href = svgImageMap.get(`img:${el.id}`) || el.imageSrc;
              body.push(open + `<image href="${href}" x="${-el.width/2}" y="${-el.height/2}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid slice"/>` + close);
            }
          } else if (el.type === 'text') {
            body.push(`<g transform="translate(${tx},${ty}) rotate(${rot}) scale(${scx},${scy})" opacity="${op}"><text x="0" y="0" fill="${el.color || '#000'}" font-size="${el.fontSize || 16}" text-anchor="middle" dominant-baseline="middle">${el.content || ''}</text></g>`);
          } else if (el.type === 'path' && el.pathData) {
            const fill = el.backgroundColor ? ` fill=\"${el.backgroundColor}\"` : '';
            const stroke = el.strokeColor ? ` stroke=\"${el.strokeColor}\"` : '';
            const sw = el.strokeWidth ? ` stroke-width=\"${el.strokeWidth}\"` : '';
            body.push(`<g transform=\"translate(${tx - el.width/2}, ${ty - el.height/2}) rotate(${rot}, ${el.width/2}, ${el.height/2}) scale(${scx},${scy})\" opacity="${op}"><path d=\"${el.pathData}\"${fill}${stroke}${sw}/></g>`);
          }
        });
        if (defs.length) svg += `<defs>${defs.join('')}</defs>`;
        svg += body.join('');
        svg += `</svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brand-kit-design-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported as SVG');
      }
    } catch (error) {
      toast.error('Export failed');
    } finally {
      exportingRef.current = false;
    }
  };

  const confirmDownload = () => {
    if (!exportPreview) return;
    const a = document.createElement('a');
    a.href = exportPreview.url;
    a.download = exportPreview.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(exportPreview.url);
    setExportPreview(null);
    toast.success(`Exported as ${exportPreview.format.toUpperCase()}`);
  };
  const cancelDownload = () => {
    if (exportPreview) URL.revokeObjectURL(exportPreview.url);
    setExportPreview(null);
  };

  // Manual Save: download a .Racan file (full project)
  const handleSave = async () => {
    const meta = { name: projectName || 'Untitled', updatedAt: Date.now(), version: 1 };
    const payload = { meta, elements, canvasSize, canvasBg };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(meta.name || 'Untitled').replace(/\s+/g,'_')}.Racan`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Saved .Racan file');
  };

  // Save As (prompt for name then download)
  const handleSaveAs = async () => {
    const name = window.prompt('Save As', projectName || 'Untitled') || 'Untitled';
    setProjectName(name);
    await handleSave();
  };

  // Open .Racan file
  const handleOpenFile = () => { fileOpenRef.current?.click(); };
  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (data && data.elements && data.canvasSize) {
        setElements(data.elements);
        setCanvasSize(data.canvasSize);
        setCanvasBg(data.canvasBg || '#FFFFFF');
        addToHistory(data.elements);
        setProjectName(data.meta?.name || f.name.replace(/\.Racan$/i, ''));
        toast.success('Project opened');
      } else {
        toast.error('Invalid .Racan file');
      }
    } catch {
      toast.error('Failed to open file');
    } finally {
      if (fileOpenRef.current) fileOpenRef.current.value = '';
    }
  };

  // Load project (backward-compatible local)
  const handleLoad = () => {
    const saved = localStorage.getItem('brand-kit-project');
    if (saved) {
      const project = JSON.parse(saved);
      setElements(project.elements);
      setCanvasSize(project.canvasSize);
      setCanvasBg(project.canvasBg || '#FFFFFF');
      addToHistory(project.elements);
      toast.success('Project loaded');
    } else {
      toast.error('No saved project found');
    }
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setUser(res.user);
    toast.success(`Welcome ${res.user.name}`);
    // refresh templates after login
    try {
      const t = await api.templates.list();
      const items: SavedTemplate[] = (t.items || []).map((it: any) => ({
        id: it._id || it.id,
        name: it.name,
        elements: it.elements,
        canvasSize: it.canvasSize,
        canvasBg: it.canvasBg,
        thumbnail: it.thumbnail,
        createdAt: new Date(it.createdAt || Date.now()).getTime(),
        isPublic: !!it.isPublic,
      }));
      setTemplates(items);
    } catch {}
  };

  const register = async (name: string, email: string, password: string, avatarUrl?: string) => {
    const res = await api.auth.register({ name, email, password, avatarUrl });
    setUser(res.user);
    toast.success(`Welcome ${res.user.name}`);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    toast.success('Logged out');
  };

  const deleteTemplate = async (id: string) => {
    try {
      if (user) {
        await api.templates.delete(id);
        const t = await api.templates.list();
        const items: SavedTemplate[] = (t.items || []).map((it: any) => ({
          id: it._id || it.id,
          name: it.name,
          elements: it.elements,
          canvasSize: it.canvasSize,
          canvasBg: it.canvasBg,
          thumbnail: it.thumbnail,
          createdAt: new Date(it.createdAt || Date.now()).getTime(),
        }));
        setTemplates(items);
      } else {
        const next = templates.filter(t => t.id !== id);
        setTemplates(next);
        localStorage.setItem('brand-kit-templates', JSON.stringify(next));
      }
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Autosave: debounce to DB if logged in, else localStorage per project
  useEffect(() => {
    const t = setTimeout(async () => {
      const payload = { elements, canvasSize, canvasBg, timestamp: Date.now() };
      try {
        if (user) {
          const name = projectName?.trim() || 'Untitled';
          await api.projects.upsert({ name, data: payload });
        } else {
          const name = projectName?.trim() || 'Untitled';
          localStorage.setItem(`brand-kit-project:${name}`, JSON.stringify(payload));
          localStorage.setItem('brand-kit-last', name);
        }
      } catch {}
    }, 1200);
    return () => clearTimeout(t);
  }, [elements, canvasSize, canvasBg, user, projectName]);

  // On load, try to restore last project from localStorage
  useEffect(() => {
    try {
      const last = localStorage.getItem('brand-kit-last');
      if (last) {
        const saved = localStorage.getItem(`brand-kit-project:${last}`);
        if (saved) {
          const project = JSON.parse(saved);
          setElements(project.elements || []);
          setCanvasSize(project.canvasSize || { width: 1920, height: 1080 });
          setCanvasBg(project.canvasBg || '#FFFFFF');
          setProjectName(last);
          addToHistory(project.elements || []);
        }
      }
    } catch {}
  }, []);

  // Simple client-side route: show full-page Auth when path is /auth
  const isAuthRoute = typeof window !== 'undefined' && window.location.pathname === '/auth';

  if (isAuthRoute) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <LoginScreen />
        <Toaster theme="dark" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
      <input ref={fileOpenRef} type="file" accept=".Racan,application/json" className="hidden" onChange={onFileChosen} />
      <MenuBar 
        onExport={handleExport}
        onSave={handleSave}
        onLoad={handleLoad}
        onOpenFile={handleOpenFile}
        onOpenFromDrive={openFromDrive}
        onSaveToDrive={saveToDrive}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showRulers={showRulers}
        onToggleRulers={() => setShowRulers(!showRulers)}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides(!showGuides)}
        onZoomIn={() => setZoom(Math.min(400, zoom + 10))}
        onZoomOut={() => setZoom(Math.max(10, zoom - 10))}
        onFitToScreen={() => setZoom(100)}
        onCopy={copyElement}
        onPaste={pasteElement}
        onCut={cutElement}
        onPostTemplate={postAsTemplate}
        onViewTemplates={() => setShowTemplatesPage(true)}
        onSelectAll={selectAll}
        onSetCanvasPreset={setCanvasPreset}
        user={user ? { name: user.name, avatarUrl: user.avatarUrl } : null}
        onLogin={() => { window.location.href = '/auth'; }}
        onLogout={logout}
        onChangeAvatar={changeAvatar}
      />
      {showTemplatesPage ? (
        <TemplatesPage
          items={templates.map(t => ({ id: t.id, name: t.name, thumbnail: t.thumbnail, ownerName: user?.name, ownerAvatar: user?.avatarUrl, isPublic: t.isPublic ?? false }))}
          onRefresh={refreshTemplates}
          onOpen={(id) => openTemplateById(id)}
          onDelete={(id) => deleteTemplate(id)}
          onRename={(id, n) => renameTemplate(id, n)}
          onTogglePublic={(id, v) => togglePublic(id, v)}
          onChangeCover={(id, dataUrl) => changeTemplateCover(id, dataUrl)}
          onBack={() => setShowTemplatesPage(false)}
          title={'Card & invite templates'}
        />
      ) : (
      <div className="flex-1 flex overflow-hidden">
        <Toolbar 
          selectedTool={tool} 
          onSelectTool={setTool}
          onAddElement={addElement}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas 
            ref={canvasRef}
            elements={elements}
            selectedElement={selectedElement}
            selectedIds={selectedIds}
            onSelectElement={(id)=>{ setSelectedElement(id); setSelectedIds(id? [id]: []); }}
            onMultiSelect={setSelectedIds}
            onUpdateElement={updateElement}
            onUpdateElementTransient={updateElementTransient}
            tool={tool}
            zoom={zoom}
            canvasSize={canvasSize}
            canvasBg={canvasBg}
            canvasBgImage={canvasBgImage}
            onAddElement={addElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={duplicateElement}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onCopy={copyElement}
            onPaste={pasteElement}
            showGrid={showGrid}
            showGuides={showGuides}
          />
          
          <StatusBar 
            zoom={zoom} 
            onZoomChange={setZoom}
            canvasSize={canvasSize}
            selectedCount={selectedElement ? 1 : 0}
          />
        </div>
        
        <div className="w-80 flex flex-col bg-[#252525] border-l border-[#333] overflow-y-auto min-h-0">
          <div className="px-2 pt-2 border-b border-[#333]">
            <RacanAIWidget onInsertImage={insertAIImage} />
          </div>
          <PropertiesPanel 
            element={selectedElementData}
            onUpdateElement={updateElement}
            canvasBg={canvasBg}
            onCanvasBgChange={handleCanvasBgChange}
            canvasBgImage={canvasBgImage}
            onCanvasBgImageChange={handleCanvasBgImageChange}
          />
          
          <LayersPanel 
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={updateElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={duplicateElement}
          />
        </div>
      </div>
      )}
      
      <Toaster theme="dark" />

      {/* Export Preview Dialog */}
      <Dialog open={!!exportPreview} onOpenChange={(open)=>{ if(!open) cancelDownload(); }}>
        <DialogContent className="max-w-4xl w-[90vw] bg-[#2d2d2d] text-white border-[#3d3d3d]">
          <DialogHeader>
            <DialogTitle>Export Preview</DialogTitle>
          </DialogHeader>
          <div className="w-full max-h-[70vh] overflow-auto flex items-center justify-center bg-[#1e1e1e] rounded">
            {exportPreview?.format === 'svg' ? (
              <object data={exportPreview.url} type="image/svg+xml" className="max-w-full max-h-[70vh]" />
            ) : (
              <img src={exportPreview?.url} alt="Export Preview" className="max-w-full max-h-[70vh]" />
            )}
          </div>
          <DialogFooter>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/80">Resolution</span>
                  <select
                    className="bg-[#1e1e1e] border border-[#3d3d3d] rounded px-2 py-1 text-sm"
                    value={exportScale}
                    onChange={(e)=> setExportScale(Number(e.target.value) as 1|2|4)}
                  >
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                  </select>
                </div>
                {exportPreview?.format === 'png' && (
                  <label className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={exportTransparent}
                      onChange={(e)=> setExportTransparent(e.target.checked)}
                    />
                    Transparent background
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                {exportPreview && (exportPreview.format === 'png' || exportPreview.format === 'jpeg') && (
                  <Button
                    variant="outline"
                    className="border-[#3d3d3d]"
                    onClick={async ()=>{
                      const fmt = exportPreview!.format;
                      // revoke old preview url
                      try { URL.revokeObjectURL(exportPreview!.url); } catch {}
                      setExportPreview(null);
                      await handleExport(fmt);
                    }}
                  >
                    Update Preview
                  </Button>
                )}
                <Button className="bg-blue-600 hover:bg-blue-500" onClick={confirmDownload}>Download</Button>
                <Button variant="outline" className="border-[#3d3d3d]" onClick={cancelDownload}>Cancel</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Name Dialog */}
      <Dialog open={askProjectName} onOpenChange={(open)=> setAskProjectName(open)}>
        <DialogContent className="max-w-md p-0 border border-white/20 bg-white/10 backdrop-blur-2xl text-white">
          <DialogHeader>
            <DialogTitle>Project Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-6 pb-6">
            <Input
              placeholder="Enter a project name"
              value={projectName}
              onChange={(e)=> setProjectName(e.target.value)}
              className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder-white/60"
            />
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button
              className="h-10 rounded-full bg-white text-black hover:bg-white/95"
              onClick={()=>{
                const name = projectName && projectName.trim().length ? projectName.trim() : `Untitled ${new Date().toLocaleDateString()}`;
                setProjectName(name);
                setAskProjectName(false);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="bg-[#2d2d2d] text-white border-[#3d3d3d] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
            {templates.length === 0 && (
              <div className="col-span-full text-white/70">No templates yet. Use "Post as Template" from the menu.</div>
            )}
            {templates.map(tpl => (
              <div key={tpl.id} className="relative group text-left bg-[#1f1f1f] border border-[#3d3d3d] rounded-md hover:border-blue-600 focus:outline-none">
                <button className="w-full text-left" onClick={()=> loadTemplate(tpl)}>
                  <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-40 object-cover rounded-t-md" />
                  <div className="p-2 text-sm truncate">{tpl.name}</div>
                </button>
                <button
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-xs px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded"
                  onClick={()=> deleteTemplate(tpl.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    {/* Auth Dialog */}
    <AuthDialog
      open={showAuth}
      onOpenChange={setShowAuth}
      onLogin={async (email, password) => { await login(email, password); }}
      onRegister={async (name, email, password, avatarUrl) => { await register(name, email, password, avatarUrl); }}
    />
  </div>
);
}
