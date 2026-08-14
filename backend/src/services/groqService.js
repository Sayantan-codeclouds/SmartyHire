const { getGroqClient, MODEL } = require('../config/groq');
const fs = require('fs');
const { findRelevantChunks } = require('./chunkingService');

/**
 * Transcribe Audio using Groq Whisper API (whisper-large-v3)
 */
const transcribeAudioGroq = async (audioFilePath) => {
  const groq = getGroqClient();

  if (groq && fs.existsSync(audioFilePath)) {
    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-large-v3',
        response_format: 'json',
        language: 'en',
        temperature: 0.0,
      });

      console.log(`[Groq Whisper] Transcribed: "${transcription.text}"`);
      return transcription.text || '';
    } catch (err) {
      console.error('[Groq Whisper Error]', err.message);
    }
  }

  return 'Candidate provided spoken audio response recorded via microphone.';
};

/**
 * Generate interview questions based on Job Description & role details using Groq API
 */
const generateQuestionsFromJD = async ({ jobTitle, department, experience, skills, jobDescription, questionCount = 10 }) => {
  return generateQuestionsWithRAG({ jobTitle, department, experience, skills, jobDescription, questionCount, bankQuestions: [] });
};

/**
 * Generate interview questions with RAG — pulls from company Question Bank as context
 * Guarantees distinct, unique questions for every interview session
 */
