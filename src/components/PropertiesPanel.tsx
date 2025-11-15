import { CanvasElement } from '../App';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyStart,
  Maximize2,
  Code,
  Settings,
  MoreHorizontal,
  ChevronDown,
  Plus,
  Eye,
  Minus,
  Lock,
  LockOpen,
  Circle,
  Type,
  Bold,
  Italic,
  Underline,
  AlignJustify,
  Layers,
  Wand2,
  Crop,
  Copy,
  Scissors,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Grid3x3,
  Ruler,
  Sparkles
} from 'lucide-react';
// notifications removed in sidebar
import { useState, useEffect, useRef } from 'react';

interface PropertiesPanelProps {
  element: CanvasElement | undefined;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onUpdateElementTransient?: (id: string, updates: Partial<CanvasElement>) => void;
  canvasBg: string;
  onCanvasBgChange: (color: string) => void;
  canvasBgImage?: string | null;
  onCanvasBgImageChange?: (dataUrl: string | null) => void;
}

// Helper function to validate hex color codes
const isValidHexColor = (color: string): boolean => {
  // Allow 3 or 6 digit hex colors with or without #
  const hexRegex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  return hexRegex.test(color);
};

// Helper function to normalize hex color (add # if missing)
const normalizeHexColor = (color: string): string => {
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    return trimmed.toUpperCase();
  }
  return `#${trimmed.toUpperCase()}`;
};

