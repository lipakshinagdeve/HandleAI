"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobScrapingService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const cheerio = __importStar(require("cheerio"));
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
class JobScrapingService {
    constructor() {
        this.browser = null;
    }
    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer_1.default.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--window-size=1920,1080'
                ]
            });
        }
    }
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    async scrapeJobsFromUrl(portalUrl, userSkills = []) {
        try {
            const url = new URL(portalUrl);
            const domain = url.hostname.toLowerCase();
            if (domain.includes('linkedin.com')) {
                return await this.scrapeLinkedInJobs(portalUrl);
            }
            else if (domain.includes('indeed.com')) {
                return await this.scrapeIndeedJobs(portalUrl);
            }
            else if (domain.includes('naukri.com')) {
                return await this.scrapeNaukriJobs(portalUrl);
            }
            else if (domain.includes('glassdoor.com')) {
                return await this.scrapeGlassdoorJobs(portalUrl);
            }
            else {
                return await this.scrapeGenericJobs(portalUrl);
            }
        }
        catch (error) {
            console.error(`Error scraping jobs from ${portalUrl}:`, error);
            return [];
        }
    }
    async scrapeLinkedInJobs(url) {
        const jobs = [];
        await this.initBrowser();
        try {
            const page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            await page.goto(url, { waitUntil: 'networkidle2' });
            await (0, helpers_1.sleep)(constants_1.SCRAPING_CONFIG.DELAY_BETWEEN_REQUESTS);
            await page.waitForSelector('.job-search-card', { timeout: 10000 }).catch(() => { });
            const jobElements = await page.$$('.job-search-card');
            for (let i = 0; i < Math.min(jobElements.length, constants_1.SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL); i++) {
                try {
                    const jobData = await this.extractLinkedInJobData(page, jobElements[i]);
                    if (jobData) {
                        jobs.push(jobData);
                    }
                }
                catch (error) {
                    console.error('Error extracting LinkedIn job data:', error);
                }
            }
            await page.close();
        }
        catch (error) {
            console.error('Error scraping LinkedIn:', error);
        }
        return jobs;
    }
    async extractLinkedInJobData(page, element) {
        try {
            const title = await element.$eval('.job-search-card__title a', (el) => el.textContent?.trim()).catch(() => '') || '';
            const company = await element.$eval('.job-search-card__subtitle a', (el) => el.textContent?.trim()).catch(() => '') || '';
            const location = await element.$eval('.job-search-card__location', (el) => el.textContent?.trim()).catch(() => '') || '';
            const applicationUrl = await element.$eval('.job-search-card__title a', (el) => el.getAttribute('href')).catch(() => '') || '';
            if (!title || !company)
                return null;
            return {
                title,
                company,
                location,
                description: 'Job description available on LinkedIn',
                requirements: [],
                applicationUrl: applicationUrl.startsWith('http') ? applicationUrl : `https://linkedin.com${applicationUrl}`,
                sourcePortal: constants_1.SOURCE_PORTALS.LINKEDIN,
                skills: [],
                jobType: constants_1.JOB_TYPES.FULL_TIME,
                remote: location.toLowerCase().includes('remote'),
                experienceLevel: constants_1.EXPERIENCE_LEVELS.MID
            };
        }
        catch (error) {
            console.error('Error extracting LinkedIn job element:', error);
            return null;
        }
    }
    async scrapeIndeedJobs(url) {
        const jobs = [];
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: constants_1.SCRAPING_CONFIG.TIMEOUT
            });
            const $ = cheerio.load(response.data);
            const jobCards = $('.job_seen_beacon');
            const results = [];
            jobCards.each((index, element) => {
                if (index >= constants_1.SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL)
                    return false;
                const jobData = this.extractIndeedJobData($, element, url);
                if (jobData) {
                    results.push(jobData);
                }
                return undefined;
            });
            jobs.push(...results);
        }
        catch (error) {
            console.error('Error scraping Indeed:', error);
        }
        return jobs;
    }
    extractIndeedJobData($, element, baseUrl) {
        try {
            const titleElement = $(element).find('h2.jobTitle a');
            const companyElement = $(element).find('.companyName');
            const locationElement = $(element).find('.companyLocation');
            const title = titleElement.text().trim();
            const company = companyElement.text().trim();
            const location = locationElement.text().trim();
            if (!title || !company)
                return null;
            const href = titleElement.attr('href');
            const applicationUrl = href ? `https://indeed.com${href}` : baseUrl;
            return {
                title,
                company,
                location,
                description: 'Job description available on Indeed',
                requirements: [],
                applicationUrl,
                sourcePortal: constants_1.SOURCE_PORTALS.INDEED,
                skills: [],
                jobType: constants_1.JOB_TYPES.FULL_TIME,
                remote: location.toLowerCase().includes('remote'),
                experienceLevel: constants_1.EXPERIENCE_LEVELS.MID
            };
        }
        catch (error) {
            console.error('Error extracting Indeed job data:', error);
            return null;
        }
    }
    async scrapeNaukriJobs(url) {
        const jobs = [];
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: constants_1.SCRAPING_CONFIG.TIMEOUT
            });
            const $ = cheerio.load(response.data);
            const jobCards = $('.jobTuple');
            const results = [];
            jobCards.each((index, element) => {
                if (index >= constants_1.SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL)
                    return false;
                const jobData = this.extractNaukriJobData($, element);
                if (jobData) {
                    results.push(jobData);
                }
                return undefined;
            });
            jobs.push(...results);
        }
        catch (error) {
            console.error('Error scraping Naukri:', error);
        }
        return jobs;
    }
    extractNaukriJobData($, element) {
        try {
            const titleElement = $(element).find('.title');
            const companyElement = $(element).find('.subTitle');
            const locationElement = $(element).find('.locationsContainer');
            const title = titleElement.text().trim();
            const company = companyElement.text().trim();
            const location = locationElement.text().trim() || 'Not specified';
            if (!title || !company)
                return null;
            const href = titleElement.attr('href');
            const applicationUrl = href ? `https://naukri.com${href}` : '';
            return {
                title,
                company,
                location,
                description: 'Job description available on Naukri',
                requirements: [],
                applicationUrl,
                sourcePortal: constants_1.SOURCE_PORTALS.NAUKRI,
                skills: [],
                jobType: constants_1.JOB_TYPES.FULL_TIME,
                remote: false,
                experienceLevel: constants_1.EXPERIENCE_LEVELS.MID
            };
        }
        catch (error) {
            console.error('Error extracting Naukri job data:', error);
            return null;
        }
    }
    async scrapeGlassdoorJobs(url) {
        const jobs = [];
        await this.initBrowser();
        try {
            const page = await this.browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            await (0, helpers_1.sleep)(constants_1.SCRAPING_CONFIG.DELAY_BETWEEN_REQUESTS);
            const jobElements = await page.$$('.react-job-listing');
            for (let i = 0; i < Math.min(jobElements.length, constants_1.SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL); i++) {
                try {
                    const jobData = await this.extractGlassdoorJobData(page, jobElements[i]);
                    if (jobData) {
                        jobs.push(jobData);
                    }
                }
                catch (error) {
                    console.error('Error extracting Glassdoor job data:', error);
                }
            }
            await page.close();
        }
        catch (error) {
            console.error('Error scraping Glassdoor:', error);
        }
        return jobs;
    }
    async extractGlassdoorJobData(page, element) {
        try {
            const title = await element.$eval('.jobLink', (el) => el.textContent?.trim()).catch(() => '') || '';
            const company = await element.$eval('.employerName', (el) => el.textContent?.trim()).catch(() => '') || '';
            const location = await element.$eval('.loc', (el) => el.textContent?.trim()).catch(() => '') || '';
            const applicationUrl = await element.$eval('.jobLink', (el) => el.getAttribute('href')).catch(() => '') || '';
            if (!title || !company)
                return null;
            return {
                title,
                company,
                location,
                description: 'Job description available on Glassdoor',
                requirements: [],
                applicationUrl,
                sourcePortal: constants_1.SOURCE_PORTALS.GLASSDOOR,
                skills: [],
                jobType: constants_1.JOB_TYPES.FULL_TIME,
                remote: location.toLowerCase().includes('remote'),
                experienceLevel: constants_1.EXPERIENCE_LEVELS.MID
            };
        }
        catch (error) {
            console.error('Error extracting Glassdoor job element:', error);
            return null;
        }
    }
    async scrapeGenericJobs(url) {
        const jobs = [];
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: constants_1.SCRAPING_CONFIG.TIMEOUT
            });
            const $ = cheerio.load(response.data);
            const jobElements = $('[class*="job"], [class*="position"], [class*="vacancy"], [class*="opening"], [class*="career"]');
            const results = [];
            jobElements.each((index, element) => {
                if (index >= constants_1.SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL)
                    return false;
                const jobData = this.extractGenericJobData($, element, url);
                if (jobData) {
                    results.push(jobData);
                }
                return undefined;
            });
            jobs.push(...results);
        }
        catch (error) {
            console.error('Error scraping generic jobs:', error);
        }
        return jobs;
    }
    extractGenericJobData($, element, baseUrl) {
        try {
            const title = this.findTextByKeywords($, element, ['title', 'heading', 'job', 'position']);
            const company = this.findTextByKeywords($, element, ['company', 'employer', 'organization']);
            const location = this.findTextByKeywords($, element, ['location', 'city', 'address']);
            if (!title)
                return null;
            const linkElement = $(element).find('a').first();
            let applicationUrl = linkElement.attr('href') || baseUrl;
            if (applicationUrl.startsWith('/')) {
                const urlObj = new URL(baseUrl);
                applicationUrl = `${urlObj.protocol}//${urlObj.host}${applicationUrl}`;
            }
            return {
                title: title.substring(0, 100),
                company: company?.substring(0, 100) || 'Company not specified',
                location: location?.substring(0, 100) || 'Location not specified',
                description: 'Job description available on portal',
                requirements: [],
                applicationUrl,
                sourcePortal: constants_1.SOURCE_PORTALS.OTHER,
                skills: [],
                jobType: constants_1.JOB_TYPES.FULL_TIME,
                remote: false,
                experienceLevel: constants_1.EXPERIENCE_LEVELS.MID
            };
        }
        catch (error) {
            console.error('Error extracting generic job data:', error);
            return null;
        }
    }
    findTextByKeywords($, element, keywords) {
        for (const keyword of keywords) {
            const byClass = $(element).find(`[class*="${keyword}"]`).first().text().trim();
            if (byClass)
                return byClass;
            const byId = $(element).find(`[id*="${keyword}"]`).first().text().trim();
            if (byId)
                return byId;
        }
        return null;
    }
}
exports.JobScrapingService = JobScrapingService;
//# sourceMappingURL=jobScrapingService.js.map