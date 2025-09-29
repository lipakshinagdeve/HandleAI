import { Request, Response, NextFunction } from 'express';
interface ErrorWithStatus extends Error {
    statusCode?: number;
    code?: number;
    errors?: any;
}
declare const errorHandler: (err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map