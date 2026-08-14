import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';

const STAGES = ['Applied', 'Interview Scheduled', 'Interviewed', 'Selected', 'Rejected', 'Offer Sent', 'Joined'];

const RecruitmentPipeline = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const res = await api.get('/candidates');
        if (res.data.success) {
          setCandidates(res.data.candidates);
        }
      } catch (err) {
        console.error('[Kanban Error]', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, []);

  const moveCandidate = async (candidateId, newStatus) => {
    try {
      setCandidates((prev) =>
        prev.map((c) => (c._id === candidateId ? { ...c, status: newStatus } : c))
      );
      await api.put(`/candidates/${candidateId}/status`, { status: newStatus });
    } catch (err) {
      console.error('[Move Error]', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Recruitment Kanban Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">Track applicant lifecycle from initial application to offer stage</p>
        </div>

        {/* Kanban Columns Overflow Horizontal */}
        <div className="flex gap-4 overflow-x-auto pb-6">
          {STAGES.map((stage, idx) => {
            const stageCandidates = candidates.filter((c) => c.status === stage);
            return (
              <div key={idx} className="w-72 flex-shrink-0 glass-card p-4 rounded-2xl border border-slate-800 flex flex-col max-h-[75vh]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-200">{stage}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-indigo-400 font-mono text-[10px] font-bold border border-slate-800">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {stageCandidates.map((cand) => (
                    <div
                      key={cand._id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-xs transition-all space-y-2 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100">{cand.name}</span>
                        {cand.overallScore > 0 && (
                          <span className="text-[10px] font-bold font-mono text-indigo-400">{cand.overallScore}/100</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{cand.interviewId?.title || 'Engineer'}</p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono">{cand.candidateCode}</span>
                        <select
                          value={cand.status}
                          onChange={(e) => moveCandidate(cand._id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[10px]"
                        >
                          {STAGES.map((s, i) => (
                            <option key={i} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
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
