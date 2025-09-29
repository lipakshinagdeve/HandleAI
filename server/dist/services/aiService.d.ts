import { IJob, IUser, OptimizationSuggestion } from '../utils/types';
export declare class AIService {
    generateCoverLetter(job: IJob, user: IUser): Promise<string>;
    answerJobQuestion(question: string, job: IJob, user: IUser): Promise<string>;
    generateCustomAnswers(questions: string[], job: IJob, user: IUser): Promise<Array<{
        question: string;
        answer: string;
    }>>;
    optimizeApplication(job: IJob, user: IUser): Promise<OptimizationSuggestion>;
    private generateFallbackCoverLetter;
    private generateFallbackAnswer;
    private generateFallbackOptimization;
}
//# sourceMappingURL=aiService.d.ts.map