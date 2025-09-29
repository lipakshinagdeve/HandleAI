import { Response } from 'express';
import { AuthRequest } from '../utils/types';
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateJobPreferences: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDashboardStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUserApplications: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteAccount: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map