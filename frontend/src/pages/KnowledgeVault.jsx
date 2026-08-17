import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  FileCheck,
  Search,
  Sparkles,
  BookOpen,
  Eye,
  X,
  CheckCircle,
  FileCode,
  Download,
  Lock,
  ArrowRight,
  ShieldCheck,
  Brain,
  Zap,
  Check,
} from 'lucide-react';

const KnowledgeVault = () => {
  const { company } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isUpgradeRequired, setIsUpgradeRequired] = useState(false);

  const currentPlan = company?.plan || company?.subscription?.plan || 'Free';
  const isPro = ['Pro', 'Professional', 'Enterprise'].includes(currentPlan);

  // Modals & Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Upload PDF Form
  const [file, setFile] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Company Overview');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadErr, setUploadErr] = useState('');

  // Text Entry Form
  const [textTitle, setTextTitle] = useState('');
  const [textCategory, setTextCategory] = useState('Company Overview');
  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    if (isPro) {
      fetchDocuments();
    } else {
      setLoading(false);
    }
  }, [isPro]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/knowledge');
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.isUpgradeRequired) {
        setIsUpgradeRequired(true);
      }
      console.error('[Fetch Knowledge Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadMsg('');
    setUploadErr('');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', docTitle);
      formData.append('category', docCategory);

      const res = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setUploadMsg('PDF uploaded & text extracted for RAG AI!');
        setFile(null);
        setDocTitle('');
        fetchDocuments();
        setTimeout(() => {
          setUploadMsg('');
          setShowUploadModal(false);
        }, 1500);
      }
    } catch (err) {
      setUploadErr(err.response?.data?.message || 'Failed to parse PDF document.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateTextKnowledge = async (e) => {
    e.preventDefault();
    if (!textTitle || !textContent) return;

    setTextLoading(true);
    try {
      const res = await api.post('/knowledge/text', {
        title: textTitle,
        category: textCategory,
        content: textContent,
      });

      if (res.data.success) {
        setTextTitle('');
        setTextContent('');
        fetchDocuments();
        setShowTextModal(false);
      }
    } catch (err) {
      console.error('[Create Text Doc Error]', err);
    } finally {
      setTextLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this document from RAG Knowledge Vault?')) return;
    try {
      await api.delete(`/knowledge/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      if (viewingDoc?._id === id) setViewingDoc(null);
    } catch (err) {
      console.error('[Delete Doc Error]', err);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.title?.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.extractedText?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !categoryFilter || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!isPro || isUpgradeRequired) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-in">
          {/* Hero Paywall Card */}
          <div className="glass-card p-8 md:p-10 rounded-3xl border border-violet-500/30 bg-gradient-to-b from-violet-950/30 via-slate-900/60 to-slate-950/80 shadow-2xl relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Lock Badge */}
            <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-extrabold uppercase tracking-wider shadow-lg">
              <Lock className="w-3.5 h-3.5 text-violet-400" />
              <span>Pro & Enterprise Feature</span>
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Knowledge Base & <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">RAG Vault</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Knowledge Vault empowers SmartyHire AI to interview candidates contextually against your company's actual technical architecture, culture handbooks, and hiring rubrics.
              </p>
            </div>

            {/* Plan Tier Status */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center gap-2">
                <span className="text-slate-500">Current Workspace Plan:</span>
                <span className="font-extrabold text-slate-200">{currentPlan}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-violet-950/60 border border-violet-500/40 text-xs flex items-center gap-2 text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Required: <strong className="text-white">Pro Plan (₹1,199/mo)</strong> or Enterprise</span>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard/settings"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Upgrade to Pro Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-[11px] text-slate-500">
              Includes 250 AI Interviews/mo · Knowledge Vault RAG · Live Candidate Proctoring Wall · Priority Support
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2 hover:border-violet-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Custom PDF & Handbook Ingestion</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Upload internal PDF guides, team expectations, engineering standards, and benefits overviews for instant text parsing.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2 hover:border-violet-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Grounded Candidate Q&A</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When candidates ask questions during interviews about your team, stack, or perks, the AI answers directly using your documents.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2 hover:border-violet-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Automated Semantic Chunking</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Documents are split into semantic chunks with key topic extraction for sub-second retrieval into AI context windows.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2 hover:border-violet-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Domain-Specific Role Standards</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ensure interview questions evaluate candidates strictly against your internal architecture benchmarks and engineering rubrics.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Knowledge Base & RAG Vault <Sparkles className="w-5 h-5 text-indigo-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload PDF handbooks, culture guides, tech stack overviews, and policy documents to power real-time RAG AI answers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTextModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Paste Text Entry</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload PDF Document</span>
            </button>
          </div>
        </div>

        {/* RAG Context Banner */}
        <div className="glass-card p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-cyan-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Active Company RAG Index: {documents.length} Documents Loaded
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                When candidates ask questions during interviews (e.g. asking about company culture, stack, policies, or expectations), SmartyHire AI uses the extracted text from these PDF documents to generate grounded, accurate RAG responses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/80 px-3.5 py-2 rounded-xl border border-cyan-500/30 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Real-time PDF Parser Active
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 glass-card p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search knowledge documents by title, file name, or parsed text content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Company Overview">Company Overview</option>
            <option value="Tech Stack & Architecture">Tech Stack & Architecture</option>
            <option value="Culture & Benefits">Culture & Benefits</option>
            <option value="Interview Guidelines">Interview Guidelines</option>
            <option value="Question Blueprints">Question Blueprints</option>
            <option value="General Policy">General Policy</option>
          </select>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading Knowledge Vault documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-500 mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-slate-200">No Knowledge Documents Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Upload your company PDF handbooks, culture guides, or tech stack overviews to activate RAG candidate Q&A!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <div key={doc._id} className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-all space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                      {doc.category}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      {doc.mimeType === 'application/pdf' ? 'PDF Doc' : 'Text Entry'}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white leading-snug truncate">{doc.title}</h3>
                      <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{doc.fileName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        {(doc.fileSize / 1024).toFixed(1)} KB • Extracted {doc.extractedText?.length || 0} chars
                      </p>
                    </div>
                  </div>

                  {/* Parsed Snippet Preview */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 font-mono line-clamp-3 leading-relaxed">
                    "{doc.extractedText}"
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Parsed Text
                  </button>

                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[11px] font-semibold cursor-pointer transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* UPLOAD PDF MODAL */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-lg w-full bg-[#0D131F] rounded-3xl border border-slate-700/80 shadow-2xl p-6 relative text-slate-100 space-y-5">
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <h3 className="text-lg font-extrabold text-white">Upload PDF Knowledge Document</h3>
                <p className="text-xs text-slate-400 mt-1">PDF text will be parsed and indexed for real-time AI Candidate RAG</p>
              </div>

              {uploadMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-center gap-2 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{uploadMsg}</span>
                </div>
              )}

              {uploadErr && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 text-center font-medium">
                  {uploadErr}
                </div>
              )}

              <form onSubmit={handlePdfUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering Culture Handbook 2026"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Company Overview">Company Overview</option>
                    <option value="Tech Stack & Architecture">Tech Stack & Architecture</option>
                    <option value="Culture & Benefits">Culture & Benefits</option>
                    <option value="Interview Guidelines">Interview Guidelines</option>
                    <option value="Question Blueprints">Question Blueprints</option>
                    <option value="General Policy">General Policy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select PDF File</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-950 file:text-indigo-300 hover:file:bg-indigo-900 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Parsing PDF Text for RAG...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" /> Upload & Parse PDF
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CREATE TEXT ENTRY MODAL */}
        {showTextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-lg w-full bg-[#0D131F] rounded-3xl border border-slate-700/80 shadow-2xl p-6 relative text-slate-100 space-y-5">
              <button
                onClick={() => setShowTextModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <FileCode className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <h3 className="text-lg font-extrabold text-white">Paste Text Knowledge Entry</h3>
                <p className="text-xs text-slate-400 mt-1">Directly add notes, FAQs, tech specs, or company guidelines</p>
              </div>

              <form onSubmit={handleCreateTextKnowledge} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Tech Stack & Deployment Architecture"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={textCategory}
                    onChange={(e) => setTextCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Company Overview">Company Overview</option>
                    <option value="Tech Stack & Architecture">Tech Stack & Architecture</option>
                    <option value="Culture & Benefits">Culture & Benefits</option>
                    <option value="Interview Guidelines">Interview Guidelines</option>
                    <option value="General Policy">General Policy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Knowledge Details / Notes</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Type or paste tech stack info, working hours, benefits, company culture notes..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={textLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {textLoading ? 'Saving Knowledge...' : 'Save Knowledge Entry to RAG Vault'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW PARSED TEXT MODAL */}
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-2xl w-full bg-[#0D131F] rounded-3xl border border-slate-700/80 shadow-2xl p-6 relative text-slate-100 space-y-4 max-h-[85vh] flex flex-col">
              <button
                onClick={() => setViewingDoc(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold font-mono">
                  {viewingDoc.category}
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1">{viewingDoc.title}</h3>
                <p className="text-xs text-slate-400 font-mono">{viewingDoc.fileName} • Extracted text parsed for RAG</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                {viewingDoc.extractedText}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default KnowledgeVault;
