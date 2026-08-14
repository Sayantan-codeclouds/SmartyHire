const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Company = require('../models/Company');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');
const Response = require('../models/Response');
const Violation = require('../models/Violation');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/simplyhire_ai');
    console.log('[Seeder] Connected to MongoDB.');

    // Clear existing collections
    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
      Interview.deleteMany({}),
      Question.deleteMany({}),
      Candidate.deleteMany({}),
      Response.deleteMany({}),
      Violation.deleteMany({}),
      Report.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seeder] Cleared previous database collections.');

    // 1. Create Demo Company
    const company = await Company.create({
      name: 'Acme Corporation',
      slug: 'acme-corp',
      brandColor: '#6366F1',
      subscription: {
        plan: 'Professional',
        status: 'active',
        monthlyInterviewQuota: 250,
        usedInterviewsThisMonth: 18,
      },
      apiKey: 'sh_live_demo_acme_88992211',
    });

    // 2. Create Demo Admin User
    const adminUser = await User.create({
      name: 'Alex Rivera',
      email: 'admin@acme.com',
      password: 'password123',
      role: 'Company Admin',
      companyId: company._id,
      isVerified: true,
    });

    // 3. Create Sample Interviews
    const feInterview = await Interview.create({
      companyId: company._id,
      createdBy: adminUser._id,
      publicId: 'fe-dev-2026',
      title: 'Senior Frontend Architect',
      jobRole: 'Frontend Engineer',
      department: 'Engineering',
      experience: '4-7 years',
      employmentType: 'Full-time',
      salaryRange: '$140,000 - $180,000',
      durationMinutes: 30,
      difficulty: 'Senior',
      skillsRequired: ['React 19', 'TypeScript', 'System Design', 'Performance', 'TailwindCSS'],
      jobDescription: 'We are seeking a Senior Frontend Architect to lead our Next.js & React 19 design systems and web apps.',
      instructions: 'Speak clearly into your microphone. Keep your webcam active throughout.',
      status: 'Published',
      candidatesCount: 14,
      completedCount: 10,
    });

    const aiInterview = await Interview.create({
      companyId: company._id,
      createdBy: adminUser._id,
      publicId: 'ai-eng-2026',
      title: 'Staff AI Solutions Engineer',
      jobRole: 'AI Engineer',
      department: 'AI Research',
      experience: '5+ years',
      employmentType: 'Full-time',
      salaryRange: '$180,000 - $230,000',
      durationMinutes: 45,
      difficulty: 'Lead/Architect',
      skillsRequired: ['LLM Fine-tuning', 'Groq SDK', 'Python', 'Vector DBs', 'RAG'],
      jobDescription: 'Lead AI integration pipelines, model deployment, and real-time streaming architectures.',
      status: 'Published',
      candidatesCount: 8,
      completedCount: 5,
    });

    // 4. Create Questions for Frontend Interview
    const feQuestions = await Question.insertMany([
      {
        interviewId: feInterview._id,
        companyId: company._id,
        order: 1,
        type: 'Technical',
        title: 'React 19 Server Actions & Concurrent Mode',
        questionText: 'Explain how React 19 Server Actions streamline data mutation compared to traditional API state hooks. How do you handle optimistic UI updates?',
        difficulty: 'Senior',
        competency: 'Technical Depth',
        timeLimitSeconds: 180,
      },
      {
        interviewId: feInterview._id,
        companyId: company._id,
        order: 2,
        type: 'Scenario',
        title: 'Browser Rendering & Core Web Vitals',
        questionText: 'Your dashboard application experiences layout shifts and drops below 30 FPS when rendering high-frequency WebSocket updates. How do you isolate and resolve this performance bottleneck?',
        difficulty: 'Senior',
        competency: 'Performance Optimization',
        timeLimitSeconds: 240,
      },
      {
        interviewId: feInterview._id,
        companyId: company._id,
        order: 3,
        type: 'Behavioral',
        title: 'Architectural Consensus & Leadership',
        questionText: 'Tell me about a time when engineers on your team were split between two frontend frameworks. How did you facilitate a resolution?',
        difficulty: 'Senior',
        competency: 'Leadership',
        timeLimitSeconds: 180,
      },
    ]);

    // 5. Create Sample Candidate 1 (High Performer)
    const candidate1 = await Candidate.create({
      companyId: company._id,
      interviewId: feInterview._id,
      candidateCode: 'CAN-884920',
      name: 'Sophia Chen',
      email: 'sophia.chen@example.com',
      phone: '+1 (555) 234-5678',
      linkedIn: 'https://linkedin.com/in/sophiachen-tech',
      status: 'Interviewed',
      interviewState: 'Completed',
      overallScore: 92,
      recommendation: 'Hire',
      violationsCount: 0,
    });

    // Responses for Candidate 1
    await Response.create([
      {
        candidateId: candidate1._id,
        interviewId: feInterview._id,
        questionId: feQuestions[0]._id,
        questionTitle: feQuestions[0].title,
        answerText: 'React 19 Server Actions allow functions to run on the server without explicit fetch boilerplate. For optimistic updates, useOptimistic hook provides immediate UI feedback while waiting for server verification.',
        score: 95,
        sentiment: 'Confident',
      },
      {
        candidateId: candidate1._id,
        interviewId: feInterview._id,
        questionId: feQuestions[1]._id,
        questionTitle: feQuestions[1].title,
        answerText: 'I would profile paint and layout events in Chrome DevTools Performance tab, throttle incoming WebSocket payloads using RxJS or custom batch buffers, and wrap high-density tables in virtualized lists.',
        score: 90,
        sentiment: 'Confident',
      },
    ]);

    // Report for Candidate 1
    await Report.create({
      candidateId: candidate1._id,
      interviewId: feInterview._id,
      companyId: company._id,
      overallScore: 92,
      recommendation: 'Hire',
      scores: {
        communication: 94,
        confidence: 90,
        technicalKnowledge: 95,
        problemSolving: 92,
        leadership: 88,
        grammar: 96,
        fluency: 92,
        bodyLanguage: 90,
        sentiment: 92,
        cultureFit: 94,
      },
      strengths: [
        'Deep mastery of React 19 internals & concurrency model',
        'Systematic approach to performance profiling and WebSocket batching',
        'Strong verbal clarity and confident delivery',
      ],
      weaknesses: ['Could provide more quantitative metrics on team scaling'],
      improvementAreas: ['Elaborate on edge-case error recovery during network partition'],
      aiSummaryExplanation: 'Sophia demonstrated exceptional frontend engineering principles. Her answers regarding React 19 optimistic mutations and Web Vital optimization demonstrated production-level experience. Highly recommended for Senior Frontend Architect role.',
      questionBreakdown: [
        {
          questionTitle: feQuestions[0].title,
          questionType: 'Technical',
          score: 95,
          candidateAnswer: 'React 19 Server Actions allow functions to run on the server...',
          feedback: 'Comprehensive understanding of Server Actions & useOptimistic.',
        },
      ],
      proctoringReport: {
        totalViolations: 0,
        trustScore: 100,
        flaggedBehavior: [],
      },
    });

    // 6. Create Sample Candidate 2 (Candidate with Proctoring Alerts)
    const candidate2 = await Candidate.create({
      companyId: company._id,
      interviewId: feInterview._id,
      candidateCode: 'CAN-119283',
      name: 'Marcus Vance',
      email: 'marcus.vance@example.com',
      phone: '+1 (555) 987-6543',
      status: 'Applied',
      interviewState: 'Completed',
      overallScore: 71,
      recommendation: 'Maybe',
      violationsCount: 2,
    });

    await Violation.create([
      {
        candidateId: candidate2._id,
        interviewId: feInterview._id,
        companyId: company._id,
        type: 'Tab Switch',
        severity: 'medium',
        details: 'Candidate switched active browser tab for 8 seconds.',
      },
      {
        candidateId: candidate2._id,
        interviewId: feInterview._id,
        companyId: company._id,
        type: 'Window Blur',
        severity: 'low',
        details: 'Browser window lost focus.',
      },
    ]);

    // Notifications & Audit log
    await Notification.create({
      companyId: company._id,
      title: 'AI Evaluation Complete',
      message: 'Sophia Chen completed interview for Senior Frontend Architect with a score of 92/100 (Hire).',
      type: 'AI Finished Evaluation',
    });

    await AuditLog.create({
      companyId: company._id,
      userId: adminUser._id,
      userName: adminUser.name,
      userRole: adminUser.role,
      action: 'CREATED_INTERVIEW',
      entityType: 'Interview',
      entityId: feInterview._id,
      details: 'Created Senior Frontend Architect interview blueprint.',
    });

    console.log('[Seeder] Seed process complete!');
    console.log('----------------------------------------------------');
    console.log('DEMO LOGIN CREDENTIALS:');
    console.log('Email: admin@acme.com');
    console.log('Password: password123');
    console.log('Public Demo Interview URL: /interview/fe-dev-2026');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error]', err);
    process.exit(1);
  }
};

seedData();