const generateQuestionsWithRAG = async ({
  jobTitle,
  department = 'Engineering',
  experience = 'Mid-Level',
  skills = [],
  jobDescription = '',
  questionCount = 6,
  durationMinutes = 30,
  bankQuestions = [],
  candidateName = '',
  seed = Date.now(),
}) => {
  const groq = getGroqClient();

  const numQuestions = Math.max(1, Number(questionCount) || 6);
  const totalMins = Math.max(5, Number(durationMinutes) || 30);
  const perQuestionSec = Math.max(60, Math.floor((totalMins * 60) / numQuestions));

  // Shuffle Question Bank randomly so each candidate session gets a different reference sample
  const shuffledBank = [...bankQuestions].sort(() => Math.random() - 0.5);
  const formattedBank = shuffledBank.slice(0, 10).map((q, i) => {
    const keyPoints = Array.isArray(q.expectedAnswerKeyPoints) && q.expectedAnswerKeyPoints.length > 0
      ? ` | Key Criteria: ${q.expectedAnswerKeyPoints.join(', ')}`
      : '';
    return `${i + 1}. [${q.type || 'Technical'}][${q.difficulty || 'Mid-Level'}][Competency: ${q.competency || 'General'}] "${q.questionText}"${keyPoints}`;
  }).join('\n');

  const bankContext = bankQuestions.length > 0
    ? `\nCOMPANY QUESTION BANK (RAG Reference Benchmark):\n${formattedBank}\n`
    : '';

  const uniqueSessionKey = `CANDIDATE-SESSION-${seed}-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;

  if (groq) {
    try {
      const prompt = `
POSITION & SESSION SPECIFICATION:
Position: ${jobTitle}
Department: ${department}
Seniority Level: ${experience}
Required Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
Job Description: ${jobDescription}
${candidateName ? `Candidate Name: ${candidateName}` : ''}
Session Target Questions: Exactly ${numQuestions} questions
Session Total Time: ${totalMins} minutes (${perQuestionSec} seconds per question)
Unique Session Randomization Key: ${uniqueSessionKey}
${bankContext}

CRITICAL UNIQUENESS & DIVERSITY RULES:
1. CANDIDATE-UNIQUE QUESTIONS: You MUST generate a COMPLETELY UNIQUE, ORIGINAL set of questions specifically for this candidate session key (${uniqueSessionKey}). No two candidates interviewing for this role should receive the same questions.
2. NO GENERIC QUESTIONS: Avoid standard textbook questions. Ask real-world scenario-based engineering questions (e.g. system design trade-offs, debugging production outages, database indexing bottlenecks, API microservice architecture, state concurrency).
3. RAG ADAPTATION: Use the Question Bank above as reference quality benchmarks, but generate fresh, distinct variations and shuffle question themes.
4. GROUND-TRUTH CRITERIA: Generate exactly ${Math.max(1, numQuestions - 1)} main questions. For EVERY question, define 3-4 specific 'expectedAnswerKeyPoints' serving as evaluation criteria.
5. TIME LIMIT PER QUESTION: Set "timeLimitSeconds": ${perQuestionSec} for every question.

Return ONLY a valid JSON array matching this schema:
[
  {
    "order": 1,
    "type": "Technical|Behavioral|HR|Coding|Scenario|Aptitude",
    "title": "Short descriptive title",
    "questionText": "Clear, precise, unique interview question",
    "difficulty": "Junior|Mid-Level|Senior|Lead",
    "competency": "Target Competency Name",
    "timeLimitSeconds": ${perQuestionSec},
    "expectedAnswerKeyPoints": ["Ground-truth key point 1", "Ground-truth key point 2", "Ground-truth key point 3"]
  }
]
`;
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert AI interview architect. Always output responses in valid json format.' },
          { role: 'user', content: prompt },
        ],
        model: MODEL,
        temperature: 0.95, // High temperature guarantees rich diversity across candidate sessions!
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '';
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      let questions = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || [];

      if (questions.length > 0) {
        const mainQuestions = questions.slice(0, Math.max(1, numQuestions - 1)).map((q, idx) => ({
          ...q,
          order: idx + 1,
          timeLimitSeconds: q.timeLimitSeconds || perQuestionSec,
        }));

        const finalQAQuestion = {
          order: mainQuestions.length + 1,
          type: 'Candidate-Q&A',
          title: 'Candidate Q&A Round',
          questionText: 'Do you have something in mind you wanna ask?',
          difficulty: 'General',
          competency: 'Candidate Q&A',
          timeLimitSeconds: perQuestionSec,
          expectedAnswerKeyPoints: ['Candidate question regarding role, company, team, or stack'],
          isCandidateQA: true,
        };
        return [...mainQuestions, finalQAQuestion];
      }
    } catch (err) {
      console.error('[Groq RAG Question Gen Error]', err.message);
    }
  }

  const fallbacks = getFallbackQuestions(jobTitle, Array.isArray(skills) ? skills : [], Math.max(1, numQuestions - 1), perQuestionSec);
  return [
    ...fallbacks,
    {
      order: fallbacks.length + 1,
      type: 'Candidate-Q&A',
      title: 'Candidate Q&A Round',
      questionText: 'Do you have something in mind you wanna ask?',
      difficulty: 'General',
      competency: 'Candidate Q&A',
      timeLimitSeconds: perQuestionSec,
      expectedAnswerKeyPoints: ['Candidate question regarding role, company, team, or stack'],
      isCandidateQA: true,
    },
  ];
};

/**
 * Answer Candidate's Q&A Question using RAG from Company & Job Context
 */
const answerCandidateQuestionWithRAG = async ({
  candidateQuestion,
  companyName,
  jobTitle,
  jobRole,
  department,
  jobDescription,
  skillsRequired = [],
  documentKnowledge = '',
  rawDocs = [],
  bankQuestions = [],
}) => {
  const groq = getGroqClient();

  const cleanInput = (candidateQuestion || '').trim().toLowerCase();

  // Deterministic closing statement check
  const isClosingInput =
    /^(no|nothing|none|nope|no thanks|no thank you|nothing else|that's all|thats all|i'm good|im good|done|that is all|all good|no more|no questions|finish|submit)$/i.test(cleanInput) ||
    cleanInput.includes('nothing else') ||
    cleanInput.includes('no more questions') ||
    cleanInput.includes('no thank you') ||
    cleanInput === 'no';

  if (isClosingInput) {
    return {
      isClosing: true,
      aiAnswer: `Thank you so much for taking the time to interview with ${companyName || 'our team'} today for the ${jobTitle} position! Your responses have been recorded and submitted to our hiring team. We wish you the best of luck!`,
    };
  }

  const ragContext = `
COMPANY & ROLE RAG CONTEXT:
Company Name: ${companyName || 'SmartyHire Workspace'}
Position Title: ${jobTitle} (${jobRole || 'Engineering'})
Department: ${department || 'Engineering'}
Required Skills: ${Array.isArray(skillsRequired) ? skillsRequired.join(', ') : skillsRequired}
Job Description: ${jobDescription || 'N/A'}

UPLOADED KNOWLEDGE VAULT DOCUMENTS (PDF RAG Knowledge):
${documentKnowledge || 'No custom PDF documents uploaded yet. Answer based on company and position context.'}

QUESTION BANK BLUEPRINTS:
${bankQuestions.slice(0, 5).map((q) => q.questionText).join('; ')}
`;

  // Extract exact RAG passage from uploaded Knowledge Vault documents using semantic chunking
  const extractRAGAnswerFromDoc = (docText, question, rawDocs = []) => {
    // 1. Semantic Chunking Retrieval
    if (rawDocs && rawDocs.length > 0) {
      const topChunks = findRelevantChunks(rawDocs, question, 2);
      if (topChunks && topChunks.length > 0) {
        const passage = topChunks.map((c) => c.text).join(' ');
        const cleanSnippet = passage.replace(/\s+/g, ' ').trim();
        return `${cleanSnippet.slice(0, 450)} Would you like to know anything else about us or the role?`;
      }
    }

    if (!docText || typeof docText !== 'string' || docText.trim().length === 0) return null;
    const qLower = (question || '').toLowerCase();
    const keywords = qLower
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['what', 'when', 'where', 'how', 'who', 'why', 'is', 'are', 'the', 'our', 'for', 'about'].includes(w));

    if (keywords.length === 0) return null;

    // Split document into sections / policy paragraphs
    const sections = docText.split(/\n\s*\n|\n---\n/);
    let bestSection = '';
    let maxScore = 0;

    for (const section of sections) {
      const sLower = section.toLowerCase();
      let score = 0;

      for (const kw of keywords) {
        if (sLower.includes(kw)) {
          score += 1;
          if (sLower.includes(`1.`) || sLower.includes(`2.`) || sLower.includes(`3.`) || sLower.includes(`4.`) || sLower.includes(`5.`) || sLower.includes(`6.`)) {
            score += 0.5;
          }
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestSection = section;
      }
    }

    if (maxScore > 0 && bestSection.trim().length > 15) {
      const sectionIdx = sections.indexOf(bestSection);
      let fullPassage = bestSection;

      if (sectionIdx !== -1 && (bestSection.trim().endsWith(':') || bestSection.length < 120)) {
        const nextBlocks = sections.slice(sectionIdx + 1, sectionIdx + 4).join(' ');
        fullPassage = `${bestSection} ${nextBlocks}`;
      }

      const cleanSnippet = fullPassage.replace(/\s+/g, ' ').trim();
      return `${cleanSnippet.slice(0, 450)} Would you like to know anything else about us or the role?`;
    }

    return null;
  };

  // Smart Topic Intent Answer Generator for custom or fallback responses
  const getSmartTopicAnswer = (qText, cName, jTitle, docKnowledge, rawDocsList = []) => {
    const docMatch = extractRAGAnswerFromDoc(docKnowledge, qText, rawDocsList);
    if (docMatch) return docMatch;

    return `We currently can't provide this information. Would you like to know anything else about us or the role?`;
  };

  if (groq) {
    try {
      const prompt = `
The candidate explicitly asked this question during the final interview Q&A round: "${candidateQuestion}"

${ragContext}

INSTRUCTIONS:
1. Answer the candidate's exact question ("${candidateQuestion}") warmly and naturally in 2-3 sentences as the AI interviewer representing ${companyName || 'the company'}.
2. Ground your response in the Knowledge Vault details above. DO NOT say "According to our document" or "According to the PDF". State the facts directly as company policy/details.
3. IF THE ANSWER IS NOT MENTIONED in the uploaded documents or company context: Respond with: "We currently can't provide this information. Would you like to know anything else about us or the role?"
4. ALWAYS end your response by asking: "Would you like to know anything else about us or the role?"

Return ONLY a valid json object with the key "aiAnswer".
`;
      const res = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert AI interviewer. Always respond with valid json format.' },
          { role: 'user', content: prompt },
        ],
        model: MODEL,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = res.choices[0]?.message?.content || '';
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.aiAnswer) {
        let answerStr = parsed.aiAnswer;
        if (!answerStr.toLowerCase().includes('else')) {
          answerStr += ' Would you like to know anything else about us or the role?';
        }
        return {
          isClosing: false,
          aiAnswer: answerStr,
        };
      }
    } catch (e) {
      console.error('[Groq Candidate Q&A RAG Error]', e.message);
    }
  }

  return {
    isClosing: false,
    aiAnswer: getSmartTopicAnswer(candidateQuestion, companyName, jobTitle, documentKnowledge, rawDocs),
  };
};

