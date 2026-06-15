const User = require('../models/User');

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-passwordHash -refreshTokenHash');
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-passwordHash -refreshTokenHash');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUser,
};
