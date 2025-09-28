"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.getUserApplications = exports.getDashboardStats = exports.updateJobPreferences = exports.updateProfile = void 0;
const supabase_1 = require("../config/supabase");
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, skills } = req.body;
        const userId = req.user.id;
        const fieldsToUpdate = {};
        if (firstName)
            fieldsToUpdate.firstName = firstName;
        if (lastName)
            fieldsToUpdate.lastName = lastName;
        if (phone)
            fieldsToUpdate.phone = phone;
        if (skills)
            fieldsToUpdate.skills = skills;
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('user_profiles')
            .update(fieldsToUpdate)
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: error.message
            });
            return;
        }
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: constants_1.SUCCESS_MESSAGES.PROFILE_UPDATED,
            user
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.updateProfile = updateProfile;
const updateJobPreferences = async (req, res) => {
    try {
        const { jobTypes, locations, salaryRange, remoteWork } = req.body;
        const userId = req.user.id;
        const jobPreferences = {
            jobTypes: jobTypes || [],
            locations: locations || [],
            salaryRange: salaryRange || { min: 0, max: 0 },
            remoteWork: remoteWork || false
        };
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('user_profiles')
            .update({ jobPreferences })
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: error.message
            });
            return;
        }
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Job preferences updated successfully',
            jobPreferences: user.jobPreferences
        });
    }
    catch (error) {
        console.error('Update preferences error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.updateJobPreferences = updateJobPreferences;
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { count: totalApplications } = await supabase_1.supabaseAdmin
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('userId', userId);
        const { count: successfulApplications } = await supabase_1.supabaseAdmin
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('userId', userId)
            .in('status', ['interview', 'accepted']);
        const { count: pendingApplications } = await supabase_1.supabaseAdmin
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('userId', userId)
            .eq('status', 'pending');
        const { data: recentApplications } = await supabase_1.supabaseAdmin
            .from('applications')
            .select(`
        *,
        job:jobs(title, company, location)
      `)
            .eq('userId', userId)
            .order('appliedDate', { ascending: false })
            .limit(10);
        const successRate = totalApplications && totalApplications > 0 ?
            Math.round(((successfulApplications || 0) / totalApplications) * 100) : 0;
        const { data: applicationsByStatusData } = await supabase_1.supabaseAdmin
            .from('applications')
            .select('status')
            .eq('userId', userId);
        const statusCounts = {
            'pending': 0,
            'applied': 0,
            'reviewing': 0,
            'interview': 0,
            'rejected': 0,
            'accepted': 0
        };
        applicationsByStatusData?.forEach(app => {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
        });
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            stats: {
                totalApplications: totalApplications || 0,
                successfulApplications: successfulApplications || 0,
                pendingApplications: pendingApplications || 0,
                successRate,
                applicationsByStatus: statusCounts,
                recentApplications: recentApplications?.map(app => ({
                    id: app.id,
                    jobTitle: app.job?.title || 'Unknown',
                    company: app.job?.company || 'Unknown',
                    status: app.status,
                    appliedDate: app.appliedDate,
                    applicationMethod: app.applicationMethod
                })) || []
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.getDashboardStats = getDashboardStats;
const getUserApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const offset = (page - 1) * limit;
        let query = supabase_1.supabaseAdmin
            .from('applications')
            .select(`
        *,
        job:jobs(id, title, company, location, jobType)
      `, { count: 'exact' })
            .eq('userId', req.user.id);
        if (status) {
            query = query.eq('status', status);
        }
        const { data: applications, count, error } = await query
            .order('appliedDate', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: error.message
            });
            return;
        }
        const pagination = (0, helpers_1.calculatePagination)(page, limit, count || 0);
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            count: applications?.length || 0,
            total: count || 0,
            pagination,
            applications: applications?.map(app => ({
                id: app.id,
                status: app.status,
                appliedDate: app.appliedDate,
                applicationMethod: app.applicationMethod,
                responseReceived: app.responseReceived,
                job: app.job
            })) || []
        });
    }
    catch (error) {
        console.error('Get applications error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.getUserApplications = getUserApplications;
const deleteAccount = async (req, res) => {
    try {
        const { confirmDelete } = req.body;
        const userId = req.user.id;
        if (!confirmDelete || confirmDelete !== 'DELETE') {
            res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Please confirm account deletion by sending confirmDelete: "DELETE"'
            });
            return;
        }
        await supabase_1.supabaseAdmin
            .from('applications')
            .delete()
            .eq('userId', userId);
        await supabase_1.supabaseAdmin
            .from('user_profiles')
            .delete()
            .eq('id', userId);
        await supabase_1.supabaseAdmin.auth.admin.deleteUser(userId);
        res.clearCookie('token');
        res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Account deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: constants_1.ERROR_MESSAGES.SERVER_ERROR
        });
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=userController.js.map