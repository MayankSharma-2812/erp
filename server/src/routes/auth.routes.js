const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