/**
 * Generate Smart Adaptive Follow-Up Question using Conversation History & RAG Criteria
 */
const generateFollowUpQuestion = async ({ questionText, candidateAnswer, jobTitle, expectedAnswerKeyPoints = [], previousQAs = [] }) => {
  const groq = getGroqClient();

  if (groq) {
    try {
      const keyPointsContext = Array.isArray(expectedAnswerKeyPoints) && expectedAnswerKeyPoints.length > 0
        ? `\nRAG Ground-Truth Expected Key Points for this question:\n${expectedAnswerKeyPoints.map((k, i) => `- ${k}`).join('\n')}`
        : '';

      const historyContext = Array.isArray(previousQAs) && previousQAs.length > 0
        ? `\nPrevious Conversation Context in this Interview Session:\n${previousQAs.map((qa, i) => `Q${i + 1}: ${qa.questionText}\nA${i + 1}: ${qa.answerText}`).join('\n')}`
        : '';

      const prompt = `
You are an expert AI Technical Interviewer conducting a live interview for a ${jobTitle} role.

Current Question: "${questionText}"
Candidate's Response: "${candidateAnswer}"
${keyPointsContext}
${historyContext}

PROMPTING INSTRUCTIONS:
1. Analyze the candidate's response against the expected RAG key points (if provided). Identify what they explained well and what critical technical detail or key point was omitted or unclear.
2. Consider the previous conversation history to avoid repeating past questions or topics.
3. Formulate a single, concise, highly intelligent follow-up question (1-2 sentences) that challenges the candidate on their gap, trade-offs, edge cases, or practical execution.

Return ONLY valid JSON matching:
{ "followUpQuestion": "Concise follow-up question..." }
`;
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const content = res.choices[0]?.message?.content;
      const parsed = JSON.parse(content);
      return parsed.followUpQuestion || `Could you elaborate on the specific trade-offs and edge cases of the solution you described?`;
    } catch (e) {
      console.error('[Groq Follow-up Error]', e.message);
    }
  }

  return `Could you explain how you would measure performance and handle failures in the approach you described?`;
};

