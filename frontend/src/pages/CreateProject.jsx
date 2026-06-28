import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Sparkles, Bot, ArrowRight, ChevronDown, Check } from 'lucide-react';

// Configuration Schema for Dynamic Context Fields
const archetypeSchemas = {
  'Personal Portfolio': {
    'Website': [
      { id: 'projectTitle', label: 'Project Title', type: 'input', placeholder: 'e.g., Jane Doe Portfolio' },
      { id: 'professionalRole', label: 'Professional Role', type: 'input', placeholder: 'e.g., Senior Full-Stack Developer' },
      { id: 'keyAchievements', label: 'Key Achievements & Bio', type: 'textarea', placeholder: 'e.g., 10+ years experience, built scalable microservices, passionate about UI/UX.' }
    ],
    'Resume (PDF)': [
      { id: 'candidateName', label: 'Candidate Name', type: 'input', placeholder: 'e.g., John Smith' },
      { id: 'targetJobTitle', label: 'Target Job Title', type: 'input', placeholder: 'e.g., Senior Software Engineer' },
      { id: 'professionalSummary', label: 'Professional Summary', type: 'textarea', placeholder: 'e.g., Highly motivated engineer with 5 years of experience...' },
      { id: 'workExperience', label: 'Work Experience', type: 'textarea', placeholder: 'e.g., 2020-2023: Lead Developer at X Corp. 2018-2020: Developer at Y Inc.' },
      { id: 'education', label: 'Education', type: 'input', placeholder: 'e.g., B.S. in Computer Science, University of Z' },
      { id: 'keySkills', label: 'Key Skills', type: 'textarea', placeholder: 'e.g., React, Node.js, Python, AWS' }
    ],
    'Student Portfolio (PDF)': [
      { id: 'studentName', label: 'Student Name', type: 'input', placeholder: 'e.g., Emily Chen' },
      { id: 'targetDegreeRole', label: 'Target Degree / Role', type: 'input', placeholder: 'e.g., B.S. Architecture / Design Intern' },
      { id: 'academicObjective', label: 'Academic Objective', type: 'textarea', placeholder: 'e.g., To leverage my design skills in a fast-paced agency...' },
      { id: 'extracurriculars', label: 'Extracurriculars & Achievements', type: 'textarea', placeholder: "e.g., Debate Club Captain, Dean's List 2023" },
      { id: 'coursework', label: 'Relevant Coursework', type: 'textarea', placeholder: 'e.g., Advanced Typography, 3D Modeling, UI/UX Principles' }
    ]
  },
  'Startup Landing Page':[
    { id: 'startupName', label: 'Startup Name', type: 'input', placeholder: 'e.g., TechNova Solutions' },
    { id: 'valueProposition', label: 'Value Proposition', type: 'textarea', placeholder: 'e.g., We revolutionize AI-driven analytics for enterprise supply chains.' },
    { id: 'targetPersona', label: 'Target Persona', type: 'input', placeholder: 'e.g., Enterprise B2B SaaS companies' },
    { id: 'primaryCTA', label: 'Primary CTA Text', type: 'input', placeholder: 'e.g., Request a Demo' }
  ],
  'Agency Website':[
    { id: 'agencyName', label: 'Agency Name', type: 'input', placeholder: 'e.g., CreativePulse Agency' },
    { id: 'coreServices', label: 'Core Services', type: 'textarea', placeholder: 'e.g., Branding, Web Design, SEO, Performance Marketing.' },
    { id: 'idealClient', label: 'Ideal Client Profile', type: 'input', placeholder: 'e.g., D2C E-commerce brands' },
    { id: 'brandPersonality', label: 'Brand Personality', type: 'textarea', placeholder: 'e.g., Bold, professional, innovative, and results-driven.' }
  ],
  'Product Showcase':[
    { id: 'productName', label: 'Product Name', type: 'input', placeholder: 'e.g., Lumina Smart Desk' },
    { id: 'keyFeatures', label: 'Key Features', type: 'textarea', placeholder: 'e.g., Motorized height adjustment, built-in wireless charging, cable management.' },
    { id: 'targetUseCases', label: 'Target Use Cases', type: 'textarea', placeholder: 'e.g., Remote work from home, executive offices, creative studios.' }
  ]
};

const loadingMessages = [
  "Analyzing aesthetics...",
  "Structuring DOM...",
  "Writing custom CSS...",
  "Injecting JavaScript...",
  "Polishing the layout..."
];

