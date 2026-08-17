const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const setupSocket = require('./services/socketService');
const errorHandler = require('./middlewares/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const questionRoutes = require('./routes/questionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');

const app = express();
const server = http.createServer(app);

// Connect DB
connectDB();

// Setup Realtime Proctoring Sockets
const io = setupSocket(server);
app.set('io', io);

// Middleware
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS: Origin not allowed'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'SmartyHire AI Engine',
    timestamp: new Date(),
    aiEngine: process.env.GROQ_API_KEY ? 'SmartyHire Neural Engine (Active)' : 'SmartyHire AI Engine (Ready)',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SmartyHire AI Backend API running on port ${PORT}`);
  console.log(`📡 Socket.io Proctoring Live Server Ready`);
  console.log(`⚡ SmartyHire Neural AI Engine Loaded`);
  console.log(`====================================================`);
});