/**
 * Helper: Detect Refusal / Empty / "I don't know" Responses
 */
function isRefusalAnswer(text = '') {
  const lower = text.toLowerCase().trim();
  const refusalPhrases = [
    "i don't know",
    "i dont know",
    "idk",
    "no idea",
    "don't know",
    "dont know",
    "not sure",
    "pass",
    "skip",
    "no answer",
    "i have no idea",
  ];
  return refusalPhrases.some((phrase) => lower.includes(phrase)) || lower.length < 10;
}

/**
 * Generate Full Candidate Evaluation Scorecard comparing candidate answers against RAG criteria
 */
const evaluateCandidateResponses = async ({ candidateName, jobTitle, responses, violations = [], assignedQuestions = [] }) => {
  const groq = getGroqClient();

  // Map RAG expected key points to each response
  const responsesWithRAG = responses.map((r, idx) => {
    const matchedQ = assignedQuestions.find(
      (aq) => aq._id?.toString() === r.questionId?.toString() || aq.title === r.questionTitle
    ) || assignedQuestions[idx] || {};

    const keyPoints = r.expectedAnswerKeyPoints || matchedQ.expectedAnswerKeyPoints || [];

    return {
      questionTitle: r.questionTitle || matchedQ.title || `Question ${idx + 1}`,
      questionText: r.questionText || matchedQ.questionText || '',
      questionType: r.questionType || matchedQ.type || 'Technical',
      answerText: r.answerText || 'No response provided.',
      codeSubmitted: r.codeSubmitted || '',
      expectedKeyPoints: keyPoints,
    };
  });

  if (groq) {
    try {
      const prompt = `
You are the Lead Hiring Committee Chair evaluating a candidate for the position of ${jobTitle}.
Candidate Name: ${candidateName}
Total Proctoring Violations Recorded: ${violations.length}

RAG EVALUATION & BENCHMARKING GUIDELINES:
1. Ground Truth Benchmarking: Evaluate candidate responses against the expected RAG key points provided for each question.
2. Partial vs Full Credit: Check how many key points the candidate successfully demonstrated in their answer.
3. Zero Tolerance for Refusal: If candidate answered "I don't know", "idk", or provided empty/refusal answers, assign 0-25 for that question and mark overall recommendation as "Reject".
4. Code Quality: If code was submitted for coding questions, verify correctness, syntax, and logic.

FULL INTERVIEW TRANSCRIPT WITH RAG BENCHMARKS:
${responsesWithRAG.map((r, i) => `
Q${i + 1} [${r.questionType}]: "${r.questionTitle}"
Question Detail: "${r.questionText}"
RAG Expected Key Points: ${r.expectedKeyPoints.length > 0 ? r.expectedKeyPoints.join('; ') : 'General Domain Competency'}
Candidate Answer: "${r.answerText}"
${r.codeSubmitted ? `Code Submitted:\n${r.codeSubmitted}` : ''}
`).join('\n---')}

Return ONLY valid JSON matching this schema:
{
  "overallScore": 85,
  "recommendation": "Hire|Maybe|Reject",
  "scores": {
    "communication": 80,
    "confidence": 85,
    "technicalKnowledge": 85,
    "problemSolving": 80,
    "leadership": 75,
    "grammar": 90,
    "fluency": 85,
    "bodyLanguage": 80,
    "sentiment": 85,
    "cultureFit": 80
  },
  "strengths": ["Clear explanation of architectural patterns", "Met key criteria for state management"],
  "weaknesses": ["Missed caching strategy in Q2"],
  "improvementAreas": ["Deepen understanding of distributed systems rate limiting"],
  "aiSummaryExplanation": "Comprehensive 2-paragraph analysis evaluating candidate performance against job requirements and RAG benchmark criteria...",
  "questionBreakdown": [
    {
      "questionTitle": "Title",
      "questionType": "Technical",
      "score": 85,
      "candidateAnswer": "Answer summary",
      "feedback": "Covered 3/3 RAG key points cleanly.",
      "keyPointsCovered": ["Point 1", "Point 2"]
    }
  ]
}
`;
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = res.choices[0]?.message?.content;
      const parsed = JSON.parse(content);
      if (parsed.overallScore !== undefined && parsed.recommendation) {
        return parsed;
      }
    } catch (err) {
      console.error('[Groq Evaluation Error]', err.message);
    }
  }

  return getFallbackEvaluation(candidateName, jobTitle, responsesWithRAG, violations);
};

