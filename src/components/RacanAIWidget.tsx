import React, { useEffect, useMemo, useRef, useState } from 'react';

interface RacanAIWidgetProps {
  onInsertImage: (dataUrl: string, kind: 'poster' | 'logo' | 'apparel' | 'model' | 'generic') => void;
}

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  imageDataUrl?: string;
};

const QUICK_ACTIONS: { label: string; kind: 'poster'|'apparel'|'logo'|'model'; prompt: string }[] = [
  { label: 'Generate Product Concept', kind: 'poster', prompt: 'Create poster for summer fashion launch' },
  { label: 'Design Apparel', kind: 'apparel', prompt: 'Design apparel: modern streetwear hoodie concept' },
  { label: 'Create Logo', kind: 'logo', prompt: 'Create a minimal monogram brand logo' },
  { label: 'Visualize Model Shoot', kind: 'model', prompt: 'Visualize model shoot for skincare campaign' },
];

export default function RacanAIWidget({ onInsertImage }: RacanAIWidgetProps) {
  const [apiKeyFromFile, setApiKeyFromFile] = useState<string | undefined>(undefined);
  const [apiKeyOverride, setApiKeyOverride] = useState<string | undefined>(() => {
    try { return localStorage.getItem('VITE_GEMINI_API_KEY') || undefined; } catch { return undefined; }
  });
  const apiKey = apiKeyOverride || (import.meta as any).env?.VITE_GEMINI_API_KEY || (globalThis as any).VITE_GEMINI_API_KEY || apiKeyFromFile;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [kind, setKind] = useState<'poster'|'logo'|'apparel'|'model'|'generic'>('generic');
  const fileRef = useRef<HTMLInputElement>(null);
  const [showApiEditor, setShowApiEditor] = useState(false);
  const [apiDraft, setApiDraft] = useState('');

  const disabled = useMemo(() => !apiKey, [apiKey]);

  // Fallback: attempt to read API key from src/components/API.env
  useEffect(() => {
    if (apiKeyOverride || apiKey) return;
    try {
      const url = new URL('./API.env', import.meta.url);
      fetch(url.toString())
        .then((r) => r.text())
        .then((txt) => {
          const match = txt.match(/VITE_GEMINI_API_KEY\s*=\s*([^\n\r]+)/);
          if (match) setApiKeyFromFile(match[1].trim());
        })
        .catch(() => {});
    } catch {}
  }, [apiKey, apiKeyOverride]);

  const parseImageFromText = (text: string): { dataUrl?: string; imageUrl?: string } => {
    // data URL present
    const dataUrlMatch = text.match(/(data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+)/i);
    if (dataUrlMatch) return { dataUrl: dataUrlMatch[1] };

    // markdown image syntax ![](url)
    const mdImg = text.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (mdImg) return { imageUrl: mdImg[1] };

    // plain URL
    const url = text.match(/https?:[^\s)]+\.(?:png|jpg|jpeg|webp)/i);
    if (url) return { imageUrl: url[0] };

    return {};
  };

  const fetchAsDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const kindFromPrompt = (p: string): 'poster'|'logo'|'apparel'|'model'|'generic' => {
    const s = p.toLowerCase();
    if (s.includes('logo')) return 'logo';
    if (s.includes('apparel') || s.includes('t-shirt') || s.includes('hoodie')) return 'apparel';
    if (s.includes('model') || s.includes('shoot')) return 'model';
    if (s.includes('poster') || s.includes('banner') || s.includes('flyer')) return 'poster';
    return 'generic';
  };

  const sendPrompt = async (basePrompt: string, chosenKind?: 'poster'|'logo'|'apparel'|'model') => {
    const finalKind = chosenKind ?? kindFromPrompt(basePrompt);
    setKind(finalKind);

    const userMsg: ChatMsg = { id: String(Date.now()), role: 'user', text: basePrompt };
    setMessages((m) => [...m, userMsg]);

    if (!apiKey) {
      const warn: ChatMsg = { id: String(Date.now()+1), role: 'assistant', text: 'Missing API key (VITE_GEMINI_API_KEY). Please configure it.' };
      setMessages((m) => [...m, warn]);
      return;
    }

    setLoading(true);
    try {
      const sysInstruction = `You are Racan AI, an intelligent creative studio for fashion, beauty, skincare and branding. When possible, return a single image as either a data URL (data:image/png;base64,...) or a direct PNG/JPEG/WEBP URL on its own line. Additionally, include a short concept description.`;
      const body = {
        contents: [
          { role: 'user', parts: [{ text: sysInstruction + "\n\nPrompt: " + basePrompt }] },
        ],
      };
      const tryModels = [
        (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
      ];

      let data: any = null;
      let lastErr: any = null;
      for (const model of tryModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const j = await resp.json();
          if (resp.ok && !j.error) { data = j; break; }
          lastErr = j;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!data) {
        const errText = typeof lastErr === 'string' ? lastErr : JSON.stringify(lastErr);
        throw new Error(errText || 'Model call failed');
      }

      let text = '';
      try {
        text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') || '';
      } catch {}
      if (!text) text = JSON.stringify(data);

      let imageDataUrl: string | undefined;
      const parsed = parseImageFromText(text);
      if (parsed.dataUrl) {
        imageDataUrl = parsed.dataUrl;
      } else if (parsed.imageUrl) {
        try { imageDataUrl = await fetchAsDataUrl(parsed.imageUrl); } catch {}
      }

      const aiMsg: ChatMsg = { id: String(Date.now()+2), role: 'assistant', text, imageDataUrl };
      setMessages((m) => [...m, aiMsg]);

      if (imageDataUrl) {
        onInsertImage(imageDataUrl, finalKind);
      }
    } catch (e: any) {
      const err: ChatMsg = { id: String(Date.now()+3), role: 'assistant', text: 'Error: ' + (e?.message || 'Failed to call API') };
      setMessages((m) => [...m, err]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Inline-flex div trigger per spec */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v)=>!v); } }}
        title="Racan AI"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 size-9 rounded-md h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
        style={{ cursor: 'pointer' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://i.postimg.cc/VsFmP0Fm/Racan-ai.jpg" alt="Racan AI" className="h-5 w-5 rounded-sm object-cover" />
      </div>

      {/* Floating panel, bottom-right of app */}
      {open && (
        <div className="fixed right-4 bottom-4 z-50 w-[360px] max-w-[92vw] rounded border border-[#3d3d3d] bg-[#1e1e1e] shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2d2d]">
            <div className="flex items-center gap-2">
              <img src="https://i.postimg.cc/VsFmP0Fm/Racan-ai.jpg" alt="Racan AI" className="h-6 w-6 rounded-sm object-cover" />
              <div className="text-sm font-medium">Racan AI</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-xs px-2 py-1 rounded border border-[#3d3d3d] text-white/70 hover:text-white hover:bg-white/10" onClick={() => { setApiDraft(apiKey || ''); setShowApiEditor((v)=>!v); }}>API</button>
              <button className="text-white/60 hover:text-white/90" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {showApiEditor && (
            <form
              className="px-3 py-2 border-b border-[#2d2d2d] flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); setApiKeyOverride(apiDraft.trim()); try { localStorage.setItem('VITE_GEMINI_API_KEY', apiDraft.trim()); } catch {}; setShowApiEditor(false); }}
            >
              <input
                className="flex-1 text-xs bg-[#1e1e1e] border border-[#3d3d3d] rounded px-2 py-1 outline-none focus:border-[#4d4d4d]"
                placeholder="Enter Gemini API Key"
                value={apiDraft}
                onChange={(e) => setApiDraft(e.target.value)}
              />
              <button className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:opacity-90" type="submit">Save</button>
            </form>
          )}

          {/* Quick actions */}
          <div className="px-3 py-2 flex flex-wrap gap-2 border-b border-[#2d2d2d]">
            {QUICK_ACTIONS.map(q => (
              <button
                key={q.label}
                className="text-xs px-2 py-1 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#3d3d3d]"
                onClick={() => sendPrompt(q.prompt, q.kind)}
                disabled={loading}
              >{q.label}</button>
            ))}
          </div>

          {/* Messages */}
          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {messages.map(m => (
              <div key={m.id} className={m.role === 'user' ? 'text-white' : 'text-white/80'}>
                <div className="text-xs mb-1 opacity-60">{m.role === 'user' ? 'You' : 'Racan AI'}</div>
                <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                {m.imageDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageDataUrl} alt="AI" className="mt-2 w-full rounded border border-[#3d3d3d]" />
                )}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-xs text-white/50">Ask for designs like “Create poster for summer fashion launch”.</div>
            )}
          </div>

          {/* Input */}
          <form
            className="flex items-center gap-2 p-3 border-t border-[#2d2d2d]"
            onSubmit={(e) => { e.preventDefault(); if (!input.trim()) return; sendPrompt(input.trim()); setInput(''); }}
          >
            <input
              className="flex-1 text-sm bg-[#1e1e1e] border border-[#3d3d3d] rounded px-2 py-2 outline-none focus:border-[#4d4d4d]"
              placeholder={disabled ? 'Set VITE_GEMINI_API_KEY to enable' : 'Describe what to create...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              className="text-xs px-3 py-2 rounded bg-blue-600 text-white hover:opacity-90 disabled:opacity-50"
              disabled={loading || disabled}
            >{loading ? 'Generating...' : 'Send'}</button>
          </form>
        </div>
      )}

      <input ref={fileRef} type="file" className="hidden" />
    </div>
  );
}