const CreateProject = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Core State
  const [useCase, setUseCase] = useState('Personal Portfolio');
  const [portfolioFormat, setPortfolioFormat] = useState('Website');
  const [aesthetics, setAesthetics] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [dynamicData, setDynamicData] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Cycle loading messages
  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Initialize dynamic data state when useCase or portfolioFormat changes
  useEffect(() => {
    const defaultData = {};
    const schema = useCase === 'Personal Portfolio' ? archetypeSchemas[useCase][portfolioFormat] : archetypeSchemas[useCase];
    schema.forEach(field => {
      defaultData[field.id] = '';
    });
    setDynamicData(defaultData);
  }, [useCase, portfolioFormat]);

  // Handle outside click for custom dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  },[]);

  const handleDynamicChange = (id, value) => {
    setDynamicData(prev => ({ ...prev, [id]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Use the first dynamic field as the database Title
    const schema = useCase === 'Personal Portfolio' ? archetypeSchemas[useCase][portfolioFormat] : archetypeSchemas[useCase];
    const dbTitleKey = schema[0].id;
    const dbTitle = dynamicData[dbTitleKey] || `${useCase} Project`;

    try {
      // 1. Send specific Context to the AI Engine
      const aiResponse = await api.post('/ai/generate', { useCase, portfolioFormat, aesthetics, dynamicData, customInstructions });
      
      // 2. Save the AI generated layout to the DB
      const projectResponse = await api.post('/projects', { 
        title: dbTitle, 
        html_content: aiResponse.data.html, 
        css_content: aiResponse.data.css 
      });
      
      // 3. Load natively in GrapesJS Editor
      navigate(`/editor/${projectResponse.data.projectId}`);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`Generation failed. Details: ${errorMsg}`);
      setIsGenerating(false);
    }
  };

  const activeSchema = useCase === 'Personal Portfolio' ? archetypeSchemas[useCase][portfolioFormat] : archetypeSchemas[useCase];

  return (
    <>
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-all duration-500">
          <div className="relative flex items-center justify-center w-40 h-40 mb-10">
            <div className="absolute inset-0 border-4 border-t-brand-500 border-r-brand-400 border-b-fuchsia-500 border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-4 border-b-brand-300 border-l-brand-600 border-t-transparent border-r-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
            <div className="absolute inset-8 bg-brand-500/20 rounded-full animate-pulse blur-xl"></div>
            <Bot className="h-14 w-14 text-brand-500 animate-pulse relative z-10" />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 animate-pulse tracking-tight text-center px-4">
            {loadingMessages[loadingStep]}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xl max-w-lg text-center leading-relaxed px-4">
            Our AI is engineering a bespoke <span className="text-brand-500 font-semibold">{useCase}</span> structure. This takes a few moments of deep, creative thought...
          </p>
        </div>
      )}

      <div className={`min-h-screen pt-28 pb-12 px-4 flex justify-center transition-opacity duration-500 ${isGenerating ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="w-full max-w-3xl animate-fade-in-up">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-white mb-6 shadow-lg">
              <Bot className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">AI Engine Direct Link</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400">Select an archetype to load its dynamic context engine.</p>
          </div>

          {/* Form Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-none border border-gray-100 dark:border-slate-800 p-8 sm:p-10 transition-colors duration-300">
            <form onSubmit={handleGenerate} className="space-y-6">
              
              {/* Custom Archetype Dropdown */}
              <div className="relative z-20" ref={dropdownRef}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Structure Archetype</label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none flex justify-between items-center transition-colors font-medium"
                >
                  {useCase}
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 animate-fade-in text-gray-900 dark:text-white font-medium">
                    {Object.keys(archetypeSchemas).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setUseCase(type); setIsDropdownOpen(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-brand-50 dark:hover:bg-slate-700/50 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex justify-between items-center"
                      >
                        {type}
                        {useCase === type && <Check className="h-4 w-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-category for Personal Portfolio */}
              {useCase === 'Personal Portfolio' && (
                <div className="relative z-10 flex gap-2 p-1 bg-gray-100 dark:bg-slate-800/50 rounded-xl mt-4 border border-gray-200 dark:border-slate-700">
                  {Object.keys(archetypeSchemas['Personal Portfolio']).map(format => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setPortfolioFormat(format)}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${portfolioFormat === format ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm border border-gray-200 dark:border-slate-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              )}

              <div className="h-px bg-gray-200 dark:bg-slate-800 my-8"></div>

              {/* Dynamic Context Fields based on Archetype */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {activeSchema.map((field) => (
                  <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>
                    {field.type === 'input' ? (
                      <input
                        type="text" required
                        value={dynamicData[field.id] || ''}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    ) : (
                      <textarea
                        required rows="3"
                        value={dynamicData[field.id] || ''}
                        onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Global Aesthetics Field */}
              <div className="relative z-10">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Aesthetic & Vibe Directives</label>
                <textarea
                  required rows="2"
                  value={aesthetics}
                  onChange={(e) => setAesthetics(e.target.value)}
                  placeholder="e.g., Cyberpunk dark mode, neon pink accents, terminal fonts, brutalist."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Optional Custom Instructions */}
              <div className="relative z-10">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Custom Instructions <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea
                  rows="2"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Make sure there is a section dedicated to my dog, use a specific color for buttons..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Submit Generator */}
              <button
                type="submit" disabled={isGenerating}
                className="w-full mt-4 flex justify-center items-center gap-3 py-4 rounded-xl text-white bg-gray-900 dark:bg-brand-600 hover:bg-brand-600 dark:hover:bg-brand-500 font-bold text-lg disabled:opacity-80 transition-all hover:-translate-y-1 relative z-10 shadow-xl shadow-brand-500/20"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-5 w-5 animate-pulse text-brand-300"/> 
                    <span className="animate-pulse">{loadingMessages[loadingStep]}</span>
                  </>
                ) : (
                  <>
                    Generate {useCase} <ArrowRight className="h-5 w-5"/>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateProject;