"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiController_1 = require("../controllers/aiController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.post('/cover-letter', aiController_1.generateCoverLetter);
router.post('/answer-question', aiController_1.answerJobQuestion);
router.post('/answer-multiple-questions', aiController_1.answerMultipleQuestions);
router.post('/optimize-application', aiController_1.optimizeApplication);
router.get('/suggestions', aiController_1.getAISuggestions);
exports.default = router;
//# sourceMappingURL=ai.js.map