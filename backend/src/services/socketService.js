const socketIO = require('socket.io');
const Violation = require('../models/Violation');

const setupSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // Join candidate specific room or company live monitoring room
    socket.on('join_session', ({ candidateId, companyId, isProctor }) => {
      if (candidateId) {
        socket.join(`candidate_${candidateId}`);
        console.log(`[Socket] Candidate ${candidateId} joined session room.`);
      }
      if (companyId && isProctor) {
        socket.join(`company_proctor_${companyId}`);
        console.log(`[Socket] HR/Proctor joined live monitor room for company ${companyId}.`);
      }
    });

    // Proctoring event triggered by candidate browser
    socket.on('proctor_violation', async (data) => {
      const { candidateId, interviewId, companyId, type, details, severity } = data;
      console.warn(`[Proctor Warning] Candidate ${candidateId}: ${type}`);

      try {
        if (candidateId && companyId) {
          const violation = await Violation.create({
            candidateId,
            interviewId,
            companyId,
            type,
            details: details || `Automatic trigger: ${type}`,
            severity: severity || 'medium',
          });

          // Broadcast violation in real-time to HR live proctor room
          io.to(`company_proctor_${companyId}`).emit('live_violation_alert', {
            candidateId,
            violation,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        console.error('[Proctor Socket Error]', err.message);
      }
    });

    // Realtime Candidate Transcript / Answer Stream
    socket.on('live_transcript_chunk', (data) => {
      const { companyId, candidateId, text, questionIndex } = data;
      io.to(`company_proctor_${companyId}`).emit('live_candidate_transcript', {
        candidateId,
        text,
        questionIndex,
      });
    });

    // Candidate Status Update (Started, Question 2/5, Completed)
    socket.on('candidate_status_change', (data) => {
      const { companyId, candidateId, status, currentQuestion } = data;
      io.to(`company_proctor_${companyId}`).emit('candidate_status_update', {
        candidateId,
        status,
        currentQuestion,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] ID: ${socket.id}`);
    });
  });

  return io;
};

module.exports = setupSocket;
