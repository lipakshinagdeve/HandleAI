import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScrapedJobData } from '../utils/types';
import { SOURCE_PORTALS, JOB_TYPES, EXPERIENCE_LEVELS, SCRAPING_CONFIG } from '../utils/constants';
import { sleep } from '../utils/helpers';

export class JobScrapingService {
  private browser: Browser | null = null;

  async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
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

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeJobsFromUrl(portalUrl: string, userSkills: string[] = []): Promise<ScrapedJobData[]> {
    try {
      const url = new URL(portalUrl);
      const domain = url.hostname.toLowerCase();

      if (domain.includes('linkedin.com')) {
        return await this.scrapeLinkedInJobs(portalUrl);
      } else if (domain.includes('indeed.com')) {
        return await this.scrapeIndeedJobs(portalUrl);
      } else if (domain.includes('naukri.com')) {
        return await this.scrapeNaukriJobs(portalUrl);
      } else if (domain.includes('glassdoor.com')) {
        return await this.scrapeGlassdoorJobs(portalUrl);
      } else {
        return await this.scrapeGenericJobs(portalUrl);
      }
    } catch (error) {
      console.error(`Error scraping jobs from ${portalUrl}:`, error);
      return [];
    }
  }

  private async scrapeLinkedInJobs(url: string): Promise<ScrapedJobData[]> {
    const jobs: ScrapedJobData[] = [];
    await this.initBrowser();

    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      await sleep(SCRAPING_CONFIG.DELAY_BETWEEN_REQUESTS);

      // Wait for job listings to load
      await page.waitForSelector('.job-search-card', { timeout: 10000 }).catch(() => {});

      const jobElements = await page.$$('.job-search-card');
      
      for (let i = 0; i < Math.min(jobElements.length, SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL); i++) {
        try {
          const jobData = await this.extractLinkedInJobData(page, jobElements[i]);
          if (jobData) {
            jobs.push(jobData);
          }
        } catch (error) {
          console.error('Error extracting LinkedIn job data:', error);
        }
      }

      await page.close();
    } catch (error) {
      console.error('Error scraping LinkedIn:', error);
    }

