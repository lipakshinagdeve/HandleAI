"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.post('/register', validation_1.validateRegister, authController_1.register);
router.post('/login', validation_1.validateLogin, authController_1.login);
router.post('/logout', authController_1.logout);
router.get('/me', auth_1.protect, authController_1.getMe);
router.put('/updatepassword', auth_1.protect, authController_1.updatePassword);
router.post('/verify', auth_1.protect, authController_1.verifyToken);
router.get('/confirm-email', authController_1.confirmEmail);
router.post('/test', (req, res) => {
    console.log('Test endpoint hit:', req.body);
    res.json({ success: true, message: 'Test endpoint working', body: req.body });
});
exports.default = router;
//# sourceMappingURL=auth.js.map