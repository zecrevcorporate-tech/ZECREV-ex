import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Project, HistoryItem, ChatMessage } from './types';
import { generateWebsiteCode, refineWebsiteCode } from './services/geminiService';
import { downloadCodeAsZip } from './utils/fileUtils';
import { Sidebar } from './components/Sidebar';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { CloseIcon, NewProjectIcon, MenuIcon } from './components/icons';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const previewChannel = useRef<BroadcastChannel | null>(null);

  const activeProject = useMemo(() => activeProjectId ? projects[activeProjectId] : null, [projects, activeProjectId]);
  const sortedProjects = useMemo(() => Object.values(projects).sort((a: Project, b: Project) => a.createdAt - b.createdAt), [projects]);

  const [editorCode, setEditorCode] = useState("");
  const debounceTimeout = useRef<number | null>(null);
  
  // Load initial state from localStorage
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('zecoder_projects');
      const projectsFromStorage: Record<string, Project> = savedProjects ? JSON.parse(savedProjects) : {};
      
      const savedHistory = localStorage.getItem('zecoder_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      if (Object.keys(projectsFromStorage).length > 0) {
        setProjects(projectsFromStorage);
        const savedActiveId = localStorage.getItem('zecoder_activeProjectId');
        if (savedActiveId && projectsFromStorage[savedActiveId]) {
          setActiveProjectId(savedActiveId);
        } else {
          setActiveProjectId(Object.keys(projectsFromStorage)[0]);
        }
      } else {
        // Use timeout to prevent race condition on initial state setting
        setTimeout(handleNewProject, 0);
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
      setTimeout(handleNewProject, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state back to localStorage
  useEffect(() => {
    if (Object.keys(projects).length > 0) {
      localStorage.setItem('zecoder_projects', JSON.stringify(projects));
    } else {
      localStorage.removeItem('zecoder_projects');
    }
  }, [projects]);
  
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('zecoder_activeProjectId', activeProjectId);
    }
  }, [activeProjectId]);
  
  useEffect(() => {
    localStorage.setItem('zecoder_history', JSON.stringify(history));
  }, [history]);

  // Sync editor code with active project
  useEffect(() => {
    if (activeProject) {
        setEditorCode(activeProject.generatedCode);
    }
  }, [activeProject]);

  // Debounced auto-save for editor changes
  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => {
        if (!prev[id]) return prev;
        return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = window.setTimeout(() => {
        if (activeProject && editorCode !== activeProject.generatedCode) {
            updateProject(activeProject.id, { generatedCode: editorCode });
        }
    }, 500); // Auto-save after 500ms of inactivity

    return () => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
    };
  }, [editorCode, activeProject, updateProject]);

  // Live Preview BroadcastChannel Logic
  useEffect(() => {
    if (!previewChannel.current) {
        previewChannel.current = new BroadcastChannel('zecoder_preview_channel');
    }

    const channel = previewChannel.current;
    channel.postMessage(editorCode);

    const messageHandler = (event: MessageEvent) => {
        if (event.data === 'ready') {
            channel.postMessage(editorCode);
        }
    };
    
    channel.addEventListener('message', messageHandler);
    
    return () => {
        channel.removeEventListener('message', messageHandler);
    };
  }, [editorCode]);

  const handleNewProject = useCallback(() => {
    const newId = `proj_${Date.now()}`;
    const projectNumber = Object.keys(projects).length + 1;
    const newProject: Project = {
      id: newId,
      name: `Project ${projectNumber}`,
      chatHistory: [{
        id: `msg_${Date.now()}_sys`,
        role: 'system',
        text: "Hello! I'm ZECREV CODER. What kind of website would you like to build today?"
      }],
      generatedCode: '',
      createdAt: Date.now(),
    };
    setChatInput("");
    setProjects(prev => ({...prev, [newId]: newProject}));
    setActiveProjectId(newId);
  }, [projects]);

  const handleCloseProject = (id: string) => {
    const projectIndex = sortedProjects.findIndex(p => p.id === id);
    const newProjects = { ...projects };
    delete newProjects[id];
    setProjects(newProjects);

    if (activeProjectId === id) {
      const remainingProjects = Object.values(newProjects).sort((a: Project, b: Project) => a.createdAt - b.createdAt);
      if (remainingProjects.length > 0) {
        const newActiveIndex = Math.max(0, projectIndex - 1);
        setActiveProjectId(remainingProjects[newActiveIndex].id);
      } else {
        setActiveProjectId(null);
        handleNewProject(); 
      }
    }
  };
  
  const addHistoryItem = useCallback((prompt: string, name: string) => {
      const newHistoryItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        name,
        prompt,
        timestamp: Date.now(),
      };
      setHistory(prev => [newHistoryItem, ...prev.filter(h => h.prompt !== prompt)].slice(0, 20));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!activeProject || !chatInput) return;
    
    const userMessage: ChatMessage = { id: `msg_${Date.now()}`, role: 'user', text: chatInput };
    const newChatHistory = [...activeProject.chatHistory, userMessage];
    updateProject(activeProject.id, { chatHistory: newChatHistory });
    
    const currentChatInput = chatInput;
    setChatInput("");
    setIsLoading(true);
    setError(null);

    try {
        let code;
        if(activeProject.generatedCode) {
            code = await refineWebsiteCode(activeProject.generatedCode, currentChatInput);
        } else {
            code = await generateWebsiteCode(currentChatInput);
            addHistoryItem(currentChatInput, activeProject.name);
        }
        setEditorCode(code); // Update live editor
        updateProject(activeProject.id, { generatedCode: code });
        const systemMessage: ChatMessage = { id: `msg_${Date.now()}_sys`, role: 'system', text: 'Website updated successfully.' };
        updateProject(activeProject.id, { chatHistory: [...newChatHistory, systemMessage] });

    // Fix: Correctly handle errors in the catch block by checking the type of the error before accessing properties.
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(message);
        const systemMessage: ChatMessage = { id: `msg_${Date.now()}_sys`, role: 'system', text: `Error: ${message}` };
        updateProject(activeProject.id, { chatHistory: [...newChatHistory, systemMessage] });
    } finally {
        setIsLoading(false);
    }
  }, [activeProject, chatInput, updateProject, addHistoryItem]);
  
  const handleRegenerate = useCallback(async () => {
    if (!activeProject) return;
    const firstUserMessage = activeProject.chatHistory.find(m => m.role === 'user');
    if (!firstUserMessage) {
        setError("No initial prompt to regenerate from.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    const newChatHistory = [...activeProject.chatHistory, { id: `msg_${Date.now()}_sys`, role: 'system', text: `Regenerating from: "${firstUserMessage.text.substring(0, 40)}..."` }];
    updateProject(activeProject.id, { chatHistory: newChatHistory });

    try {
        const code = await generateWebsiteCode(firstUserMessage.text);
        setEditorCode(code);
        updateProject(activeProject.id, { generatedCode: code });
    } catch(err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(message);
    } finally {
        setIsLoading(false);
    }
  }, [activeProject, updateProject]);

  const handleDeploy = () => {
    window.open('https://app.netlify.com/drop', '_blank');
  };
  
  const handleLoadHistory = useCallback((prompt: string, name: string) => {
    handleNewProject();
    // This needs to be in a timeout to ensure the new project state is set before updating it
    setTimeout(() => {
        setChatInput(prompt);
    }, 0);
  }, [handleNewProject]);

  const handleOpenPreviewInNewTab = () => {
    const previewWindow = window.open('about:blank', '_blank');
    if (previewWindow) {
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head><title>ZECREV CODER Preview</title></head>
                <body style="margin:0; background-color:#f0f2f5;">
                    <div id="preview-root" style="width: 100%; height: 100vh;"></div>
                    <script>
                        const channel = new BroadcastChannel('zecoder_preview_channel');
                        const root = document.getElementById('preview-root');
                        
                        const renderIframe = (html) => {
                           const iframe = document.createElement('iframe');
                           iframe.style.width = '100%';
                           iframe.style.height = '100%';
                           iframe.style.border = 'none';
                           iframe.srcdoc = html;
                           iframe.sandbox = 'allow-scripts allow-same-origin';
                           root.innerHTML = '';
                           root.appendChild(iframe);
                        }

                        channel.onmessage = (event) => {
                           renderIframe(event.data);
                        };
                        channel.postMessage('ready');
                    <\/script>
                </body>
            </html>
        `);
        previewWindow.document.close();
    }
  };

  const handleProjectNameChange = (newName: string) => {
    if (activeProject) {
        updateProject(activeProject.id, { name: newName });
    }
  };

  if (!activeProject) {
    return (
        <div className="h-screen flex items-center justify-center">
             <button onClick={handleNewProject} className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-xl">
                <NewProjectIcon className="w-8 h-8" /> Start New Project
            </button>
        </div>
    );
  }

  return (
    <div className="h-screen flex font-sans">
      <Sidebar history={history} onNewProject={handleNewProject} onLoadHistory={handleLoadHistory} isSidebarOpen={isSidebarOpen}/>
      <main className="flex-1 flex flex-col relative">
         <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="absolute top-3 left-3 z-20 p-2 bg-white/50 backdrop-blur-sm rounded-full text-slate-600 hover:bg-white hover:text-blue-600 transition-all shadow"
            title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
            >
            <MenuIcon className="w-5 h-5" />
         </button>
        <div className={`flex-shrink-0 bg-white/30 backdrop-blur-sm border-b border-slate-200/50 transition-all duration-300 ${isSidebarOpen ? 'pl-16' : 'pl-16'}`}>
            <div className="flex items-center px-2 overflow-x-auto">
                {sortedProjects.map(p => (
                    <div key={p.id} 
                         onClick={() => setActiveProjectId(p.id)}
                         className={`flex items-center gap-2 py-3 px-4 cursor-pointer border-b-2 transition-colors duration-200 flex-shrink-0 ${activeProjectId === p.id ? 'border-blue-500 text-blue-600 font-semibold bg-white/50' : 'border-transparent hover:bg-white/30 text-slate-500'}`}>
                        <span className="truncate max-w-xs">{p.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleCloseProject(p.id);}} className="p-1 rounded-full hover:bg-slate-300/50">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button onClick={handleNewProject} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white/30 rounded-t-lg">
                    <NewProjectIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        <div className="flex-grow flex overflow-hidden p-2">
          <EditorPanel 
            project={activeProject}
            editorCode={editorCode}
            onEditorCodeChange={setEditorCode}
            onProjectNameChange={handleProjectNameChange}
            onSendMessage={handleSendMessage}
            onDownload={() => downloadCodeAsZip(activeProject.name, editorCode)}
            onRegenerate={handleRegenerate}
            onDeploy={handleDeploy}
            isLoading={isLoading}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            speechError={error}
          />
          <PreviewPanel htmlContent={editorCode} onOpenInNewTab={handleOpenPreviewInNewTab} />
        </div>
      </main>
    </div>
  );
};

export default App;