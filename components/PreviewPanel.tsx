import React, { useState, useMemo } from 'react';
import { PreviewDevice } from '../types';
import { DesktopIcon, PhoneIcon, TabletIcon, ExternalLinkIcon, ZoomInIcon, ZoomOutIcon, ZoomResetIcon } from './icons';

interface PreviewPanelProps {
  htmlContent: string;
  onOpenInNewTab: () => void;
}

const PreviewPanelComponent: React.FC<PreviewPanelProps> = ({ htmlContent, onOpenInNewTab }) => {
  const [device, setDevice] = useState<PreviewDevice>('window');
  const [zoom, setZoom] = useState(1);

  const deviceClasses = useMemo(() => {
    switch (device) {
      case 'phone': return 'w-[375px] h-[667px] border-[8px] border-black rounded-[40px] shadow-2xl';
      case 'tab': return 'w-[768px] h-[1024px] border-[10px] border-black rounded-[40px] shadow-2xl';
      case 'window':
      default:
        return 'w-full h-full';
    }
  }, [device]);
  
  const handleZoom = (level: number) => {
    setZoom(prev => Math.max(0.25, Math.min(2, prev + level)));
  }

  const iframeKey = useMemo(() => `${device}-${htmlContent.length}`, [device, htmlContent.length]);

  return (
    <div className="w-1/2 flex flex-col bg-white/60 backdrop-blur-xl rounded-2xl m-2 overflow-hidden border border-slate-200/50 shadow-xl">
      <div className="bg-white/30 p-2 flex items-center justify-center gap-2 border-b border-slate-200/50 text-slate-600 flex-shrink-0">
        <button onClick={() => setDevice('window')} className={`p-2 rounded-md ${device === 'window' ? 'bg-blue-600 text-white' : 'bg-slate-200/70 hover:bg-slate-300/80'}`} title="Desktop"><DesktopIcon /></button>
        <button onClick={() => setDevice('tab')} className={`p-2 rounded-md ${device === 'tab' ? 'bg-blue-600 text-white' : 'bg-slate-200/70 hover:bg-slate-300/80'}`} title="Tablet"><TabletIcon /></button>
        <button onClick={() => setDevice('phone')} className={`p-2 rounded-md ${device === 'phone' ? 'bg-blue-600 text-white' : 'bg-slate-200/70 hover:bg-slate-300/80'}`} title="Phone"><PhoneIcon /></button>
        <div className="h-6 w-px bg-slate-300/50 mx-2"></div>
        <button onClick={() => handleZoom(0.1)} className="p-2 rounded-md bg-slate-200/70 hover:bg-slate-300/80" title="Zoom In"><ZoomInIcon/></button>
        <button onClick={() => handleZoom(-0.1)} className="p-2 rounded-md bg-slate-200/70 hover:bg-slate-300/80" title="Zoom Out"><ZoomOutIcon/></button>
        <button onClick={() => setZoom(1)} className="p-2 rounded-md bg-slate-200/70 hover:bg-slate-300/80" title="Reset Zoom"><ZoomResetIcon/></button>
         <span className="text-sm font-mono w-12 text-center text-slate-700">{Math.round(zoom*100)}%</span>
        <div className="h-6 w-px bg-slate-300/50 mx-2"></div>
        <button onClick={onOpenInNewTab} className="p-2 rounded-md bg-slate-200/70 hover:bg-slate-300/80" title="Open in new tab"><ExternalLinkIcon/></button>
      </div>
      <div className="flex-grow bg-slate-200/30 p-4 flex items-center justify-center overflow-auto">
        <div 
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }} 
            className={`transition-transform duration-150 ease-in-out ${device !== 'window' ? 'p-2' : ''}`}
        >
            <iframe
                key={iframeKey}
                srcDoc={htmlContent}
                title="Website Preview"
                className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${deviceClasses} ${device !== 'window' ? 'overflow-hidden' : ''}`}
                sandbox="allow-scripts allow-same-origin"
            />
        </div>
      </div>
    </div>
  );
};

export const PreviewPanel = React.memo(PreviewPanelComponent);
