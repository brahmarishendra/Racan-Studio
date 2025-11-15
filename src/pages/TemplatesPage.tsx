import { useEffect, useMemo, useState } from 'react';

interface TemplateItem {
  id: string;
  name: string;
  thumbnail: string;
  ownerName?: string;
  ownerAvatar?: string;
  isPublic?: boolean;
}

interface TemplatesPageProps {
  items: TemplateItem[];
  onRefresh: () => Promise<void> | void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
  onBack: () => void;
  onChangeCover?: (id: string, dataUrl: string) => void;
  title?: string;
}

export function TemplatesPage({ items, onRefresh, onOpen, onDelete, onRename, onTogglePublic, onBack, onChangeCover, title = 'Templates' }: TemplatesPageProps) {
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const withTimeout = async () => {
      try {
        await Promise.race([
          Promise.resolve(onRefresh()).catch(() => {}),
          new Promise<void>(resolve => setTimeout(resolve, 2000)),
        ]);
      } catch {}
    };
    // initial
    void withTimeout();
    // poll every 3s
    const id = setInterval(() => { if (alive) void withTimeout(); }, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [onRefresh]);

  const selected = useMemo(() => items.find(t => t.id === selectedId) || null, [items, selectedId]);

  const toCoverThumb = async (file: File): Promise<string> => {
    const useBitmap = typeof createImageBitmap === 'function';
    let imgW = 0, imgH = 0;
    const targetW = 800;
    const targetH = 600;
    let drawSrc: any = null;
    if (useBitmap) {
      try {
        const bmp = await createImageBitmap(file);
        drawSrc = bmp; imgW = bmp.width; imgH = bmp.height;
      } catch {}
    }
    if (!drawSrc) {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error('read'));
        r.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error('img'));
        im.src = dataUrl;
      });
      drawSrc = img; imgW = img.width; imgH = img.height;
    }
    const srcAspect = imgW / imgH;
    const dstAspect = targetW / targetH;
    let sx = 0, sy = 0, sw = imgW, sh = imgH;
    if (srcAspect > dstAspect) {
      const newW = imgH * dstAspect;
      sx = (imgW - newW) / 2;
      sw = newW;
    } else if (srcAspect < dstAspect) {
      const newH = imgW / dstAspect;
      sy = (imgH - newH) / 2;
      sh = newH;
    }
    const c = document.createElement('canvas');
    c.width = targetW; c.height = targetH;
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(drawSrc, sx, sy, sw, sh, 0, 0, targetW, targetH);
    return c.toDataURL('image/jpeg', 0.9);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e0e0e', color: '#fff', fontFamily: 'Inter, system-ui, Arial', display: 'flex', flexDirection: 'column' }}>
      <style>{`.tpl-card{border-radius:1px} .tpl-card:hover{transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.35)} .tpl-image:after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55),transparent 55%)} .pill{background:#171717;border:1px solid #2d2d2d;border-radius:12px;padding:10px 14px}`}</style>

      {/* Top Nav */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #242424', background:'#121212', gap:8, flexWrap:'wrap' }}>
        <div className="pill" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:14, fontWeight:600 }}>{title || 'Templates'}</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>onRefresh()} style={{ background:'#171717', color:'#fff', border:'1px solid #2d2d2d', padding:'8px 12px', borderRadius:8, fontSize:12, cursor:'pointer' }}>⟳ Refresh</button>
          <button onClick={onBack} style={{ background:'#171717', color:'#fff', border:'1px solid #2d2d2d', padding:'8px 12px', borderRadius:8, fontSize:12, cursor:'pointer' }}>← Back to Editor</button>
        </div>
      </div>

      {/* Selected actions */}
      {selected && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #242424', background:'#151515' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:14, fontWeight:500 }}>{selected.name || 'Untitled'}</span>
            <span style={{ fontSize:12, color:'#9aa0a6' }}>{selected.isPublic ? 'Public' : 'Private'} • You</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={()=>onOpen(selected.id)} style={{ background:'transparent', color:'#fff', border:'1px solid #2d2d2d', padding:'6px 10px', borderRadius:6, fontSize:12, cursor:'pointer' }}>Open</button>
            <button onClick={()=>{ setRenameId(selected.id); setRenameVal(selected.name || ''); }} style={{ background:'transparent', color:'#fff', border:'1px solid #2d2d2d', padding:'6px 10px', borderRadius:6, fontSize:12, cursor:'pointer' }}>Rename</button>
            {onChangeCover && (
              <>
                <input id={`tpl-cover-${selected.id}`} type="file" accept="image/*" className="hidden" onChange={async (e)=>{ const f=e.target.files?.[0]; if(!f) return; const thumb=await toCoverThumb(f); onChangeCover(selected.id, thumb); }} />
                <button onClick={()=> document.getElementById(`tpl-cover-${selected.id}`)?.click()} style={{ background:'transparent', color:'#fff', border:'1px solid #2d2d2d', padding:'6px 10px', borderRadius:6, fontSize:12, cursor:'pointer' }}>Cover (Local)</button>
                <button onClick={async ()=>{ const url = window.prompt('Enter image URL (.png or .jpg):')?.trim(); if(!url) return; if(!/^https?:\/\/.+\.(png|jpg|jpeg)(\?.*)?$/i.test(url)) { alert('Please enter a valid .png or .jpg URL'); return; } try { onChangeCover(selected.id, url); } catch {} }} style={{ background:'transparent', color:'#fff', border:'1px solid #2d2d2d', padding:'6px 10px', borderRadius:6, fontSize:12, cursor:'pointer' }}>Cover (URL)</button>
              </>
            )}
            <button onClick={()=> onTogglePublic(selected.id, !(selected.isPublic ?? false))} style={{ background:'transparent', color:'#fff', border:'1px solid #2d2d2d', padding:'6px 10px', borderRadius:6, fontSize:12, cursor:'pointer' }}>{selected.isPublic ? 'Make Private' : 'Make Public'}</button>
            <button onClick={()=> onDelete(selected.id)} style={{ background:'#e5484d', color:'#fff', border:'1px solid #8f1d22', padding:'6px 10px', borderRadius:6, fontSize:12, cursor:'pointer' }}>Delete</button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ padding:16, flex:1, overflow:'auto' }}>
        {items.length === 0 ? (
          <div style={{ color:'#b3b3b3', padding:8 }}>No templates yet. Use "Post as Template" from the menu.</div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
              {(selected ? items.slice(0,4) : items.slice(0,4)).map(tpl => (
                <div key={tpl.id} className="tpl-card" style={{ border:'1px solid #262626', borderRadius:1, overflow:'hidden', background:'#141414', cursor:'pointer', transition:'all .2s ease' }} onClick={()=> setSelectedId(tpl.id)}>
                  <div className="tpl-image" style={{ position:'relative', width:'100%', height:260, backgroundSize:'cover', backgroundPosition:'center', backgroundImage: tpl.thumbnail ? `url(${tpl.thumbnail})` : 'none' }}>
                    {!tpl.thumbnail && (
                      <div className="absolute inset-0">
                        <svg viewBox="0 0 400 300" className="w-full h-full">
                          <defs>
                            <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2a2a2a"/><stop offset="100%" stopColor="#171717"/></linearGradient>
                          </defs>
                          <rect x="0" y="0" width="400" height="300" rx="16" fill="url(#g2)" />
                          <rect x="24" y="28" width="230" height="20" rx="4" fill="#3a3a3a" />
                          <rect x="24" y="60" width="180" height="12" rx="4" fill="#343434" />
                          <rect x="24" y="80" width="120" height="12" rx="4" fill="#343434" />
                        </svg>
                      </div>
                    )}
                    <div style={{ position:'absolute', left:0, right:0, bottom:0, padding:12 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{tpl.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selected && (
              <div style={{ marginTop:24 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <h3 style={{ fontSize:16, fontWeight:600, margin:0 }}>More templates</h3>
                  <button onClick={()=> setSelectedId(null)} style={{ background:'transparent', color:'#9aa0a6', border:'1px solid #2d2d2d', padding:'6px 10px', borderRadius:6, fontSize:12 }}>See all</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
                  {items.slice(4).map(tpl => (
                    <div key={tpl.id} className="tpl-card" style={{ border:'1px solid #262626', borderRadius:1, overflow:'hidden', background:'#141414', cursor:'pointer', transition:'all .2s ease' }} onClick={()=> setSelectedId(tpl.id)}>
                      <div className="tpl-image" style={{ position:'relative', width:'100%', height:260, backgroundSize:'cover', backgroundPosition:'center', backgroundImage: tpl.thumbnail ? `url(${tpl.thumbnail})` : 'none' }}>
                        {!tpl.thumbnail && (
                          <div className="absolute inset-0">
                            <svg viewBox="0 0 400 300" className="w-full h-full">
                              <rect x="0" y="0" width="400" height="300" rx="16" fill="#1b1b1b" />
                              <rect x="24" y="28" width="200" height="18" rx="4" fill="#333" />
                              <rect x="24" y="56" width="160" height="12" rx="4" fill="#2e2e2e" />
                            </svg>
                          </div>
                        )}
                        <div style={{ position:'absolute', left:0, right:0, bottom:0, padding:12 }}>
                          <div style={{ fontSize:14, fontWeight:600 }}>{tpl.name}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rename inline dialog area */}
      {renameId && (
        <div style={{ position:'fixed', left:0, right:0, bottom:16, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ pointerEvents:'auto', background:'#151515', border:'1px solid #2a2a2a', borderRadius:10, padding:10, display:'flex', gap:8 }}>
            <input value={renameVal} onChange={e=>setRenameVal(e.target.value)} style={{ background:'#0f0f0f', border:'1px solid #2a2a2a', color:'#fff', padding:'6px 8px', borderRadius:6 }} />
            <button onClick={()=>{ const id=renameId; setRenameId(null); onRename(id, renameVal.trim() || 'Untitled'); }} style={{ background:'#2e7afa', border:'1px solid #1852ad', color:'#fff', padding:'6px 10px', borderRadius:6 }}>Save</button>
            <button onClick={()=> setRenameId(null)} style={{ background:'transparent', color:'#9aa0a6', border:'1px solid #2d2d2d', padding:'6px 10px', borderRadius:6 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
