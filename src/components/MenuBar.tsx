import { useState } from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarCheckboxItem,
} from './ui/menubar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Download, Save, FolderOpen, Undo, Redo, Copy, Scissors, ClipboardPaste, Trash2, FileImage, ZoomIn, ZoomOut, Grid3x3, Ruler, Crosshair } from 'lucide-react';

interface MenuBarProps {
  onExport: (format: 'png' | 'pdf' | 'svg' | 'jpeg') => void;
  onSave: () => void;
  onLoad: () => void;
  onOpenFile?: () => void;
  onOpenFromDrive?: () => void;
  onSaveToDrive?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onPostTemplate?: () => void;
  onViewTemplates?: () => void;
  user?: { name: string; avatarUrl?: string } | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onChangeAvatar?: (file: File) => void;
  onSelectAll?: () => void;
  onSetCanvasPreset?: (preset: 'instagram'|'story'|'banner'|'custom', custom?: {width:number;height:number}) => void;
}

export function MenuBar({ 
  onExport, 
  onSave, 
  onLoad, 
  onOpenFile,
  onOpenFromDrive,
  onSaveToDrive,
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  showGuides,
  onToggleGuides,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onCopy,
  onPaste,
  onCut,
  onPostTemplate,
  onViewTemplates,
  user,
  onLogin,
  onLogout,
  onChangeAvatar,
  onSelectAll,
  onSetCanvasPreset
}: MenuBarProps) {
  const avatarInputId = 'menu-avatar-input';
  const [openAvatarMenu, setOpenAvatarMenu] = useState(false);
  return (
    <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-3 gap-4">
      <div className="flex items-center gap-2">
        <ImageWithFallback 
          src="https://i.postimg.cc/xCpbkHF1/Generated-Image-November-03-2025-1-47PM.png"
          alt="Brand Kit Logo"
          className="h-8 w-8 object-contain"
        />
        <span className="text-white/90">Brand Kit Studio</span>
      </div>

      <Menubar className="border-none bg-transparent">
        <MenubarMenu>
          <MenubarTrigger className="text-white/90 hover:bg-white/10 cursor-pointer">
            File
          </MenubarTrigger>
          <MenubarContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
            <MenubarItem onClick={() => window.location.reload()} className="hover:bg-white/10 cursor-pointer">
              New Project
              <MenubarShortcut>Ctrl+N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onOpenFile} className="hover:bg-white/10 cursor-pointer">
              <FolderOpen className="mr-2 h-4 w-4" />
              Open from Computer
              <MenubarShortcut>Ctrl+O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onLoad} className="hover:bg-white/10 cursor-pointer">
              Open Local Project
            </MenubarItem>
            <MenubarItem onClick={onSave} className="hover:bg-white/10 cursor-pointer">
              <Save className="mr-2 h-4 w-4" />
              Save to Computer
              <MenubarShortcut>Ctrl+S</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onSaveToDrive} className="hover:bg-white/10 cursor-pointer">
              Save to Google Drive (beta)
            </MenubarItem>
            <MenubarSeparator className="bg-[#3d3d3d]" />
            <MenubarItem onClick={() => onExport('png')} className="hover:bg-white/10 cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              Export as PNG
            </MenubarItem>
            <MenubarItem onClick={() => onExport('jpeg')} className="hover:bg-white/10 cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              Export as JPEG
            </MenubarItem>
            <MenubarItem onClick={() => onExport('svg')} className="hover:bg-white/10 cursor-pointer">
              <FileImage className="mr-2 h-4 w-4" />
              Export as SVG
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-white/90 hover:bg-white/10 cursor-pointer">
            Templates
          </MenubarTrigger>
          <MenubarContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
            <MenubarItem onClick={onPostTemplate} className="hover:bg-white/10 cursor-pointer">
              Post as Template
            </MenubarItem>
            <MenubarItem onClick={onViewTemplates} className="hover:bg-white/10 cursor-pointer">
              View Templates
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-white/90 hover:bg-white/10 cursor-pointer">
            Edit
          </MenubarTrigger>
          <MenubarContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
            <MenubarItem onClick={onUndo} disabled={!canUndo} className="hover:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <Undo className="mr-2 h-4 w-4" />
              Undo
              <MenubarShortcut>Ctrl+Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onRedo} disabled={!canRedo} className="hover:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <Redo className="mr-2 h-4 w-4" />
              Redo
              <MenubarShortcut>Ctrl+Y</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator className="bg-[#3d3d3d]" />
            <MenubarItem onClick={onCut} className="hover:bg-white/10 cursor-pointer">
              <Scissors className="mr-2 h-4 w-4" />
              Cut
              <MenubarShortcut>Ctrl+X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onCopy} className="hover:bg-white/10 cursor-pointer">
              <Copy className="mr-2 h-4 w-4" />
              Copy
              <MenubarShortcut>Ctrl+C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onPaste} className="hover:bg-white/10 cursor-pointer">
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Paste
              <MenubarShortcut>Ctrl+V</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onSelectAll} className="hover:bg-white/10 cursor-pointer">
              Select All
              <MenubarShortcut>Ctrl+A</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator className="bg-[#3d3d3d]" />
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
              <MenubarShortcut>Del</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-white/90 hover:bg-white/10 cursor-pointer">
            Frame
          </MenubarTrigger>
          <MenubarContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
            <MenubarItem onClick={() => onSetCanvasPreset && onSetCanvasPreset('instagram')} className="hover:bg-white/10 cursor-pointer">
              Instagram Post 1080×1080
            </MenubarItem>
            <MenubarItem onClick={() => onSetCanvasPreset && onSetCanvasPreset('story')} className="hover:bg-white/10 cursor-pointer">
              Story 1080×1920
            </MenubarItem>
            <MenubarItem onClick={() => onSetCanvasPreset && onSetCanvasPreset('banner')} className="hover:bg-white/10 cursor-pointer">
              Banner 1920×600
            </MenubarItem>
            <MenubarItem onClick={() => {
              const w = parseInt(prompt('Custom width (px)') || '0');
              const h = parseInt(prompt('Custom height (px)') || '0');
              if (w > 0 && h > 0) onSetCanvasPreset && onSetCanvasPreset('custom', { width: w, height: h });
            }} className="hover:bg-white/10 cursor-pointer">
              Custom Size…
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-white/90 hover:bg-white/10 cursor-pointer">
            View
          </MenubarTrigger>
          <MenubarContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
            <MenubarItem onClick={onZoomIn} className="hover:bg-white/10 cursor-pointer">
              <ZoomIn className="mr-2 h-4 w-4" />
              Zoom In
              <MenubarShortcut>Ctrl++</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onZoomOut} className="hover:bg-white/10 cursor-pointer">
              <ZoomOut className="mr-2 h-4 w-4" />
              Zoom Out
              <MenubarShortcut>Ctrl+-</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onFitToScreen} className="hover:bg-white/10 cursor-pointer">
              Fit to Screen
              <MenubarShortcut>Ctrl+0</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator className="bg-[#3d3d3d]" />
            <MenubarCheckboxItem 
              checked={showRulers}
              onCheckedChange={onToggleRulers}
              className="hover:bg-white/10 cursor-pointer"
            >
              <Ruler className="mr-2 h-4 w-4" />
              Show Rulers
            </MenubarCheckboxItem>
            <MenubarCheckboxItem 
              checked={showGrid}
              onCheckedChange={onToggleGrid}
              className="hover:bg-white/10 cursor-pointer"
            >
              <Grid3x3 className="mr-2 h-4 w-4" />
              Show Grid
            </MenubarCheckboxItem>
            <MenubarCheckboxItem 
              checked={showGuides}
              onCheckedChange={onToggleGuides}
              className="hover:bg-white/10 cursor-pointer"
            >
              <Crosshair className="mr-2 h-4 w-4" />
              Show Guides
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-white/90 hover:bg-white/10 cursor-pointer">
            Layer
          </MenubarTrigger>
          <MenubarContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              New Layer
            </MenubarItem>
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Duplicate Layer
              <MenubarShortcut>Ctrl+D</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator className="bg-[#3d3d3d]" />
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Bring to Front
              <MenubarShortcut>Ctrl+]</MenubarShortcut>
            </MenubarItem>
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Send to Back
              <MenubarShortcut>Ctrl+[</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator className="bg-[#3d3d3d]" />
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Lock Layer
            </MenubarItem>
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Hide Layer
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-white/90 hover:bg-white/10 cursor-pointer">
            Text
          </MenubarTrigger>
          <MenubarContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Add Text Layer
            </MenubarItem>
            <MenubarSeparator className="bg-[#3d3d3d]" />
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Bold
              <MenubarShortcut>Ctrl+B</MenubarShortcut>
            </MenubarItem>
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Italic
              <MenubarShortcut>Ctrl+I</MenubarShortcut>
            </MenubarItem>
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Underline
              <MenubarShortcut>Ctrl+U</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-white/90 hover:bg-white/10 cursor-pointer">
            Help
          </MenubarTrigger>
          <MenubarContent className="bg-[#2d2d2d] border-[#3d3d3d] text-white">
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Documentation
            </MenubarItem>
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              Keyboard Shortcuts
            </MenubarItem>
            <MenubarSeparator className="bg-[#3d3d3d]" />
            <MenubarItem className="hover:bg-white/10 cursor-pointer">
              About Brand Kit
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            <input id={avatarInputId} type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f && onChangeAvatar) onChangeAvatar(f); }} />
            <div className="relative">
              {user.avatarUrl ? (
                <button title="Profile" onClick={()=> setOpenAvatarMenu(v=>!v)} className="p-0 border-0 bg-transparent">
                  <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full object-cover border border-[#3d3d3d]" />
                </button>
              ) : (
                <button title="Profile" onClick={()=> setOpenAvatarMenu(v=>!v)} className="h-7 w-7 rounded-full bg-[#3a3a3a] text-white/80 flex items-center justify-center text-xs border border-[#3d3d3d]">
                  {user.name.slice(0,1).toUpperCase()}
                </button>
              )}
              {openAvatarMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-[#2d2d2d] border border-[#3d3d3d] rounded-md shadow-lg z-50">
                  <button onClick={()=>{ setOpenAvatarMenu(false); document.getElementById(avatarInputId)?.click(); }} className="w-full text-left px-3 py-2 text-white/90 hover:bg-white/10">Upload photo</button>
                </div>
              )}
            </div>
            <span className="text-white/80 text-sm max-w-[140px] truncate">{user.name}</span>
            <button onClick={onLogout} className="text-white/70 hover:text-white text-sm px-2 py-1 border border-[#3d3d3d] rounded-[4px] cursor-pointer">
              Logout
            </button>
          </div>
        ) : (
          <button onClick={onLogin} className="ml-auto text-white/80 hover:text-white text-sm px-3 py-1 border border-[#3d3d3d] rounded-[4px] cursor-pointer">
            Login
          </button>
        )}
      </div>
    </div>
  );
}
