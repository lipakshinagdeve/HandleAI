"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../controllers/jobController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.post('/scrape', validation_1.validateJobPortal, jobController_1.scrapeJobsFromPortal);
router.get('/search', jobController_1.searchJobs);
router.get('/:jobId', jobController_1.getJobDetails);
router.post('/apply/:jobId', jobController_1.applyToJob);
router.post('/automate', jobController_1.startJobAutomation);
exports.default = router;
//# sourceMappingURL=jobs.js.map