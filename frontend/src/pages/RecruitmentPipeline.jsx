import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { GripVertical, User, ExternalLink } from 'lucide-react';

const STAGES = ['Applied', 'Interview Scheduled', 'Interviewed', 'Selected', 'Rejected', 'Offer Sent', 'Joined'];

const STAGE_COLORS = {
  'Applied':            'border-slate-600/40 bg-slate-900/40',
  'Interview Scheduled':'border-cyan-500/30 bg-cyan-950/20',
  'Interviewed':        'border-indigo-500/30 bg-indigo-950/20',
  'Selected':           'border-emerald-500/30 bg-emerald-950/20',
  'Rejected':           'border-rose-500/30 bg-rose-950/20',
  'Offer Sent':         'border-amber-500/30 bg-amber-950/20',
  'Joined':             'border-purple-500/30 bg-purple-950/20',
};

const HEADER_COLORS = {
  'Applied':            'text-slate-300',
  'Interview Scheduled':'text-cyan-400',
  'Interviewed':        'text-indigo-400',
  'Selected':           'text-emerald-400',
  'Rejected':           'text-rose-400',
  'Offer Sent':         'text-amber-400',
  'Joined':             'text-purple-400',
};

const RecruitmentPipeline = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(null); // { candidateId, sourceStage }
  const [dragOver, setDragOver] = useState(null); // stage name

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const res = await api.get('/candidates');
        if (res.data.success) setCandidates(res.data.candidates);
      } catch (err) {
        console.error('[Kanban Error]', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, []);

  const moveCandidate = useCallback(async (candidateId, newStatus) => {
    setCandidates((prev) =>
      prev.map((c) => (c._id === candidateId ? { ...c, status: newStatus } : c))
    );
    try {
      await api.put(`/candidates/${candidateId}/status`, { status: newStatus });
    } catch (err) {
      console.error('[Move Error]', err);
    }
  }, []);

  // ── Drag Handlers ────────────────────────────────────────────────────────
  const handleDragStart = (e, candidateId, sourceStage) => {
    setDragging({ candidateId, sourceStage });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(stage);
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    if (dragging && dragging.sourceStage !== targetStage) {
      moveCandidate(dragging.candidateId, targetStage);
    }
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  // ── Loading Skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <div className="h-7 w-64 bg-slate-800 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-96 bg-slate-800/60 rounded animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6">
            {STAGES.slice(0, 5).map((_, i) => (
              <div key={i} className="w-72 flex-shrink-0 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-20 rounded-xl bg-slate-800/60 animate-pulse" style={{ animationDelay: `${j * 100}ms` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Recruitment Kanban Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">
            Drag cards between columns to move candidates through the hiring funnel
          </p>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-6">
          {STAGES.map((stage) => {
            const stageCandidates = candidates.filter((c) => c.status === stage);
            const isDropTarget = dragOver === stage;

            return (
              <div
                key={stage}
                className={`w-72 flex-shrink-0 rounded-2xl border p-4 flex flex-col max-h-[78vh] transition-all duration-150 ${
                  STAGE_COLORS[stage]
                } ${isDropTarget ? 'ring-2 ring-indigo-500/60 scale-[1.01]' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDrop={(e) => handleDrop(e, stage)}
                onDragLeave={() => setDragOver(null)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h3 className={`text-xs font-bold ${HEADER_COLORS[stage]}`}>{stage}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-indigo-400 font-mono text-[10px] font-bold border border-slate-800">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {stageCandidates.length === 0 ? (
                    <div className={`h-20 rounded-xl border-2 border-dashed flex items-center justify-center text-[11px] text-slate-600 transition-all ${
                      isDropTarget ? 'border-indigo-500/50 text-indigo-500 bg-indigo-950/20' : 'border-slate-800'
                    }`}>
                      {isDropTarget ? 'Drop here' : 'No candidates'}
                    </div>
                  ) : (
                    stageCandidates.map((cand) => (
                      <div
                        key={cand._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cand._id, stage)}
                        onDragEnd={handleDragEnd}
                        className={`p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-xs transition-all space-y-2 cursor-grab active:cursor-grabbing active:opacity-60 select-none ${
                          dragging?.candidateId === cand._id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        {/* Card Top Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="w-3 h-3 text-slate-600 flex-shrink-0" />
                            <span className="font-bold text-slate-100 truncate">{cand.name}</span>
                          </div>
                          {cand.overallScore > 0 && (
                            <span className="text-[10px] font-bold font-mono text-indigo-400 flex-shrink-0 bg-indigo-950/60 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                              {cand.overallScore}/100
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 truncate pl-4">{cand.interviewId?.title || 'Interview'}</p>

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">{cand.candidateCode}</span>
                          <Link
                            to={`/dashboard/candidate/${cand._id}`}
                            className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            View
                          </Link>
                        </div>

                        {/* Recommendation badge */}
                        {cand.recommendation && cand.recommendation !== 'Pending' && (
                          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-center ${
                            cand.recommendation === 'Hire'   ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                            cand.recommendation === 'Maybe'  ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' :
                                                               'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                          }`}>
                            AI: {cand.recommendation}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecruitmentPipeline;
