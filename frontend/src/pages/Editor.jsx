import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePreset from 'grapesjs-preset-webpage';
import { ThemeContext } from '../context/ThemeContext';
import { Save, Download, ArrowLeft, Loader2, Monitor, Sun, Moon, Sparkles, Send, Check, Tablet, Smartphone } from 'lucide-react';

const aiLoadingMessages = [
  "Analyzing canvas context...",
  "Engineering updates...",
  "Injecting smart elements...",
  "Polishing the layout..."
];

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const sanitizeHtml = (htmlString) => {
  if (!htmlString) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  const forbiddenRegex = /\b(parent|localStorage|sessionStorage)\b|document\.cookie\b/i;
  
  // 1. Strip any <script> tags containing forbidden keywords
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(script => {
    if (forbiddenRegex.test(script.textContent) || (script.src && forbiddenRegex.test(script.src))) {
      script.remove();
    }
  });

  // 2. Strip event handlers or javascript: URIs containing forbidden keywords from all elements
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const attrs = Array.from(el.attributes);
    attrs.forEach(attr => {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();
      
      const isEventHandler = name.startsWith('on');
      const isJavascriptUri = val.startsWith('javascript:');
      
      if ((isEventHandler || isJavascriptUri) && forbiddenRegex.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
};

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const aiInputRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('desktop');
  const { isDark, toggleTheme } = useContext(ThemeContext);

  // Floating AI Bar State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState(0);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus AI bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        aiInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cycle loading messages
  useEffect(() => {
    let interval;
    if (isAiProcessing) {
      interval = setInterval(() => {
        setAiLoadingStep((prev) => (prev + 1) % aiLoadingMessages.length);
      }, 2000);
    } else {
      setAiLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isAiProcessing]);

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
        height: '100vh',
        width: '100%',
        plugins: [webpagePreset],
        storageManager: false,
        allowScripts: 1, // <--- CRITICAL: Unlocks AI-generated JS execution inside the canvas!
        deviceManager: {
          devices: [
            { id: 'desktop', name: 'Desktop', width: '' },
            { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
            { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
          ]
        },
        canvas: {
          styles:[
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
          ]
        },
        // Fallback to HTML/CSS if no JSON project data exists (for older projects)
        components: !project.project_data ? (project.html_content || '') : '',
        style: !project.project_data ? (project.css_content || '') : '',
      });

      // Load lossless GrapesJS JSON project data if it exists
      if (project.project_data) {
        editor.loadProjectData(project.project_data);
      }
      
      // Make all new elements freely draggable and resizable (Canva-style)
      editor.on('component:add', (component) => {
        component.set({ draggable: true, hoverable: true, selectable: true, resizable: true });
      });

      // Recursively enable resizability and draggability for all nested components loaded from initial HTML
      const makeAllComponentsDraggable = (comp) => {
        if (!comp) return;
        // Do not make the wrapper itself draggable
        if (comp !== editor.getWrapper()) {
          comp.set({ draggable: true, hoverable: true, selectable: true, resizable: true });
        }
        comp.components().forEach((child) => makeAllComponentsDraggable(child));
      };

      const wrapper = editor.getWrapper();
      if (wrapper) {
        makeAllComponentsDraggable(wrapper);
      }

      editorRef.current = editor;
    }
    return () => {
      if (editorRef.current) { editorRef.current.destroy(); editorRef.current = null; }
    };
  },[loading, project]);

  // Sync theme (dark/light) inside GrapesJS canvas
  useEffect(() => {
    if (editorRef.current) {
      const wrapper = editorRef.current.getWrapper();
      if (wrapper) {
        if (isDark) {
          wrapper.addClass('dark');
        } else {
          wrapper.removeClass('dark');
        }
        // Also propagate to all top-level components (like #website-root)
        wrapper.components().forEach((comp) => {
          if (isDark) {
            comp.addClass('dark');
          } else {
            comp.removeClass('dark');
          }
        });
      }
    }
  }, [isDark, loading]);

  const convertPxToRem = (text) => {
    if (!text) return '';
    return text.replace(/(\d*\.?\d+)px\b/g, (match, val) => {
      const px = parseFloat(val);
      if (px <= 2) return match; // Keep small borders intact
      return `${(px / 16).toFixed(4)}rem`;
    });
  };

  const handleDeviceChange = (device) => {
    setSelectedDevice(device);
    if (!editorRef.current) return;
    const deviceManager = editorRef.current.Devices;
    if (deviceManager) {
      deviceManager.select(device);
    }
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    setIsSaving(true);
    try {
      const rawHtml = editorRef.current.getHtml();
      const rawCss = editorRef.current.getCss();
      const cleanHtml = convertPxToRem(rawHtml);
      const cleanCss = convertPxToRem(rawCss);
      const projectData = editorRef.current.getProjectData();

      await api.put(`/projects/${id}`, { 
        title: project?.title,
        project_data: projectData,
        html_content: cleanHtml, 
        css_content: cleanCss 
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Save Project Error:', err);
      alert('Failed to save project. Please check your network connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!editorRef.current) return;
    // Strip extraneous top-level tags if the AI accidentally added them
    let htmlCode = editorRef.current.getHtml();
    htmlCode = htmlCode.replace(/<\/?(html|head|body|title)[^>]*>/gi, '');
    const cssCode = editorRef.current.getCss();
    
    // 1. Convert px to rem for absolute positions and sizing
    const cleanHtml = convertPxToRem(htmlCode);
    
    // 2. Map #wrapper styles to body so they are not lost on export, and convert px to rem
    const cleanCss = convertPxToRem(cssCode).replace(/#wrapper/g, 'body');
    const safeCleanCss = cleanCss.replace(/<\/style/gi, '<\\/style');

    const htmlClassAttr = isDark ? ' class="dark"' : '';
    const fullSourceCode = `<!DOCTYPE html>
<html lang="en"${htmlClassAttr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(project?.title || 'My Project')}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
  ${safeCleanCss}
</style>
</head>
<body>
  ${cleanHtml}
</body>
</html>`;

    const blob = new Blob([fullSourceCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project?.title || 'project').replace(/\s+/g, '_').toLowerCase()}.html`;
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

      const sanitizedHtml = sanitizeHtml(response.data.html);
      editorRef.current.setComponents(sanitizedHtml);
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
    <div className="h-screen w-full flex flex-col overflow-hidden animate-fade-in bg-[var(--editor-bg)] text-[var(--editor-text)] relative">
      
      {/* Floating Toolbar (Figma Style) */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-between px-3 sm:px-4 py-2 bg-white/95 dark:bg-[#2C2C2C]/90 backdrop-blur-xl border border-slate-200 dark:border-[#444444] rounded-2xl shadow-2xl z-50 w-[95vw] max-w-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            aria-label="Back to Dashboard"
            className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-[#8A8A8A] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#444444]/50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-[#444444]"></div>
          <input 
            type="text" 
            value={project?.title || ''} 
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            className="font-medium text-xs truncate max-w-[120px] sm:max-w-[180px] text-slate-800 dark:text-[#E0E0E0] bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-500 rounded px-1.5 py-0.5 transition-all"
            placeholder="Project Title"
            title="Edit Project Title"
            aria-label="Edit Project Title"
          />
        </div>

        {/* Responsive Device Viewports */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1E1E1E] p-0.5 rounded-lg border border-slate-200/80 dark:border-[#333333]">
          <button
            type="button"
            onClick={() => handleDeviceChange('desktop')}
            className={`p-1.5 rounded-md text-xs transition-colors ${selectedDevice === 'desktop' ? 'bg-white dark:bg-[#333333] text-brand-600 dark:text-white shadow-sm font-medium' : 'text-slate-400 dark:text-[#8A8A8A] hover:text-slate-700 dark:hover:text-white'}`}
            title="Desktop Canvas"
            aria-label="Desktop Canvas"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeviceChange('tablet')}
            className={`p-1.5 rounded-md text-xs transition-colors ${selectedDevice === 'tablet' ? 'bg-white dark:bg-[#333333] text-brand-600 dark:text-white shadow-sm font-medium' : 'text-slate-400 dark:text-[#8A8A8A] hover:text-slate-700 dark:hover:text-white'}`}
            title="Tablet Canvas (768px)"
            aria-label="Tablet Canvas"
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeviceChange('mobile')}
            className={`p-1.5 rounded-md text-xs transition-colors ${selectedDevice === 'mobile' ? 'bg-white dark:bg-[#333333] text-brand-600 dark:text-white shadow-sm font-medium' : 'text-slate-400 dark:text-[#8A8A8A] hover:text-slate-700 dark:hover:text-white'}`}
            title="Mobile Canvas (375px)"
            aria-label="Mobile Canvas"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
            className="p-1.5 rounded-lg text-slate-500 dark:text-[#8A8A8A] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#444444]/50 transition-colors"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          
          <button 
            onClick={handleExport} 
            aria-label="Export HTML/CSS"
            className="p-1.5 rounded-lg text-slate-500 dark:text-[#8A8A8A] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#444444]/50 transition-colors" 
            title="Export HTML/CSS"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            aria-label="Save Project"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-70 ml-1 ${
              saveSuccess ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-brand-600 hover:bg-brand-500'
            }`}
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveSuccess ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Saving' : saveSuccess ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* GrapesJS Canvas Container */}
      <div id="gjs" className="flex-grow w-full border-none m-0 p-0 transition-colors duration-300"></div>

      {/* FLOATING AI COPILOT COMMAND PALETTE */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[92%] max-w-xl z-50 animate-fade-in-up">
        <form 
          onSubmit={handleAiEdit} 
          className={`flex items-center gap-2 bg-white/95 dark:bg-[#2C2C2C]/90 backdrop-blur-xl border p-1.5 rounded-2xl shadow-2xl transition-all duration-300 ${
            isAiProcessing 
              ? 'border-brand-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse' 
              : 'border-slate-200 dark:border-[#444444] hover:border-brand-500/50'
          }`}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-fuchsia-500 text-white flex-shrink-0 ml-1 shadow-sm">
            {isAiProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </div>
          <input
            ref={aiInputRef}
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isAiProcessing}
            placeholder={isAiProcessing ? aiLoadingMessages[aiLoadingStep] : "Cmd+K to ask AI to redesign elements..."}
            className="flex-grow bg-transparent border-none outline-none text-slate-800 dark:text-[#E0E0E0] placeholder-slate-400 dark:placeholder-[#8A8A8A] text-sm font-medium px-2"
          />
          <button
            type="submit"
            disabled={isAiProcessing || !aiPrompt.trim()}
            aria-label="Send AI Prompt"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1E1E1E] text-brand-600 dark:text-brand-400 hover:bg-slate-200 dark:hover:bg-[#444444] disabled:opacity-40 transition-colors flex-shrink-0 mr-1"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default Editor;