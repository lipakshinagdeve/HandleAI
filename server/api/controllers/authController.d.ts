import { Request, Response } from 'express';
import { AuthRequest } from '../utils/types';
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const logout: (req: Request, res: Response) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePassword: (req: AuthRequest, res: Response) => Promise<void>;
export declare const verifyToken: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteAccount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const confirmEmail: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map