import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Edit2, Trash2, LayoutGrid, Calendar, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (err) {} finally { setLoading(false); }
    };
    fetchProjects();
  },[]);

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project forever?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {}
  };

  const startEditing = (project) => {
    setEditingTitleId(project.id);
    setEditingTitleValue(project.title);
  };

  const saveTitle = async (id) => {
    if (editingTitleId !== id) return;
    try {
      await api.put(`/projects/${id}`, { title: editingTitleValue });
      setProjects(projects.map(p => p.id === id ? { ...p, title: editingTitleValue } : p));
    } catch (err) {
      alert("Failed to update title");
    } finally {
      setEditingTitleId(null);
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      saveTitle(id);
    } else if (e.key === 'Escape') {
      setEditingTitleId(null);
    }
  };

  if (loading) return <div className="min-h-screen pt-32 flex justify-center text-lg text-brand-600 dark:text-brand-400 font-medium">Loading Workspace...</div>;

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-10 gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Projects</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-lg">Your AI-generated digital real estate.</p>
          </div>
          <Link to="/editor/new" className="group flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-1 transition-all">
            <Plus className="h-5 w-5" /> New Project
          </Link>
        </div>

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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <div key={project.id} className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-md dark:shadow-none hover:-translate-y-2 transition-all flex flex-col animate-fade-in-up" style={{ animationDelay: `${(idx % 4) * 100}ms` }}>
                <div className="flex-grow mb-6">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <LayoutGrid className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  {editingTitleId === project.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onBlur={() => saveTitle(project.id)}
                      onKeyDown={(e) => handleKeyDown(e, project.id)}
                      className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate w-full bg-transparent border-b-2 border-brand-500 outline-none"
                    />
                  ) : (
                    <h3 
                      onClick={() => startEditing(project)}
                      className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate cursor-pointer hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                      title="Click to rename"
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
                  <button onClick={() => navigate(`/editor/${project.id}`)} className="flex items-center gap-2 text-gray-900 dark:text-white font-bold hover:text-brand-600 dark:hover:text-brand-400 transition-colors bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-lg">
                    <Edit2 className="h-4 w-4" /> Open Editor
                  </button>
                  <button onClick={() => deleteProject(project.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="h-5 w-5" />
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