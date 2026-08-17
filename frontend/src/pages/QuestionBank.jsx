import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FileQuestion, Plus, Sparkles, Search, X, Edit, Trash2, Check, Eye, HelpCircle } from 'lucide-react';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIGenModal, setShowAIGenModal] = useState(false);

  // Form states for manual create/edit
  const [formData, setFormData] = useState({
    title: '',
    questionText: '',
    type: 'Technical',
    difficulty: 'Mid-Level',
    competency: 'Problem Solving',
    expectedAnswerKeyPoints: '',
  });

  // AI Generator state
  const [aiRole, setAiRole] = useState('Full Stack Engineer');
  const [aiDept, setAiDept] = useState('Engineering');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/questions/bank');
      if (res.data.success) {
        setQuestions(res.data.questions);
      }
    } catch (err) {
      console.error('[Fetch Question Bank Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const openViewModal = (q) => {
    setSelectedQuestion(q);
    setIsEditing(false);
    setFormData({
      title: q.title || '',
      questionText: q.questionText || '',
      type: q.type || 'Technical',
      difficulty: q.difficulty || 'Mid-Level',
      competency: q.competency || 'Problem Solving',
      expectedAnswerKeyPoints: (q.expectedAnswerKeyPoints || []).join('\n'),
    });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        expectedAnswerKeyPoints: formData.expectedAnswerKeyPoints
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (isEditing && selectedQuestion) {
        const res = await api.put(`/questions/bank/${selectedQuestion._id}`, payload);
        if (res.data.success) {
          setQuestions((prev) => prev.map((item) => (item._id === selectedQuestion._id ? res.data.question : item)));
          setSelectedQuestion(res.data.question);
          setIsEditing(false);
        }
      } else {
        const res = await api.post('/questions/bank', payload);
        if (res.data.success) {
          setQuestions((prev) => [res.data.question, ...prev]);
          setShowCreateModal(false);
        }
      }
    } catch (err) {
      console.error('[Save Question Error]', err);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question blueprint?')) return;
    try {
      await api.delete(`/questions/bank/${id}`);
      setQuestions((prev) => prev.filter((item) => item._id !== id));
      setSelectedQuestion(null);
    } catch (err) {
      console.error('[Delete Question Error]', err);
    }
  };

  const handleGenerateAIBlueprints = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const res = await api.post('/questions/bank/generate-ai', { role: aiRole, department: aiDept });
      if (res.data.success) {
        setQuestions((prev) => [...res.data.questions, ...prev]);
        setShowAIGenModal(false);
      }
    } catch (err) {
      console.error('[AI Gen Error]', err);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      !search ||
      q.title?.toLowerCase().includes(search.toLowerCase()) ||
      q.questionText?.toLowerCase().includes(search.toLowerCase()) ||
      q.competency?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || q.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Question Blueprint Bank <FileQuestion className="w-5 h-5 text-indigo-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">Repository of AI-generated and custom interview question blueprints</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAIGenModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Generate with AI</span>
            </button>

            <button
              onClick={() => {
                setFormData({
                  title: '',
                  questionText: '',
                  type: 'Technical',
                  difficulty: 'Mid-Level',
                  competency: 'Problem Solving',
                  expectedAnswerKeyPoints: '',
                });
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Blueprint</span>
            </button>
          </div>
        </div>

        {/* Search & Type Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 glass-card p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search question blueprints by title, text, or competency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="">All Question Types</option>
            <option value="Technical">Technical</option>
            <option value="Scenario">Scenario</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Coding">Coding</option>
            <option value="HR">HR</option>
          </select>
        </div>

        {/* Question Cards Grid */}
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading Question Blueprints...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <FileQuestion className="w-10 h-10 text-slate-500 mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-slate-200">No Question Blueprints Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No questions match your current search filters. Create a new question or use AI generator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => (
              <div
                key={q._id}
                onClick={() => openViewModal(q)}
                className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2 hover:border-indigo-500/50 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                    {q.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{q.difficulty}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug">{q.title}</h3>
                <p className="text-[11px] text-slate-400">Target Competency: <span className="text-slate-300 font-semibold">{q.competency}</span></p>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Click to view full prompt & rubric →</span>
                  <Eye className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW / EDIT QUESTION MODAL */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-xl w-full bg-[#0D131F] rounded-3xl border border-slate-700/80 shadow-2xl p-6 relative text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedQuestion(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                {selectedQuestion.type}
              </span>
              <span className="text-xs font-mono text-slate-400">{selectedQuestion.difficulty}</span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Blueprint Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Scenario">Scenario</option>
                      <option value="Behavioral">Behavioral</option>
                      <option value="Coding">Coding</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Mid-Level">Mid-Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Competency</label>
                    <input
                      type="text"
                      value={formData.competency}
                      onChange={(e) => setFormData({ ...formData, competency: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Question Prompt</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.questionText}
                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Key Points (1 per line)</label>
                  <textarea
                    rows={3}
                    value={formData.expectedAnswerKeyPoints}
                    onChange={(e) => setFormData({ ...formData, expectedAnswerKeyPoints: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">{selectedQuestion.title}</h3>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-indigo-400 block uppercase">Question Prompt:</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{selectedQuestion.questionText}</p>
                </div>

                {selectedQuestion.expectedAnswerKeyPoints && selectedQuestion.expectedAnswerKeyPoints.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 block uppercase">AI Evaluation Key Points:</span>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-mono">
                      {selectedQuestion.expectedAnswerKeyPoints.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Blueprint
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(selectedQuestion._id)}
                    className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE QUESTION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-lg w-full bg-[#0D131F] rounded-3xl border border-slate-700/80 shadow-2xl p-6 relative text-slate-100">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Add New Question Blueprint</h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Blueprint Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React 19 Server Actions & Optimistic Mutations"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Scenario">Scenario</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Coding">Coding</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Competency</label>
                  <input
                    type="text"
                    value={formData.competency}
                    onChange={(e) => setFormData({ ...formData, competency: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Question Prompt</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain how React 19 Server Actions work..."
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs cursor-pointer"
              >
                Create Blueprint
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI GENERATOR MODAL */}
      {showAIGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-[#0D131F] rounded-3xl border border-slate-700/80 shadow-2xl p-6 relative text-slate-100">
            <button
              onClick={() => setShowAIGenModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <h3 className="text-lg font-extrabold text-white">AI Question Generator</h3>
              <p className="text-xs text-slate-400 mt-1">Auto-generate 3 questions using SmartyHire AI</p>
            </div>

            <form onSubmit={handleGenerateAIBlueprints} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Role / Topic</label>
                <input
                  type="text"
                  required
                  value={aiRole}
                  onChange={(e) => setAiRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100"
                  placeholder="e.g. Senior Node.js Microservices Architect"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={aiDept}
                  onChange={(e) => setAiDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="AI Research">AI Research</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {aiLoading ? 'Generating Blueprints...' : '⚡ Generate 3 Blueprints'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default QuestionBank;
