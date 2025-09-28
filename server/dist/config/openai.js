"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const environment_1 = require("./environment");
const openai = new openai_1.default({
    apiKey: environment_1.config.openaiApiKey,
});
exports.default = openai;
//# sourceMappingURL=openai.js.map