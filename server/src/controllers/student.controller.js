const Student = require('../models/Student');

const getStudents = async (req, res, next) => {
  try {
    const { classId, section, session, status } = req.query;
    const query = {};

    if (req.user && req.user.role === 'student') {
      query._id = req.user.studentProfile;
    } else {
      if (classId) query.class = classId;
      if (section) query.section = section;
      if (session) query.session = session;
      if (status) query.status = status;
    }

    const students = await Student.find(query).populate('class').sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'student' && req.params.id !== req.user.studentProfile?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Students can only access their own student profile',
      });
    }

    const student = await Student.findById(req.params.id).populate('class');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    return res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
