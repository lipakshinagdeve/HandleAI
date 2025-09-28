import { Response, NextFunction } from 'express';
import { AuthRequest } from '../utils/types';
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optional: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map