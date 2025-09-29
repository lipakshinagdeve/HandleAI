export declare const generateConfirmationToken: () => string;
export declare const storeConfirmationToken: (userId: string, token: string) => Promise<boolean>;
export declare const verifyConfirmationToken: (token: string) => Promise<string | null>;
//# sourceMappingURL=emailToken.d.ts.map