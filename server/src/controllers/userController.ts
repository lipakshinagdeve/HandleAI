import { Response } from 'express';
import { supabaseAdmin } from '@config/supabase';
import { AuthRequest } from '@utils/types';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@utils/constants';
import { calculatePagination } from '@utils/helpers';

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone, skills } = req.body;
    const userId = req.user!.id;

    const fieldsToUpdate: any = {};
    if (firstName) fieldsToUpdate.firstName = firstName;
    if (lastName) fieldsToUpdate.lastName = lastName;
    if (phone) fieldsToUpdate.phone = phone;
    if (skills) fieldsToUpdate.skills = skills;

    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .update(fieldsToUpdate)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.PROFILE_UPDATED,
      user
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const updateJobPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobTypes, locations, salaryRange, remoteWork } = req.body;
    const userId = req.user!.id;

    const jobPreferences = {
      jobTypes: jobTypes || [],
      locations: locations || [],
      salaryRange: salaryRange || { min: 0, max: 0 },
      remoteWork: remoteWork || false
    };

    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ jobPreferences })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Job preferences updated successfully',
      jobPreferences: user.jobPreferences
    });
  } catch (error: any) {
    console.error('Update preferences error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get total applications count
    const { count: totalApplications } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);

    // Get successful applications count
    const { count: successfulApplications } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .in('status', ['interview', 'accepted']);

    // Get pending applications count
    const { count: pendingApplications } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('status', 'pending');

    // Get recent applications
    const { data: recentApplications } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        job:jobs(title, company, location)
      `)
      .eq('userId', userId)
      .order('appliedDate', { ascending: false })
      .limit(10);

    // Calculate success rate
    const successRate = totalApplications && totalApplications > 0 ?
      Math.round(((successfulApplications || 0) / totalApplications) * 100) : 0;

    // Get applications by status
    const { data: applicationsByStatusData } = await supabaseAdmin
      .from('applications')
      .select('status')
      .eq('userId', userId);

    const statusCounts: { [key: string]: number } = {
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

    res.status(HTTP_STATUS.OK).json({
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
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const getUserApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('applications')
      .select(`
        *,
        job:jobs(id, title, company, location, jobType)
      `, { count: 'exact' })
      .eq('userId', req.user!.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, count, error } = await query
      .order('appliedDate', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
      return;
    }

    const pagination = calculatePagination(page, limit, count || 0);

    res.status(HTTP_STATUS.OK).json({
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
  } catch (error: any) {
    console.error('Get applications error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { confirmDelete } = req.body;
    const userId = req.user!.id;

    if (!confirmDelete || confirmDelete !== 'DELETE') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Please confirm account deletion by sending confirmDelete: "DELETE"'
      });
      return;
    }

    // Delete all user's applications
    await supabaseAdmin
      .from('applications')
      .delete()
      .eq('userId', userId);

    // Delete user profile
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(userId);

    // Clear cookie
    res.clearCookie('token');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};