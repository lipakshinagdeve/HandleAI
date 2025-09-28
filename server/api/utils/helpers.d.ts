import { IUser } from './types';
import { Response } from 'express';
export declare const generateToken: (payload: object) => string;
export declare const sendTokenResponse: (user: IUser, statusCode: number, res: Response) => void;
export declare const calculatePagination: (page: number | undefined, limit: number | undefined, total: number) => {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
};
export declare const isValidEmail: (email: string) => boolean;
export declare const generateRandomString: (length?: number) => string;
export declare const formatErrorMessage: (error: any) => string;
export declare const sleep: (ms: number) => Promise<void>;
//# sourceMappingURL=helpers.d.ts.map