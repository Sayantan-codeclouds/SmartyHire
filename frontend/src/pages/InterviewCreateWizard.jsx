import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Bot, Sparkles, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const InterviewCreateWizard = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [experience, setExperience] = useState('3-5 years');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [salaryRange, setSalaryRange] = useState('$100,000 - $140,000');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState('Mid-Level');
  const [skillsRequired, setSkillsRequired] = useState('React, Node.js, System Design');
  const [jobDescription, setJobDescription] = useState('');

  // AI & Proctoring Options
  const [personality, setPersonality] = useState('Professional & Friendly');
  const [questionCount, setQuestionCount] = useState(6);
  const [enableCodingRound, setEnableCodingRound] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !jobRole || !jobDescription) {
      setError('Please complete the title, job role, and description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        jobRole,
        department,
        experience,
        employmentType,
        salaryRange,
        durationMinutes: Number(durationMinutes),
        difficulty,
        skillsRequired,
        jobDescription,
        aiConfig: {
          personality,
          questionCount: Number(questionCount),
          voice: 'alloy',
          language: 'en-US',
        },
        proctoring: {
          cameraRequired: true,
          microphoneRequired: true,
          tabSwitchDetection: true,
          fullscreenRequired: true,
        },
        rounds: {
          enableCodingRound,
          enableMCQRound: true,
          enableHRRound: true,
        },
      };

      const res = await api.post('/interviews', payload);
      if (res.data.success) {
        navigate('/dashboard/interviews');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate interview blueprint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Create AI Interview <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Groq GPT-OSS 120b will automatically generate structured questions from your Job Description.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">1. Position & Role Details</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Interview Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
                placeholder="Senior Full-Stack Engineer Interview"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Role *</label>
                <input
                  type="text"
                  required
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
                  placeholder="Full-Stack Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
                  placeholder="Engineering"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead/Architect">Lead/Architect</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Question Count</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Required Skills (Comma separated)</label>
              <input
                type="text"
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
                placeholder="React 19, Node.js, TypeScript, Groq"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Job Description *</label>
              <textarea
                required
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
                placeholder="Paste full job description here... Groq AI will extract key competencies and formulate interview questions."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">2. AI Persona & Rounds</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">AI Interviewer Personality</label>
                <select
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
                >
                  <option value="Professional & Friendly">Professional & Friendly</option>
                  <option value="Strict Technical Architect">Strict Technical Architect</option>
                  <option value="Behavioral HR Specialist">Behavioral HR Specialist</option>
                  <option value="Fast-Paced Startup Founder">Fast-Paced Startup Founder</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableCodingRound}
                    onChange={(e) => setEnableCodingRound(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Enable In-Browser Coding Playground</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            {loading ? 'Groq AI Generating Questions...' : 'Generate AI Interview & Publish'}
            <Sparkles className="w-4 h-4" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default InterviewCreateWizard;
