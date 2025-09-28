"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    res.send('Users route');
});
router.delete('/account', auth_1.protect, authController_1.deleteAccount);
exports.default = router;
//# sourceMappingURL=users.js.map