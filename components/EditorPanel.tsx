import React, { useEffect, useRef } from 'react';
import { Project } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ChatBubble, ChatLoadingIndicator } from './Chat';
import CodeEditor from './CodeEditor';
import { DownloadIcon, MicIcon, SendIcon, RegenerateIcon, DeployIcon, PencilSquareIcon } from './icons';

interface EditorPanelProps {
  project: Project;
  editorCode: string;
  onEditorCodeChange: (code: string) => void;
  onProjectNameChange: (name: string) => void;
  onSendMessage: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  onDeploy: () => void;
  isLoading: boolean;
  chatInput: string;
  onChatInputChange: (prompt: string) => void;
  speechError: string | null;
}

const EditorPanelComponent: React.FC<EditorPanelProps> = ({ 
    project, 
    editorCode, 
    onEditorCodeChange, 
    onProjectNameChange,
    onSendMessage, 
    onDownload, 
    onRegenerate,
    onDeploy,
    isLoading, 
    chatInput, 
    onChatInputChange,
    speechError
}) => {
  const { isListening, error: recognitionError, startListening, stopListening, isSupported } = useSpeechRecognition(onChatInputChange);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const projectNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [project.chatHistory, isLoading]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [chatInput]);

  return (
    <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-xl rounded-2xl m-2 overflow-hidden border border-slate-200/50 shadow-xl">
      {/* Project Name */}
      <div className="p-3 border-b border-slate-200/50 flex items-center gap-2 group">
        <PencilSquareIcon className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        <input
            ref={projectNameInputRef}
            type="text"
            value={project.name}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="w-full bg-transparent text-lg font-semibold text-slate-800 focus:outline-none placeholder:text-slate-400"
            placeholder="Enter Project Name"
        />
      </div>

      {/* Chat Area */}
      <div className="p-4 flex flex-col min-h-[200px] max-h-[40vh] border-b border-slate-200/50">
          <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2">
            {project.chatHistory.map(msg => <ChatBubble key={msg.id} message={msg} />)}
            {isLoading && <ChatLoadingIndicator />}
          </div>
          <div className="mt-4 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Tell the AI what to build or change..."
              className="w-full max-h-40 p-3 bg-white/80 text-slate-800 rounded-lg border-2 border-slate-200/80 focus:border-blue-500 focus:outline-none resize-none transition-colors"
              rows={1}
            />
            {isSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-lg transition-colors duration-200 flex-shrink-0 ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200/70 hover:bg-slate-300/80 text-slate-700'}`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                <MicIcon className="w-5 h-5" />
              </button>
            )}
            <button onClick={onSendMessage} disabled={isLoading || !chatInput} className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0" aria-label="Send message">
              <SendIcon />
            </button>
          </div>
          {recognitionError && <p className="text-red-500 text-sm mt-1">{recognitionError}</p>}
          {speechError && <p className="text-red-500 text-sm mt-1">{speechError}</p>}
      </div>

      {/* Code Editor */}
      <div className="flex-grow flex flex-col relative">
        <div className="absolute top-2 right-4 z-10 flex items-center gap-2">
           <button onClick={onRegenerate} disabled={isLoading || !project.chatHistory.some(m => m.role === 'user')} className="flex items-center gap-2 bg-slate-700/80 backdrop-blur-sm hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow" title="Regenerate from first prompt">
             <RegenerateIcon className="w-5 h-5"/>
           </button>
           <button onClick={onDownload} disabled={!editorCode} className="flex items-center gap-2 bg-slate-700/80 backdrop-blur-sm hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow" title="Download Code">
             <DownloadIcon className="w-5 h-5"/>
           </button>
           <button onClick={onDeploy} disabled={!editorCode} className="flex items-center gap-2 bg-slate-700/80 backdrop-blur-sm hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow" title="Deploy to Netlify">
             <DeployIcon className="w-5 h-5"/>
           </button>
        </div>
        <CodeEditor value={editorCode} onChange={onEditorCodeChange} />
      </div>
    </div>
  );
};

export const EditorPanel = React.memo(EditorPanelComponent);