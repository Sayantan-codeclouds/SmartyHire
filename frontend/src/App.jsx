import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Candidate Flow Pages
import PublicInterviewLanding from './pages/PublicInterviewLanding';
import CandidateRegistration from './pages/CandidateRegistration';
import SystemCheck from './pages/SystemCheck';
import AIInterviewRoom from './pages/AIInterviewRoom';
import InterviewCompleted from './pages/InterviewCompleted';

// SaaS Dashboard Pages
import DashboardOverview from './pages/DashboardOverview';
import InterviewsList from './pages/InterviewsList';
import InterviewCreateWizard from './pages/InterviewCreateWizard';
import CandidatesList from './pages/CandidatesList';
import CandidateDetail from './pages/CandidateDetail';
import RecruitmentPipeline from './pages/RecruitmentPipeline';
import ReportDetail from './pages/ReportDetail';
import KnowledgeVault from './pages/KnowledgeVault';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import AdminPortal from './pages/AdminPortal';
import AdminLogin from './pages/AdminLogin';
import ResetPassword from './pages/ResetPassword';
import QuestionBank from './pages/QuestionBank';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'Super Admin') return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public Marketing Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Dedicated Super Admin Login Portal */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Public Candidate Interview Workflow */}
              <Route path="/interview/:publicId" element={<PublicInterviewLanding />} />
              <Route path="/interview/register/:publicId" element={<CandidateRegistration />} />
              <Route path="/interview/system-check/:candidateId" element={<SystemCheck />} />
              <Route path="/interview/room/:candidateId" element={<AIInterviewRoom />} />
              <Route path="/interview/completed/:candidateId" element={<InterviewCompleted />} />

              {/* Company SaaS Workspace Routes (Protected) */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
              <Route path="/dashboard/interviews" element={<ProtectedRoute><InterviewsList /></ProtectedRoute>} />
              <Route path="/dashboard/interviews/new" element={<ProtectedRoute><InterviewCreateWizard /></ProtectedRoute>} />
              <Route path="/dashboard/candidates" element={<ProtectedRoute><CandidatesList /></ProtectedRoute>} />
              <Route path="/dashboard/candidate/:id" element={<ProtectedRoute><CandidateDetail /></ProtectedRoute>} />
              <Route path="/dashboard/kanban" element={<ProtectedRoute><RecruitmentPipeline /></ProtectedRoute>} />
              <Route path="/dashboard/report/:candidateId" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
              <Route path="/dashboard/knowledge" element={<ProtectedRoute><KnowledgeVault /></ProtectedRoute>} />
              <Route path="/dashboard/questions" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/dashboard/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />

              {/* Super Admin Portal (Guarded for Super Admin Role) */}
              <Route path="/admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />
              <Route path="/admin/*" element={<AdminRoute><AdminPortal /></AdminRoute>} />

              {/* Fallback Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
