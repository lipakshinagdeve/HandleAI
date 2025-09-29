import { Response } from 'express';
import { AuthRequest } from '../utils/types';
export declare const scrapeJobsFromPortal: (req: AuthRequest, res: Response) => Promise<void>;
export declare const searchJobs: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getJobDetails: (req: AuthRequest, res: Response) => Promise<void>;
export declare const applyToJob: (req: AuthRequest, res: Response) => Promise<void>;
export declare const startJobAutomation: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=jobController.d.ts.map