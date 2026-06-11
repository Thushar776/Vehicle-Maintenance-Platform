const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

router.post(
  '/register',
  [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').notEmpty(),
    validate,
  ],
  login
);

router.post('/refresh', refresh);

router.post('/logout', protect, logout);

router.get('/me', protect, getMe);

router.put(
  '/me',
  [
    body('email', 'Please include a valid email').optional().isEmail(),
    body('name', 'Name cannot be empty').optional().notEmpty(),
    validate,
  ],
  protect,
  updateMe
);

router.put(
  '/changepassword',
  [
    body('currentPassword', 'Current password is required').notEmpty(),
    body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 }),
    validate,
  ],
  protect,
  changePassword
);

router.post(
  '/forgotpassword',
  [body('email', 'Please include a valid email').isEmail(), validate],
  forgotPassword
);

router.put(
  '/resetpassword/:resettoken',
  [body('password', 'Password must be 6 or more characters').isLength({ min: 6 }), validate],
  resetPassword
);

module.exports = router;
