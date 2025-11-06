import React from 'react';
import { HistoryItem } from '../types';
import { NewProjectIcon, HistoryIcon } from './icons';

interface SidebarProps {
  history: HistoryItem[];
  onNewProject: () => void;
  onLoadHistory: (prompt: string, name: string) => void;
  isSidebarOpen: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({ history, onNewProject, onLoadHistory, isSidebarOpen }) => (
  <aside className={`bg-white/60 backdrop-blur-xl border-r border-slate-200/50 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 p-4' : 'w-0 p-0 overflow-hidden'}`}>
    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6 flex-shrink-0">ZECREV CODER</h1>
    <button onClick={onNewProject} className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md mb-6 flex-shrink-0">
      <NewProjectIcon /> New Project
    </button>
    <div className="flex items-center gap-2 text-slate-600 mb-3 flex-shrink-0">
      <HistoryIcon />
      <h2 className="text-lg font-semibold">History</h2>
    </div>
    <div className="overflow-y-auto flex-grow">
      {history.length > 0 ? (
        history.map(item => (
          <div key={item.id} onClick={() => onLoadHistory(item.prompt, item.name)} className="p-3 mb-2 bg-white/50 rounded-lg cursor-pointer hover:bg-white/80 border border-slate-200/80 transition-all duration-200">
            <p className="font-semibold truncate text-slate-700">{item.name}</p>
            <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</p>
          </div>
        ))
      ) : (
        <p className="text-slate-400 text-center mt-4">No history yet.</p>
      )}
    </div>
  </aside>
);

export const Sidebar = React.memo(SidebarComponent);