export function PropertiesPanel({ element, onUpdateElement, onUpdateElementTransient, canvasBg, onCanvasBgChange, canvasBgImage, onCanvasBgImageChange }: PropertiesPanelProps) {
  const [bgColorInput, setBgColorInput] = useState(canvasBg);
  const [elementColorInput, setElementColorInput] = useState('');
  const bgColorRafRef = useRef<number | null>(null);
  const googleFonts = [
    'Inter',
    'Roboto',
    'Poppins',
    'Montserrat',
    'Lato',
    'Open Sans',
    'Oswald',
    'Raleway',
  ];

  const ensureGoogleFontLoaded = (family: string) => {
    const id = `gf-${family.replace(/\s+/g, '-')}`;
    if (document.getElementById(id)) return;
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  // Sync bgColorInput when canvasBg changes externally
  useEffect(() => {
    setBgColorInput(canvasBg);
  }, [canvasBg]);

  const handleBgColorChange = (value: string) => {
    setBgColorInput(value);
    
    if (isValidHexColor(value)) {
      const normalizedColor = normalizeHexColor(value);
      onCanvasBgChange(normalizedColor);
    } else if (value.trim() === '') {
      // Allow empty to revert to default
      onCanvasBgChange('#FFFFFF');
      setBgColorInput('#FFFFFF');
    } else {
      // invalid values are ignored on blur/enter
    }
  };

  const handleElementColorChange = (value: string, colorType: 'backgroundColor' | 'color' | 'strokeColor') => {
    if (!element) return;
    
    if (isValidHexColor(value)) {
      const normalizedColor = normalizeHexColor(value);
      // If text and currently editing contentEditable, apply to selection
      if (element.type === 'text' && colorType === 'color') {
        const activeEditable = document.querySelector('[data-editable="true"]:focus');
        if (activeEditable) {
          window.dispatchEvent(new CustomEvent('format-text', { detail: { action: 'color', value: normalizedColor } }));
          return;
        }
      }
      onUpdateElement(element.id, { [colorType]: normalizedColor });
    } else if (value.trim() !== '') {
      // ignore invalid codes
    }
  };
  if (!element) {
    return (
      <div className="flex-1 bg-[#252525] border-b border-[#333]">
        <ScrollArea className="h-full">
          {/* Top Toolbar */}
          <div className="p-2 border-b border-[#333] bg-[#2a2a2a]">
            <div className="flex flex-wrap gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Type className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Underline className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8 bg-[#3d3d3d] mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <AlignJustify className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8 bg-[#3d3d3d] mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Wand2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Crop className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Scissors className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8 bg-[#3d3d3d] mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <FlipHorizontal className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <FlipVertical className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8 bg-[#3d3d3d] mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Ruler className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xs">Canvas</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <Code className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Separator className="bg-[#3d3d3d]" />

            {/* Canvas Background */}
            <div className="space-y-3">
              <Label className="text-white/70 text-xs">Background</Label>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Input
                    type="color"
                    value={canvasBg}
                    onInput={(e) => {
                      const val = (e.target as HTMLInputElement).value;
                      setBgColorInput(val);
                      if (bgColorRafRef.current) cancelAnimationFrame(bgColorRafRef.current);
                      bgColorRafRef.current = requestAnimationFrame(() => {
                        onCanvasBgChange(val);
                      });
                    }}
                    className="w-10 h-10 p-1 bg-[#1e1e1e] border-[#3d3d3d] cursor-pointer rounded"
                  />
                </div>
                <Input
                  type="text"
                  value={bgColorInput.toUpperCase()}
                  onChange={(e) => setBgColorInput(e.target.value)}
                  onBlur={(e) => handleBgColorChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBgColorChange((e.target as HTMLInputElement).value);
                    }
                  }}
                  className="flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-white h-10 text-xs"
                  placeholder="#FFFFFF"
                />
              </div>
              <div className="flex items-center gap-2">
                <input id="frame-bg-image" type="file" accept="image/*" className="hidden" onChange={async (e)=>{
                  const f=e.target.files?.[0]; if(!f||!onCanvasBgImageChange) return; const r=new FileReader(); const dataUrl: string=await new Promise((res)=>{ r.onload=()=>res(r.result as string); r.readAsDataURL(f); }); onCanvasBgImageChange(dataUrl);
                }} />
                <Button variant="outline" size="sm" className="bg-[#1e1e1e] border-[#3d3d3d] text-white/80" onClick={()=> document.getElementById('frame-bg-image')?.click()}>Set Background Image</Button>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={()=> onCanvasBgImageChange && onCanvasBgImageChange(null)}>Clear</Button>
              </div>
              {canvasBgImage && (
                <div className="mt-2">
                  <img src={canvasBgImage} alt="bg" className="w-full h-24 object-cover rounded border border-[#3d3d3d]" />
                </div>
              )}
              <p className="text-white/40 text-xs">Use hex format: #FFFFFF or FFF</p>
            </div>

            <div className="text-center pt-8">
              <p className="text-white/40 text-xs">Select a layer to edit</p>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#252525] border-b border-[#333]">
      <ScrollArea className="h-full">
        {/* Top Toolbar */}
        <div className="p-2 border-b border-[#333] bg-[#2a2a2a]">
          <div className="flex flex-wrap gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => {
                if (element.type === 'text') {
                  const current = (element.fontWeight || '400').toString();
                  const next = current === '700' ? '400' : '700';
                  onUpdateElement(element.id, { fontWeight: next });
                }
              }}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => {
                if (element.type === 'text') {
                  onUpdateElement(element.id, { fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' });
                }
              }}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => {
                if (element.type === 'text') {
                  onUpdateElement(element.id, { textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' });
                }
              }}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-8 bg-[#3d3d3d] mx-1" />
            <Button 
              variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => { 
                if (element.type === 'text') {
                  const activeEditable = document.querySelector('[data-editable="true"]:focus');
                  if (activeEditable) {
                    window.dispatchEvent(new CustomEvent('format-text', { detail: { action: 'align', value: 'left' } }));
                  } else {
                    onUpdateElement(element.id, { textAlign: 'left' });
                  }
                }
              }}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => { 
                if (element.type === 'text') {
                  const activeEditable = document.querySelector('[data-editable="true"]:focus');
                  if (activeEditable) {
                    window.dispatchEvent(new CustomEvent('format-text', { detail: { action: 'align', value: 'center' } }));
                  } else {
                    onUpdateElement(element.id, { textAlign: 'center' });
                  }
                }
              }}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => { 
                if (element.type === 'text') {
                  const activeEditable = document.querySelector('[data-editable="true"]:focus');
                  if (activeEditable) {
                    window.dispatchEvent(new CustomEvent('format-text', { detail: { action: 'align', value: 'right' } }));
                  } else {
                    onUpdateElement(element.id, { textAlign: 'right' });
                  }
                }
              }}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => { 
                if (element.type === 'text') {
                  const activeEditable = document.querySelector('[data-editable="true"]:focus');
                  if (activeEditable) {
                    window.dispatchEvent(new CustomEvent('format-text', { detail: { action: 'align', value: 'justify' } }));
                  } else {
                    onUpdateElement(element.id, { textAlign: 'justify' });
                  }
                }
              }}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-8 bg-[#3d3d3d] mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Crop className="h-4 w-4" />
            </Button>
            {element.type==='image' && (
              <>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs bg-[#1e1e1e] border-[#3d3d3d] text-white/80" onClick={async ()=>{
                  const src = element.imageSrc; if(!src) return;
                  const big = await new Promise<HTMLImageElement>((res,rej)=>{ const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>res(im); im.onerror=()=>rej(new Error('img')); im.src=src; });
                  const maxW = 512; const scale = Math.min(1, maxW / big.width); const mw = Math.max(1, Math.round(big.width * scale)); const mh = Math.max(1, Math.round(big.height * scale));
                  const mc = document.createElement('canvas'); mc.width=mw; mc.height=mh; const mctx = mc.getContext('2d'); if(!mctx) return;
                  mctx.drawImage(big, 0, 0, mw, mh);
                  const mdata = mctx.getImageData(0,0,mw,mh); const d=mdata.data;
                  const edgeSamples:number[] = [];
                  for (let x=0;x<mw;x++){ const i1=(0*mw + x)*4, i2=((mh-1)*mw + x)*4; edgeSamples.push(d[i1],d[i1+1],d[i1+2], d[i2],d[i2+1],d[i2+2]); }
                  for (let y=0;y<mh;y++){ const i1=(y*mw + 0)*4, i2=(y*mw + (mw-1))*4; edgeSamples.push(d[i1],d[i1+1],d[i1+2], d[i2],d[i2+1],d[i2+2]); }
                  let mr=0,mg=0,mb=0, cnt=edgeSamples.length/3; for(let i=0;i<edgeSamples.length;i+=3){ mr+=edgeSamples[i]; mg+=edgeSamples[i+1]; mb+=edgeSamples[i+2]; }
                  mr/=cnt; mg/=cnt; mb/=cnt;
                  const distEdge:number[]=[]; for(let i=0;i<edgeSamples.length;i+=3){ const dr=edgeSamples[i]-mr; const dg=edgeSamples[i+1]-mg; const db=edgeSamples[i+2]-mb; distEdge.push(Math.sqrt(dr*dr+dg*dg+db*db)); }
                  const mean = distEdge.reduce((a,b)=>a+b,0)/distEdge.length; const sd = Math.sqrt(distEdge.reduce((a,b)=>a+(b-mean)*(b-mean),0)/distEdge.length) || 1;
                  const thresh = mean + 2.5*sd;
                  const mask = new Uint8ClampedArray(mw*mh);
                  for(let y=0;y<mh;y++){
                    for(let x=0;x<mw;x++){
                      const idx=(y*mw + x)*4; const r=d[idx], g=d[idx+1], b=d[idx+2];
                      const dr=r-mr, dg=g-mg, db=b-mb; const dist=Math.sqrt(dr*dr+dg*dg+db*db);
                      mask[y*mw+x] = dist < thresh ? 255 : 0;
                    }
                  }
                  // Morphology (open then close)
                  const morph = (src:Uint8ClampedArray, w:number,h:number, rad:number, mode:'erode'|'dilate')=>{
                    const out=new Uint8ClampedArray(w*h); const r2=rad*rad;
                    for(let y=0;y<h;y++){
                      for(let x=0;x<w;x++){
                        let val = mode==='erode'?255:0;
                        for(let dy=-rad;dy<=rad;dy++){
                          const yy=y+dy; if(yy<0||yy>=h) continue;
                          for(let dx=-rad;dx<=rad;dx++){
                            const xx=x+dx; if(xx<0||xx>=w) continue; if(dx*dx+dy*dy>r2) continue;
                            const m = src[yy*w+xx];
                            if(mode==='erode') val = Math.min(val, m); else val = Math.max(val, m);
                          }
                        }
                        out[y*w+x]=val;
                      }
                    }
                    return out;
                  };
                  let m1 = morph(mask, mw, mh, 1, 'erode');
                  m1 = morph(m1, mw, mh, 1, 'dilate');
                  m1 = morph(m1, mw, mh, 1, 'dilate');
                  m1 = morph(m1, mw, mh, 1, 'erode');
                  // Feather (gaussian approx via box blur 3x)
                  const blur = (src:Uint8ClampedArray, w:number,h:number, rad:number)=>{
                    const tmp=new Uint8ClampedArray(w*h); const out=new Uint8ClampedArray(w*h);
                    for(let y=0;y<h;y++){
                      let sum=0; for(let x=0;x<w;x++){ const xi=Math.max(0, Math.min(w-1, x)); sum += src[y*w+xi]; const xo=x-rad-1; if(xo>=0) sum -= src[y*w+xo]; tmp[y*w+x]=sum/Math.min(x+1,rad+1); }
                    }
                    for(let x=0;x<w;x++){
                      let sum=0; for(let y=0;y<h;y++){ const yi=Math.max(0, Math.min(h-1, y)); sum += tmp[yi*w+x]; const yo=y-rad-1; if(yo>=0) sum -= tmp[yo*w+x]; out[y*w+x]=sum/Math.min(y+1,rad+1); }
                    }
                    return out;
                  };
                  let feather = blur(m1, mw, mh, 2);
                  // Compose full-res alpha by scaling mask up
                  const c=document.createElement('canvas'); c.width=big.width; c.height=big.height; const ctx=c.getContext('2d'); if(!ctx) return;
                  // draw original RGB
                  ctx.drawImage(big,0,0);
                  // build alpha from mask upscaled
                  const alphaC=document.createElement('canvas'); alphaC.width=big.width; alphaC.height=big.height; const actx=alphaC.getContext('2d'); if(!actx) return;
                  // put feather as grayscale to alpha canvas
                  const mImg = new ImageData(mw, mh); for(let i=0;i<feather.length;i++){ const v=feather[i]; mImg.data[i*4+0]=v; mImg.data[i*4+1]=v; mImg.data[i*4+2]=v; mImg.data[i*4+3]=255; }
                  const smallC=document.createElement('canvas'); smallC.width=mw; smallC.height=mh; const sctx=smallC.getContext('2d'); if(!sctx) return; sctx.putImageData(mImg,0,0);
                  actx.drawImage(smallC, 0,0, big.width, big.height);
                  const aData = actx.getImageData(0,0,big.width,big.height);
                  const rgb = ctx.getImageData(0,0,big.width,big.height);
                  for(let i=0;i<rgb.data.length;i+=4){ const a=aData.data[i]; // use mask as bg alpha
                    const inv = 255 - a; // keep foreground where mask low
                    rgb.data[i+3] = Math.max(0, Math.min(255, inv));
                  }
                  ctx.putImageData(rgb,0,0);
                  const preview=c.toDataURL('image/png');
                  onUpdateElement(element.id,{ tmpOriginalImage: element.tmpOriginalImage || element.imageSrc, imageSrc: preview, isPreview: true });
                }}>Remove Background</Button>
                <Button variant="outline" size="sm" className={`h-8 px-2 text-xs ${element.erasing? 'bg-blue-600 text-white':'bg-[#1e1e1e] border-[#3d3d3d] text-white/80'}`} onClick={()=> onUpdateElement(element.id,{ erasing: !element.erasing, eraseSize: element.eraseSize || 30, removingObject: false })}>Erase Object</Button>
                <Button variant="outline" size="sm" className={`h-8 px-2 text-xs ${element.removingObject? 'bg-blue-600 text-white':'bg-[#1e1e1e] border-[#3d3d3d] text-white/80'}`} onClick={()=> onUpdateElement(element.id,{ removingObject: !element.removingObject, erasing: false, removeBrushSize: element.removeBrushSize || 30, baseImageSrc: element.baseImageSrc || element.imageSrc })}>Remove Object</Button>
                {element.isPreview && (
                  <>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/80 hover:text-white" onClick={()=> onUpdateElement(element.id,{ isPreview: false, tmpOriginalImage: undefined })}>Apply</Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-white/80 hover:text-white" onClick={()=> onUpdateElement(element.id,{ imageSrc: element.tmpOriginalImage, isPreview: false, tmpOriginalImage: undefined })}>Cancel</Button>
                  </>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
              <Scissors className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-8 bg-[#3d3d3d] mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => onUpdateElement(element.id, { scaleX: (element.scaleX ?? 1) * -1 })}
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => onUpdateElement(element.id, { scaleY: (element.scaleY ?? 1) * -1 })}
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => onUpdateElement(element.id, { rotation: (element.rotation || 0) + 90 })}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-8 bg-[#3d3d3d] mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
              <Ruler className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-xs">Frame</span>
              <ChevronDown className="h-3.5 w-3.5 text-white/50" />
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                <Code className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Separator className="bg-[#3d3d3d]" />

          {/* Image: Remove Object controls */}
          {element.type==='image' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white text-xs">Remove Object</Label>
              </div>
              <div className="flex gap-2 items-center">
                <Switch checked={!!element.removingObject} onCheckedChange={(v)=> onUpdateElement(element.id,{ removingObject: v, erasing: false, baseImageSrc: element.baseImageSrc || element.imageSrc })} />
                <span className="text-white/60 text-xs">Brush to mark area. Hold Shift to erase mask.</span>
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-xs">Brush Size</Label>
                <Slider value={[element.removeBrushSize || 30]} min={5} max={200} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ removeBrushSize: v[0] })} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-[#1e1e1e] border-[#3d3d3d] text-white/80" onClick={()=>{
                  // Clear mask overlay
                  onUpdateElement(element.id,{ objectMask: undefined, maskOverlay: undefined });
                }}>Clear Mask</Button>
                <Button variant="default" size="sm" className="bg-blue-600 text-white" onClick={async ()=>{
                  // Commit removal using baseImageSrc and objectMask
                  if (!element.baseImageSrc || !element.objectMask) return;
                  const img = await new Promise<HTMLImageElement>((res,rej)=>{ const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>res(im); im.onerror=()=>rej(new Error('img')); im.src=element.baseImageSrc!; });
                  const mask = await new Promise<HTMLImageElement>((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>rej(new Error('mask')); im.src=element.objectMask!; });
                  const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const ctx=c.getContext('2d'); if(!ctx) return;
                  ctx.drawImage(img,0,0);
                  ctx.save();
                  ctx.globalCompositeOperation='destination-out';
                  ctx.drawImage(mask,0,0,img.width,img.height);
                  ctx.restore();
                  const out=c.toDataURL('image/png');
                  onUpdateElement(element.id,{ imageSrc: out, baseImageSrc: out, removingObject: false, objectMask: undefined, maskOverlay: undefined });
                }}>Apply Removal</Button>
                <Button variant="ghost" size="sm" className="text-white/80" onClick={()=>{
                  onUpdateElement(element.id,{ imageSrc: element.baseImageSrc || element.imageSrc, removingObject: false, objectMask: undefined, maskOverlay: undefined });
                }}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Image: Effects Panel */}
          {element.type==='image' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white text-xs">Effects</Label>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={()=> onUpdateElement(element.id,{ blur:0, brightness:100, contrast:100, saturation:100, grayscale:0, glow:0, shadow:0, vignette:0, glass:0 })}>Reset All</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Blur</Label>
                  <Slider value={[element.blur || 0]} min={0} max={20} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ blur: v[0] })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Brightness</Label>
                  <Slider value={[element.brightness || 100]} min={0} max={200} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ brightness: v[0] })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Contrast</Label>
                  <Slider value={[element.contrast || 100]} min={0} max={200} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ contrast: v[0] })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Saturation</Label>
                  <Slider value={[element.saturation || 100]} min={0} max={200} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ saturation: v[0] })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Grayscale</Label>
                  <Slider value={[element.grayscale || 0]} min={0} max={100} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ grayscale: v[0] })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Glow</Label>
                  <Slider value={[element.glow || 0]} min={0} max={100} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ glow: v[0] })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Shadow</Label>
                  <Slider value={[element.shadow || 0]} min={0} max={100} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ shadow: v[0] })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Vignette</Label>
                  <Slider value={[element.vignette || 0]} min={0} max={100} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ vignette: v[0] })} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-white/50 text-xs">Glass Effect</Label>
                  <Slider value={[element.glass || 0]} min={0} max={100} step={1} onValueChange={(v)=> onUpdateElement(element.id,{ glass: v[0] })} />
                </div>
              </div>
            </div>
          )}

          {/* Position */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white text-xs">Position</Label>
            </div>
            
            {/* Alignment buttons */}
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <AlignLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <AlignCenter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <AlignRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <AlignVerticalJustifyStart className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* X Y inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-white/50 text-xs">X</Label>
                <Input
                  type="number"
                  value={Math.round(element.x)}
                  onChange={(e) => onUpdateElement(element.id, { x: Number(e.target.value) })}
                  className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-xs">Y</Label>
                <Input
                  type="number"
                  value={Math.round(element.y)}
                  onChange={(e) => onUpdateElement(element.id, { y: Number(e.target.value) })}
                  className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs"
                />
              </div>
            </div>

            {/* Rotation */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-white/50 text-xs">
                  <span className="inline-block transform rotate-45">↻</span> {element.rotation || 0}°
                </Label>
                <Input
                  type="number"
                  value={element.rotation || 0}
                  onChange={(e) => onUpdateElement(element.id, { rotation: Number(e.target.value) })}
                  className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs"
                />
              </div>
              <div className="space-y-1 flex items-end gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                  <Lock className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-[#3d3d3d]" />

          {/* Typography (Text only) */}
          {element.type === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white text-xs">Typography</Label>
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <div className="space-y-1 col-span-2">
                  <Label className="text-white/50 text-xs">Font</Label>
                  <Select
                    value={element.fontFamily || 'Inter'}
                    onValueChange={(value) => {
                      ensureGoogleFontLoaded(value);
                      onUpdateElement(element.id, { fontFamily: value });
                    }}
                  >
                    <SelectTrigger className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs">
                      <SelectValue placeholder="Font" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-[#3d3d3d] text-white max-h-64">
                      {googleFonts.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Font Size</Label>
                  <Input
                    type="number"
                    value={Math.round(element.fontSize || 16)}
                    onChange={(e) => onUpdateElement(element.id, { fontSize: Number(e.target.value) })}
                    className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-white/50 text-xs">Font Weight</Label>
                  <Select
                    value={(element.fontWeight || '400').toString()}
                    onValueChange={(value) => onUpdateElement(element.id, { fontWeight: value })}
                  >
                    <SelectTrigger className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs">
                      <SelectValue placeholder="Weight" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-[#3d3d3d] text-white max-h-64">
                      {['100','200','300','400','500','600','700','800','900'].map(w => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-[#3d3d3d]" />

          {/* Layout */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white text-xs">Layout</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="4" y="4" width="7" height="7" strokeWidth="2"/>
                    <rect x="13" y="4" width="7" height="7" strokeWidth="2"/>
                    <rect x="4" y="13" width="7" height="7" strokeWidth="2"/>
                    <rect x="13" y="13" width="7" height="7" strokeWidth="2"/>
                  </svg>
                </Button>
              </div>
            </div>

            {/* Layout buttons */}
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                  <path d="M12 8v8M8 12h8" strokeWidth="2"/>
                </svg>
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="5" y="5" width="14" height="14" strokeWidth="2"/>
                  <path d="M12 9v6M9 12h6" strokeWidth="2"/>
                </svg>
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-[#1e1e1e] border-[#3d3d3d] text-white/70 hover:bg-white/10 hover:text-white">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="4" y="4" width="6" height="6" strokeWidth="2"/>
                  <rect x="14" y="4" width="6" height="6" strokeWidth="2"/>
                  <rect x="4" y="14" width="6" height="6" strokeWidth="2"/>
                  <rect x="14" y="14" width="6" height="6" strokeWidth="2"/>
                </svg>
              </Button>
            </div>

            {/* W H inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-white/50 text-xs">W</Label>
                <Input
                  type="number"
                  value={Math.round(element.width)}
                  onChange={(e) => onUpdateElement(element.id, { width: Number(e.target.value) })}
                  className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs"
                />
              </div>
              <div className="space-y-1 relative">
                <Label className="text-white/50 text-xs">H</Label>
                <Input
                  type="number"
                  value={Math.round(element.height)}
                  onChange={(e) => onUpdateElement(element.id, { height: Number(e.target.value) })}
                  className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs pr-8"
                />
                <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-1 top-6 text-white/70 hover:bg-white/10">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="4" y="4" width="16" height="16" strokeWidth="2" rx="2"/>
                  </svg>
                </Button>
              </div>
            </div>

            
          </div>

          <Separator className="bg-[#3d3d3d]" />

          {/* Appearance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white text-xs">Appearance</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <Circle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Input
                  type="number"
                  value={Math.round((element.opacity || 1) * 100)}
                  onChange={(e) => onUpdateElement(element.id, { opacity: Number(e.target.value) / 100 })}
                  className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs pr-6"
                />
                <span className="absolute right-2 top-2 text-xs text-white/40">%</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={element.rotation || 0}
                  onChange={(e) => onUpdateElement(element.id, { rotation: Number(e.target.value) })}
                  className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs pr-6"
                />
                <span className="absolute right-2 top-2 text-xs text-white/40">°</span>
              </div>
            </div>

            {(element.type === 'shape' || element.type==='image') && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 col-span-2">
                  <Label className="text-white/50 text-xs">Border Radius</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[element.borderRadius || 0]}
                      onValueChange={(v) => onUpdateElement(element.id, { borderRadius: v[0] })}
                      max={200}
                      step={1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={Math.round(element.borderRadius || 0)}
                      onChange={(e) => onUpdateElement(element.id, { borderRadius: Number(e.target.value) })}
                      className="w-16 bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs"
                    />
                  </div>
                </div>
                {element.type==='image' && (
                  <div className="space-y-1 col-span-2">
                    <Label className="text-white/50 text-xs">Erase Brush Size</Label>
                    <div className="flex items-center gap-2">
                      <Slider value={[element.eraseSize || 30]} onValueChange={(v)=> onUpdateElement(element.id,{ eraseSize: v[0] })} max={200} step={1} className="flex-1" />
                      <Input type="number" value={Math.round(element.eraseSize || 30)} onChange={(e)=> onUpdateElement(element.id,{ eraseSize: Number(e.target.value) })} className="w-16 bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-[#3d3d3d]" />

          {/* Fill */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white text-xs">Fill</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#1e1e1e] rounded p-2">
              <div className="relative">
                <Input
                  type="color"
                  value={element.type === 'shape' ? (element.backgroundColor || '#FFFFFF') : (element.color || '#000000')}
                  onChange={(e) => {
                    if (element.type === 'shape') {
                      onUpdateElement(element.id, { backgroundColor: e.target.value });
                      setElementColorInput(e.target.value);
                    } else if (element.type === 'text') {
                      const activeEditable = document.querySelector('[data-editable="true"]:focus');
                      if (activeEditable) {
                        window.dispatchEvent(new CustomEvent('format-text', { detail: { action: 'color', value: e.target.value } }));
                      } else {
                        onUpdateElement(element.id, { color: e.target.value });
                      }
                      setElementColorInput(e.target.value);
                    }
                  }}
                  className="w-8 h-8 p-1 bg-[#2a2a2a] border-[#3d3d3d] cursor-pointer rounded"
                />
              </div>
              <Input
                type="text"
                value={(element.type === 'shape' ? (element.backgroundColor || '#FFFFFF') : (element.color || '#000000')).toUpperCase()}
                onChange={(e) => setElementColorInput(e.target.value)}
                onBlur={(e) => {
                  if (element.type === 'shape') {
                    handleElementColorChange(e.target.value, 'backgroundColor');
                  } else if (element.type === 'text') {
                    handleElementColorChange(e.target.value, 'color');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    if (element.type === 'shape') {
                      handleElementColorChange(value, 'backgroundColor');
                    } else if (element.type === 'text') {
                      handleElementColorChange(value, 'color');
                    }
                  }
                }}
                className="flex-1 bg-[#2a2a2a] border-[#3d3d3d] text-white h-8 text-xs"
              />
              <div className="relative w-16">
                <Input
                  type="number"
                  value={element.type === 'shape' ? (element.fillOpacity || 100) : 100}
                  onChange={(e) => {
                    if (element.type === 'shape') {
                      onUpdateElement(element.id, { fillOpacity: Number(e.target.value) });
                    }
                  }}
                  className="bg-[#2a2a2a] border-[#3d3d3d] text-white h-8 text-xs pr-6"
                />
                <span className="absolute right-2 top-2 text-xs text-white/40">%</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Stroke */}
          {(element.type === 'shape' || element.type === 'path') && (
            <>
              <Separator className="bg-[#3d3d3d]" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white text-xs">Stroke</Label>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {element.strokeWidth && element.strokeWidth > 0 ? (
                  <div className="flex items-center gap-2 bg-[#1e1e1e] rounded p-2">
                    <Input
                      type="color"
                      value={element.strokeColor || '#000000'}
                      onChange={(e) => {
                        onUpdateElement(element.id, { strokeColor: e.target.value });
                        setElementColorInput(e.target.value);
                      }}
                      className="w-8 h-8 p-1 bg-[#2a2a2a] border-[#3d3d3d] cursor-pointer rounded"
                    />
                    <Input
                      type="text"
                      value={(element.strokeColor || '#000000').toUpperCase()}
                      onChange={(e) => setElementColorInput(e.target.value)}
                      onBlur={(e) => handleElementColorChange(e.target.value, 'strokeColor')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleElementColorChange((e.target as HTMLInputElement).value, 'strokeColor');
                        }
                      }}
                      className="flex-1 bg-[#2a2a2a] border-[#3d3d3d] text-white h-8 text-xs"
                    />
                    <div className="relative w-16">
                      <Input
                        type="number"
                        value={element.strokeWidth || 0}
                        onChange={(e) => onUpdateElement(element.id, { strokeWidth: Number(e.target.value) })}
                        className="bg-[#2a2a2a] border-[#3d3d3d] text-white h-8 text-xs pr-6"
                      />
                      <span className="absolute right-2 top-2 text-xs text-white/40">px</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
                      onClick={() => onUpdateElement(element.id, { strokeWidth: 0 })}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateElement(element.id, { strokeWidth: 2, strokeColor: '#000000' })}
                    className="w-full text-xs bg-[#1e1e1e] border-[#3d3d3d] text-white hover:bg-white/10"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Stroke
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Effects */}
          <Separator className="bg-[#3d3d3d]" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white text-xs">Effects</Label>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Image filters */}
            {element.type === 'image' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/70 text-xs">Blur</Label>
                    <span className="text-xs text-white/50">{element.blur || 0}px</span>
                  </div>
                  <Slider
                    value={[element.blur || 0]}
                    onValueChange={(value) => onUpdateElement(element.id, { blur: value[0] })}
                    min={0}
                    max={20}
                    step={0.5}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/70 text-xs">Brightness</Label>
                    <span className="text-xs text-white/50">{element.brightness || 100}%</span>
                  </div>
                  <Slider
                    value={[element.brightness || 100]}
                    onValueChange={(value) => onUpdateElement(element.id, { brightness: value[0] })}
                    min={0}
                    max={200}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Border radius for shapes */}
            {(element.type === 'shape' || element.type === 'image') && element.shapeType !== 'circle' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white/70 text-xs">Corner Radius</Label>
                  <span className="text-xs text-white/50">{element.borderRadius || 0}px</span>
                </div>
                <Slider
                  value={[element.borderRadius || 0]}
                  onValueChange={(value) => onUpdateElement(element.id, { borderRadius: value[0] })}
                  min={0}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Selection colors */}
          <Separator className="bg-[#3d3d3d]" />
          <div className="space-y-3">
            <Label className="text-white text-xs">Selection colors</Label>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-white rounded border border-[#3d3d3d]"></div>
              <div className="w-8 h-8 bg-blue-600 rounded border border-[#3d3d3d]"></div>
              <span className="text-xs text-white/50 flex items-center">+12</span>
            </div>
          </div>

          {/* Layout guide */}
          <Separator className="bg-[#3d3d3d]" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white text-xs">Layout guide</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white text-black hover:bg-gray-200">
                  <span className="text-sm">?</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
