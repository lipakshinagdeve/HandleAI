import { ScrapedJobData } from '../utils/types';
export declare class JobScrapingService {
    private browser;
    initBrowser(): Promise<void>;
    closeBrowser(): Promise<void>;
    scrapeJobsFromUrl(portalUrl: string, userSkills?: string[]): Promise<ScrapedJobData[]>;
    private scrapeLinkedInJobs;
    private extractLinkedInJobData;
    private scrapeIndeedJobs;
    private extractIndeedJobData;
    private scrapeNaukriJobs;
    private extractNaukriJobData;
    private scrapeGlassdoorJobs;
    private extractGlassdoorJobData;
    private scrapeGenericJobs;
    private extractGenericJobData;
    private findTextByKeywords;
}
//# sourceMappingURL=jobScrapingService.d.ts.map