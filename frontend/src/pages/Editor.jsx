import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePreset from 'grapesjs-preset-webpage';
import { ThemeContext } from '../context/ThemeContext';
import { Save, Download, ArrowLeft, Loader2, Monitor, Sun, Moon, Sparkles, Send } from 'lucide-react';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  // Floating AI Bar State
  const[aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/projects/${id}`);
        setProject(response.data);
      } catch (err) {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  useEffect(() => {
    if (!loading && project && !editorRef.current) {
      const editor = grapesjs.init({
        container: '#gjs',
        height: 'calc(100vh - 56px)',
        width: '100%',
        plugins: [webpagePreset],
        storageManager: false,
        allowScripts: 1, // <--- CRITICAL: Unlocks AI-generated JS execution inside the canvas!
        canvas: {
          styles:[
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
          ]
        },
        components: project.html_content || '',
        style: project.css_content || '',
      });

      editor.getConfig().dragMode = 'absolute';
      editorRef.current = editor;
    }
    return () => {
      if (editorRef.current) { editorRef.current.destroy(); editorRef.current = null; }
    };
  },[loading, project]);

  const handleSave = async () => {
    if (!editorRef.current) return;
    setIsSaving(true);
    try {
      await api.put(`/projects/${id}`, { 
        html_content: editorRef.current.getHtml(), 
        css_content: editorRef.current.getCss() 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!editorRef.current) return;
    const htmlCode = editorRef.current.getHtml(); // This now natively includes the AI's <script> tags!
    const cssCode = editorRef.current.getCss();
    
    const isDarkExport = cssCode.includes('background-color: #0') || cssCode.includes('background: #0') || cssCode.includes('background-color: #1');
    const bodyBg = isDarkExport ? '#020617' : '#ffffff';

    const fullSourceCode = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${project.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: ${bodyBg}; overflow-x: hidden; }
  ${cssCode}
</style>
</head>
<body>
  ${htmlCode}
</body>
</html>`;

    const blob = new Blob([fullSourceCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- FLOATING AI COPILOT LOGIC ---
  const handleAiEdit = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !editorRef.current) return;

    setIsAiProcessing(true);
    try {
      const currentHtml = editorRef.current.getHtml();
      const currentCss = editorRef.current.getCss();

      const response = await api.post('/ai/edit', {
        html: currentHtml,
        css: currentCss,
        prompt: aiPrompt
      });

      editorRef.current.setComponents(response.data.html);
      editorRef.current.setStyle(response.data.css);
      setAiPrompt('');
    } catch (err) {
      alert("AI failed to process the edit. Please try a clearer prompt.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-brand-600 dark:text-brand-400 font-bold uppercase animate-pulse">
      <Monitor className="h-10 w-10 mb-4" /> Booting Workspace...
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden animate-fade-in transition-colors duration-300 bg-white dark:bg-slate-950 relative">
      
      {/* Editor Topbar */}
      <div className="h-14 flex items-center justify-between px-4 sm:px-6 shadow-sm border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700 hover:-translate-x-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-5 w-px hidden sm:block bg-slate-300 dark:bg-slate-700"></div>
          <span className="font-bold text-sm truncate max-w-[250px] text-slate-900 dark:text-slate-200">{project?.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-1.5 border rounded-md transition-colors text-slate-500 border-slate-200 hover:bg-slate-100 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold border rounded-md transition-colors text-slate-700 bg-white hover:bg-slate-50 border-slate-300 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700">
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export Code</span>
          </button>
          
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-md shadow-lg shadow-brand-500/30 transition-all active:scale-95 disabled:opacity-70">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Saving...' : 'Save Data'}
          </button>
        </div>
      </div>

      {/* GrapesJS Canvas Container */}
      <div id="gjs" className="flex-grow w-full border-none m-0 p-0 transition-colors duration-300"></div>

      {/* FLOATING AI COPILOT BAR */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl z-50">
        <form 
          onSubmit={handleAiEdit} 
          className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 p-2 rounded-2xl shadow-2xl shadow-brand-500/10 transition-all duration-300 hover:shadow-brand-500/20"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-white flex-shrink-0 ml-1">
            {isAiProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isAiProcessing}
            placeholder={isAiProcessing ? "AI is rewriting your canvas..." : "Ask AI to change colors, add a theme toggle button, rewrite text..."}
            className="flex-grow bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium px-2"
          />
          <button
            type="submit"
            disabled={isAiProcessing || !aiPrompt.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors flex-shrink-0 mr-1"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default Editor;