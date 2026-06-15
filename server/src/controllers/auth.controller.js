const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      school: config.SCHOOL_ID,
      studentProfile: user.studentProfile || undefined,
    },
    config.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Hash refresh token and store in user
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    user.lastLogin = new Date();
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentProfile: user.studentProfile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalid or expired',
      });
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token reuse or invalid',
      });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Hash new refresh token and update database
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, salt);
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.sub);
        if (user) {
          user.refreshTokenHash = undefined;
          await user.save();
        }
      } catch (err) {
        // Token invalid/expired; ignore and proceed with clearing cookie
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/api/v1/auth',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refresh,
  logout,
};
