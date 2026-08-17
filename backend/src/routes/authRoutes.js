const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { registerCompany, login, getMe, updateUserProfile, refreshToken, forgotPassword, resetPassword, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', registerCompany);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateUserProfile);

module.exports = router;
