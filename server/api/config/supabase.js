"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const environment_1 = require("./environment");
exports.supabase = (0, supabase_js_1.createClient)(environment_1.config.supabaseUrl, environment_1.config.supabaseAnonKey);
exports.supabaseAdmin = (0, supabase_js_1.createClient)(environment_1.config.supabaseUrl, environment_1.config.supabaseServiceRoleKey);
exports.default = exports.supabase;
//# sourceMappingURL=supabase.js.map