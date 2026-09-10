import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, LayoutGrid, Calendar, ArrowRight, Search, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally { 
        setLoading(false); 
      }
    };
    fetchProjects();
  }, []);

  const deleteProject = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project forever?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete project error:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const startEditing = (project, e) => {
    if (e) e.stopPropagation();
    setEditingTitleId(project.id);
    setEditingTitleValue(project.title);
  };

  const saveTitle = async (id, e) => {
    if (e) e.stopPropagation();
    if (editingTitleId !== id) return;
    if (!editingTitleValue.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      await api.put(`/projects/${id}`, { title: editingTitleValue.trim() });
      setProjects(projects.map(p => p.id === id ? { ...p, title: editingTitleValue.trim() } : p));
    } catch (err) {
      console.error('Update title error:', err);
      alert('Failed to update title. Please try again.');
    } finally {
      setEditingTitleId(null);
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      saveTitle(id, e);
    } else if (e.key === 'Escape') {
      setEditingTitleId(null);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen pt-32 flex justify-center text-lg text-brand-600 dark:text-brand-400 font-medium">
      Loading Workspace...
    </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Projects</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-lg">Your AI-generated digital real estate.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/editor/new" 
              className="group flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-5 w-5" /> New Project
            </Link>
          </div>
        </div>

        {/* Upgrade Banner for Free Tier Users */}
        {user?.plan !== 'Pro' && user?.plan !== 'Enterprise' && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900/10 via-fuchsia-900/10 to-brand-900/10 dark:from-purple-950/40 dark:via-fuchsia-950/40 dark:to-brand-950/40 border border-purple-200/50 dark:border-purple-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-fuchsia-600 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Unlock Pro Generation & Unlimited Exports</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Upgrade to Pro for high-throughput AI reasoning and instant custom domain exports.</p>
              </div>
            </div>
            <Link
              to="/upgrade"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-fuchsia-600 shadow hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}

        {/* Search Bar */}
        {projects.length > 0 && (
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-16 text-center animate-fade-in-up max-w-2xl mx-auto shadow-xl dark:shadow-none transition-colors duration-300">
            <div className="bg-brand-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
              <LayoutGrid className="h-10 w-10 text-brand-500 dark:text-brand-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your canvas is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">Use the power of AI to build your first stunning website.</p>
            <Link to="/editor/new" className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold group">
              Start Building <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            No projects found matching "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <div 
                key={project.id} 
                onClick={() => navigate(`/editor/${project.id}`)}
                className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-md dark:shadow-none hover:-translate-y-1.5 transition-all flex flex-col animate-fade-in-up" 
                style={{ animationDelay: `${(idx % 4) * 80}ms` }}
              >
                <div className="flex-grow mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center transition-colors">
                      <LayoutGrid className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                    </div>
                    <button
                      onClick={(e) => startEditing(project, e)}
                      aria-label="Rename Project"
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  {editingTitleId === project.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingTitleValue}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onBlur={(e) => saveTitle(project.id, e)}
                      onKeyDown={(e) => handleKeyDown(e, project.id)}
                      className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate w-full bg-transparent border-b-2 border-brand-500 outline-none"
                    />
                  ) : (
                    <h3 
                      className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
                    >
                      {project.title}
                    </h3>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2 font-medium">
                    <Calendar className="h-4 w-4 text-brand-400" />
                    {new Date(project.updated_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-slate-800 transition-colors">
                  <Link 
                    to={`/editor/${project.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-gray-900 dark:text-white font-bold hover:text-brand-600 dark:hover:text-brand-400 transition-colors bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm"
                  >
                    Open Editor <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button 
                    onClick={(e) => deleteProject(project.id, e)} 
                    aria-label="Delete Project"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;