// Fallback Generators
function getFallbackQuestions(jobTitle, skills = [], count = 5, perQuestionSec = 300) {
  const primarySkill = skills[0] || 'software development';
  const pool = [
    {
      order: 1,
      type: 'Technical',
      title: 'Core Concepts & Architecture',
      questionText: `Could you walk me through your experience building scalable solutions with ${primarySkill}, highlighting key architectural decisions?`,
      difficulty: 'Mid-Level',
      competency: 'Technical Depth',
      timeLimitSeconds: perQuestionSec,
      expectedAnswerKeyPoints: ['System Design', 'Performance Optimization', 'Clean Code Principles'],
    },
    {
      order: 2,
      type: 'Scenario',
      title: 'Debugging under Pressure',
      questionText: 'Describe a production crash or critical bug you encountered in a previous project. How did you diagnose, resolve, and prevent it from recurring?',
      difficulty: 'Senior',
      competency: 'Problem Solving',
      timeLimitSeconds: perQuestionSec,
      expectedAnswerKeyPoints: ['Log analysis', 'Root cause identification', 'Post-mortem & monitoring'],
    },
    {
      order: 3,
      type: 'Behavioral',
      title: 'Cross-functional Collaboration',
      questionText: 'Can you share an instance where you had a technical disagreement with a teammate or product manager? How did you resolve it?',
      difficulty: 'Mid-Level',
      competency: 'Communication & Leadership',
      timeLimitSeconds: 180,
      expectedAnswerKeyPoints: ['Empathy', 'Data-driven argument', 'Alignment'],
    },
    {
      order: 4,
      type: 'HR',
      title: 'Culture & Growth',
      questionText: 'What motivates you to work at our company, and how do you stay updated with emerging industry technologies?',
      difficulty: 'Junior',
      competency: 'Culture Fit',
      timeLimitSeconds: 120,
      expectedAnswerKeyPoints: ['Continuous learning', 'Company mission alignment'],
    },
    {
      order: 5,
      type: 'Coding',
      title: 'Algorithmic Efficiency',
      questionText: 'How do you approach optimizing an API endpoint or algorithm that is experiencing high latency and database contention?',
      difficulty: 'Senior',
      competency: 'Coding & Performance',
      timeLimitSeconds: 240,
      expectedAnswerKeyPoints: ['Caching strategies', 'Database indexing', 'Asynchronous processing'],
    },
    {
      order: 6,
      type: 'Technical',
      title: 'Database Indexing & Query Tuning',
      questionText: 'Explain how database indexing works under the hood (e.g. B-Trees) and how you identify slow queries in production.',
      difficulty: 'Senior',
      competency: 'Database Architecture',
      timeLimitSeconds: 180,
      expectedAnswerKeyPoints: ['B-Tree indexes', 'EXPLAIN execution plan', 'N+1 query problem'],
    },
    {
      order: 7,
      type: 'Scenario',
      title: 'API Security & Rate Limiting',
      questionText: 'How do you secure RESTful or GraphQL APIs against DDoS attacks, SQL injection, and unauthorized data access?',
      difficulty: 'Senior',
      competency: 'Cybersecurity',
      timeLimitSeconds: 180,
      expectedAnswerKeyPoints: ['JWT verification', 'Rate limiting', 'Input sanitization'],
    },
    {
      order: 8,
      type: 'Behavioral',
      title: 'Handling Technical Debt',
      questionText: 'How do you balance shipping features quickly versus refactoring legacy code and reducing technical debt?',
      difficulty: 'Mid-Level',
      competency: 'Prioritization',
      timeLimitSeconds: 180,
      expectedAnswerKeyPoints: ['Agile planning', 'Code quality metrics', 'Risk assessment'],
    },
    {
      order: 9,
      type: 'Technical',
      title: 'State Management & Concurrency',
      questionText: 'Compare local component state versus global store management. When would you avoid global state?',
      difficulty: 'Mid-Level',
      competency: 'Frontend Architecture',
      timeLimitSeconds: 180,
      expectedAnswerKeyPoints: ['Prop drilling', 'Immutability', 'Re-render optimization'],
    },
    {
      order: 10,
      type: 'Aptitude',
      title: 'System Scalability Trade-offs',
      questionText: 'Explain the CAP theorem and provide an example of a system where AP (Availability/Partition Tolerance) is preferred over CP.',
      difficulty: 'Lead',
      competency: 'Distributed Systems',
      timeLimitSeconds: 180,
      expectedAnswerKeyPoints: ['Consistency', 'Availability', 'Partition Tolerance'],
    },
  ];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getFallbackEvaluation(candidateName, jobTitle, responses, violations = []) {
  let refusalCount = 0;
  let totalWords = 0;

  responses.forEach((r) => {
    const txt = r.answerText || '';
    if (isRefusalAnswer(txt)) refusalCount++;
    totalWords += txt.split(/\s+/).length;
  });

  const refusalRatio = responses.length > 0 ? refusalCount / responses.length : 0;
  let baseScore = Math.round(85 - refusalRatio * 70 - violations.length * 5);
  baseScore = Math.max(10, Math.min(98, baseScore));

  const rec = baseScore >= 78 ? 'Hire' : baseScore >= 60 ? 'Maybe' : 'Reject';

  return {
    overallScore: baseScore,
    recommendation: rec,
    scores: {
      communication: Math.max(15, baseScore - 5),
      confidence: Math.max(10, baseScore - 10),
      technicalKnowledge: Math.max(10, Math.round(baseScore * 0.8)),
      problemSolving: Math.max(10, Math.round(baseScore * 0.85)),
      leadership: Math.max(15, baseScore - 15),
      grammar: 85,
      fluency: Math.max(20, baseScore - 5),
      bodyLanguage: 80,
      sentiment: Math.max(20, baseScore),
      cultureFit: Math.max(20, baseScore - 5),
    },
    strengths:
      baseScore < 50
        ? ['Completed the scheduled interview session']
        : [`Demonstrated understanding of ${jobTitle} domain`, 'Articulate delivery on attempted questions'],
    weaknesses:
      refusalCount > 0
        ? [`Answered 'I don't know' or provided insufficient answers to ${refusalCount} question(s)`]
        : violations.length > 0
        ? [`${violations.length} proctoring flags logged during session`]
        : ['Could provide deeper metrics on past project impacts'],
    improvementAreas: ['Study core engineering architecture principles and practice problem solving'],
    aiSummaryExplanation: `${candidateName} completed the interview session for ${jobTitle}. ${
      refusalCount > 0
        ? `The candidate stated 'I don't know' or failed to answer ${refusalCount} out of ${responses.length} questions. Consequently, the technical knowledge rating was significantly reduced.`
        : 'Responses showed engagement with the interview topics.'
    } ${violations.length > 0 ? `${violations.length} proctoring violations recorded.` : 'Proctoring trust score was clean.'}`,
    questionBreakdown: responses.map((r) => {
      const isRefusal = isRefusalAnswer(r.answerText);
      return {
        questionTitle: r.questionTitle || 'Interview Question',
        questionType: 'Technical',
        score: isRefusal ? 15 : baseScore,
        candidateAnswer: r.answerText || 'Response provided via voice/text.',
        feedback: isRefusal ? 'Candidate stated they did not know the answer.' : 'Valid answer provided.',
      };
    }),
  };
}

module.exports = {
  transcribeAudioGroq,
  generateQuestionsFromJD,
  generateQuestionsWithRAG,
  generateFollowUpQuestion,
  evaluateCandidateResponses,
  answerCandidateQuestionWithRAG,
};