    return jobs;
  }

  private async extractLinkedInJobData(page: Page, element: any): Promise<ScrapedJobData | null> {
    try {
      const title = await element.$eval('.job-search-card__title a', (el: HTMLElement) => el.textContent?.trim()).catch(() => '') || '';
      const company = await element.$eval('.job-search-card__subtitle a', (el: HTMLElement) => el.textContent?.trim()).catch(() => '') || '';
      const location = await element.$eval('.job-search-card__location', (el: HTMLElement) => el.textContent?.trim()).catch(() => '') || '';
      const applicationUrl = await element.$eval('.job-search-card__title a', (el: HTMLAnchorElement) => el.getAttribute('href')).catch(() => '') || '';

      if (!title || !company) return null;

      return {
        title,
        company,
        location,
        description: 'Job description available on LinkedIn',
        requirements: [],
        applicationUrl: applicationUrl.startsWith('http') ? applicationUrl : `https://linkedin.com${applicationUrl}`,
        sourcePortal: SOURCE_PORTALS.LINKEDIN,
        skills: [],
        jobType: JOB_TYPES.FULL_TIME,
        remote: location.toLowerCase().includes('remote'),
        experienceLevel: EXPERIENCE_LEVELS.MID
      };
    } catch (error) {
      console.error('Error extracting LinkedIn job element:', error);
      return null;
    }
  }

  private async scrapeIndeedJobs(url: string): Promise<ScrapedJobData[]> {
    const jobs: ScrapedJobData[] = [];

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: SCRAPING_CONFIG.TIMEOUT
      });

      const $ = cheerio.load(response.data);
      const jobCards = $('.job_seen_beacon');

      const results: ScrapedJobData[] = [];
      jobCards.each((index, element) => {
        if (index >= SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL) return false;

        const jobData = this.extractIndeedJobData($, element, url);
        if (jobData) {
          results.push(jobData);
        }
        return undefined;
      });

      jobs.push(...results);
    } catch (error) {
      console.error('Error scraping Indeed:', error);
    }

    return jobs;
  }

  private extractIndeedJobData($: cheerio.Root, element: cheerio.Element, baseUrl: string): ScrapedJobData | null {
    try {
      const titleElement = $(element).find('h2.jobTitle a');
      const companyElement = $(element).find('.companyName');
      const locationElement = $(element).find('.companyLocation');

      const title = titleElement.text().trim();
      const company = companyElement.text().trim();
      const location = locationElement.text().trim();

      if (!title || !company) return null;

      const href = titleElement.attr('href');
      const applicationUrl = href ? `https://indeed.com${href}` : baseUrl;

      return {
        title,
        company,
        location,
        description: 'Job description available on Indeed',
        requirements: [],
        applicationUrl,
        sourcePortal: SOURCE_PORTALS.INDEED,
        skills: [],
        jobType: JOB_TYPES.FULL_TIME,
        remote: location.toLowerCase().includes('remote'),
        experienceLevel: EXPERIENCE_LEVELS.MID
      };
    } catch (error) {
      console.error('Error extracting Indeed job data:', error);
      return null;
    }
  }

  private async scrapeNaukriJobs(url: string): Promise<ScrapedJobData[]> {
    const jobs: ScrapedJobData[] = [];

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: SCRAPING_CONFIG.TIMEOUT
      });

      const $ = cheerio.load(response.data);
      const jobCards = $('.jobTuple');

      const results: ScrapedJobData[] = [];
      jobCards.each((index, element) => {
        if (index >= SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL) return false;

        const jobData = this.extractNaukriJobData($, element);
        if (jobData) {
          results.push(jobData);
        }
        return undefined;
      });

      jobs.push(...results);
    } catch (error) {
      console.error('Error scraping Naukri:', error);
    }

    return jobs;
  }

  private extractNaukriJobData($: cheerio.Root, element: cheerio.Element): ScrapedJobData | null {
    try {
      const titleElement = $(element).find('.title');
      const companyElement = $(element).find('.subTitle');
      const locationElement = $(element).find('.locationsContainer');

      const title = titleElement.text().trim();
      const company = companyElement.text().trim();
      const location = locationElement.text().trim() || 'Not specified';

      if (!title || !company) return null;

      const href = titleElement.attr('href');
      const applicationUrl = href ? `https://naukri.com${href}` : '';

      return {
        title,
        company,
        location,
        description: 'Job description available on Naukri',
        requirements: [],
        applicationUrl,
        sourcePortal: SOURCE_PORTALS.NAUKRI,
        skills: [],
        jobType: JOB_TYPES.FULL_TIME,
        remote: false,
        experienceLevel: EXPERIENCE_LEVELS.MID
      };
    } catch (error) {
      console.error('Error extracting Naukri job data:', error);
      return null;
    }
  }

  private async scrapeGlassdoorJobs(url: string): Promise<ScrapedJobData[]> {
    const jobs: ScrapedJobData[] = [];
    await this.initBrowser();

    try {
      const page = await this.browser!.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      await sleep(SCRAPING_CONFIG.DELAY_BETWEEN_REQUESTS);

      const jobElements = await page.$$('.react-job-listing');

      for (let i = 0; i < Math.min(jobElements.length, SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL); i++) {
        try {
          const jobData = await this.extractGlassdoorJobData(page, jobElements[i]);
          if (jobData) {
            jobs.push(jobData);
          }
        } catch (error) {
          console.error('Error extracting Glassdoor job data:', error);
        }
      }

      await page.close();
    } catch (error) {
      console.error('Error scraping Glassdoor:', error);
    }

    return jobs;
  }

  private async extractGlassdoorJobData(page: Page, element: any): Promise<ScrapedJobData | null> {
    try {
      const title = await element.$eval('.jobLink', (el: HTMLElement) => el.textContent?.trim()).catch(() => '') || '';
      const company = await element.$eval('.employerName', (el: HTMLElement) => el.textContent?.trim()).catch(() => '') || '';
      const location = await element.$eval('.loc', (el: HTMLElement) => el.textContent?.trim()).catch(() => '') || '';
      const applicationUrl = await element.$eval('.jobLink', (el: HTMLAnchorElement) => el.getAttribute('href')).catch(() => '') || '';

      if (!title || !company) return null;

      return {
        title,
        company,
        location,
        description: 'Job description available on Glassdoor',
        requirements: [],
        applicationUrl,
        sourcePortal: SOURCE_PORTALS.GLASSDOOR,
        skills: [],
        jobType: JOB_TYPES.FULL_TIME,
        remote: location.toLowerCase().includes('remote'),
        experienceLevel: EXPERIENCE_LEVELS.MID
      };
    } catch (error) {
      console.error('Error extracting Glassdoor job element:', error);
      return null;
    }
  }

  private async scrapeGenericJobs(url: string): Promise<ScrapedJobData[]> {
    const jobs: ScrapedJobData[] = [];

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: SCRAPING_CONFIG.TIMEOUT
      });

      const $ = cheerio.load(response.data);
      
      // Try to find common job-related elements
      const jobElements = $('[class*="job"], [class*="position"], [class*="vacancy"], [class*="opening"], [class*="career"]');
      
      const results: ScrapedJobData[] = [];
      jobElements.each((index, element) => {
        if (index >= SCRAPING_CONFIG.MAX_JOBS_PER_PORTAL) return false;

        const jobData = this.extractGenericJobData($, element, url);
        if (jobData) {
          results.push(jobData);
        }
        return undefined;
      });

      jobs.push(...results);
    } catch (error) {
      console.error('Error scraping generic jobs:', error);
    }

    return jobs;
  }

  private extractGenericJobData($: cheerio.Root, element: cheerio.Element, baseUrl: string): ScrapedJobData | null {
    try {
      const title = this.findTextByKeywords($, element, ['title', 'heading', 'job', 'position']);
      const company = this.findTextByKeywords($, element, ['company', 'employer', 'organization']);
      const location = this.findTextByKeywords($, element, ['location', 'city', 'address']);

      if (!title) return null;

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
        sourcePortal: SOURCE_PORTALS.OTHER,
        skills: [],
        jobType: JOB_TYPES.FULL_TIME,
        remote: false,
        experienceLevel: EXPERIENCE_LEVELS.MID
      };
    } catch (error) {
      console.error('Error extracting generic job data:', error);
      return null;
    }
  }

  private findTextByKeywords($: cheerio.Root, element: cheerio.Element, keywords: string[]): string | null {
    for (const keyword of keywords) {
      // Search by class
      const byClass = $(element).find(`[class*="${keyword}"]`).first().text().trim();
      if (byClass) return byClass;
      
      // Search by id
      const byId = $(element).find(`[id*="${keyword}"]`).first().text().trim();
      if (byId) return byId;
    }
    return null;
  }
}