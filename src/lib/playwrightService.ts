import { chromium, Browser, Page } from 'playwright';
import { existsSync } from 'fs';
import { join } from 'path';
import { JobFormField } from './groqService';

function findChromiumExecutable(): string | undefined {
  const searchRoots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    '/opt/render/.cache/ms-playwright',
    join(process.env.HOME || '/opt/render', '.cache', 'ms-playwright'),
    join(process.cwd(), 'playwright-browsers'),
  ].filter(Boolean) as string[];

  for (const root of searchRoots) {
    if (!existsSync(root)) continue;
    try {
      const { readdirSync } = require('fs');
      const entries: string[] = readdirSync(root);
      const chromiumDir = entries.find((e: string) => e.startsWith('chromium'));
      if (chromiumDir) {
        const candidates = [
          join(root, chromiumDir, 'chrome-linux', 'headless_shell'),
          join(root, chromiumDir, 'chrome-linux', 'chrome'),
          join(root, chromiumDir, 'chrome'),
        ];
        const found = candidates.find(existsSync);
        if (found) return found;
      }
    } catch {
      // continue searching
    }
  }
  return undefined;
}

export class JobApplicationAutomator {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    try {
      const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
      const isRender = process.env.RENDER;

      if (isServerless) {
        throw new Error('Playwright does not work on serverless (Vercel, Lambda, Netlify). Deploy to Render or run locally.');
      }

      if (isRender) {
        const executablePath = findChromiumExecutable();
        console.log(`🔍 Chromium executable path: ${executablePath || 'using default'}`);

        this.browser = await chromium.launch({
          headless: true,
          ...(executablePath ? { executablePath } : {}),
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-gpu',
            '--single-process',
          ],
        });
        console.log('✅ Browser launched on Render');
      } else {
        // Local: visible browser for debugging
        this.browser = await chromium.launch({
          headless: false,
          slowMo: 1000,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
          ],
        });
        console.log('✅ Browser launched in visible mode for automation');
      }
    } catch (error) {
      console.error('Failed to launch browser:', error);
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not launch browser for automation: ${detail}`);
    }
    
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    this.page = await context.newPage();
  }

  async navigateToJobApplication(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    // Use domcontentloaded for faster load; networkidle can timeout on complex sites
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    
    // Wait for dynamic content and forms to load
    await this.page.waitForTimeout(3000);
  }

  /**
   * Detect if current page is a job listing (multiple jobs) and extract links to individual job pages.
   * Returns empty array if this looks like a single application page.
   */
  async extractJobLinksFromListingPage(currentPageUrl: string): Promise<string[]> {
    if (!this.page) return [];

    const baseUrl = new URL(currentPageUrl);
    const MAX_JOBS = 30; // Cap to avoid timeouts

    const jobLinks = await this.page.evaluate(
      ({ origin, maxJobs }: { origin: string; maxJobs: number }) => {
      const links: string[] = [];
      const seen = new Set<string>();

      // Patterns that indicate job/position links (Greenhouse, Lever, Workday, Internshala, custom ATS)
      const jobPathPatterns = [
        /\/job[s]?\//i,
        /\/job\/detail\//i,       // Internshala: internshala.com/job/detail/xxx
        /\/position[s]?\//i,
        /\/careers?\//i,
        /\/opening[s]?\//i,
        /\/role[s]?\//i,
        /\/apply\//i,
        /\/opportunit(y|ies)\//i,
        /lever\.co\/[^/]+\/[^/]+/i,  // lever.co/company/job-id
        /greenhouse\.io\/[^/]+\/jobs/i,
        /jobs\.lever\.co/i,
        /boards\.greenhouse\.io/i,
        /\/job\/[a-zA-Z0-9_-]+/i,
        /\/jobs\/[a-zA-Z0-9_-]+/i,
      ];

      const isJobLink = (href: string): boolean => {
        try {
          const url = new URL(href, origin);
          if (url.origin !== new URL(origin).origin && !href.includes('lever.co') && !href.includes('greenhouse') && !href.includes('internshala')) {
            return false; // Same domain for custom sites, or allow known job boards
          }
          const path = url.pathname + url.search;
          if (jobPathPatterns.some((p) => p.test(path))) return true;
          // Internshala fallback: /job/detail/ or path with "detail" and numeric id
          if (/internshala\.com/i.test(origin) && /\/job\/detail\/.+\d{8,}/i.test(path)) return true;
          return false;
        } catch {
          return false;
        }
      };

      const isNoise = (href: string, text: string): boolean => {
        const lower = (href + ' ' + text).toLowerCase();
        return (
          /login|signin|signup|logout|dashboard|settings|profile|privacy|terms|cookie/i.test(lower) ||
          /#|javascript:|mailto:|tel:/i.test(href) ||
          href.endsWith('.pdf') ||
          href.endsWith('.jpg') ||
          href.endsWith('.png')
        );
      };

      const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href]');
      for (const a of anchors) {
        const href = a.getAttribute('href');
        if (!href || isNoise(href, a.textContent || '')) continue;

        try {
          const absolute = new URL(href, origin).href;
          if (seen.has(absolute)) continue;
          if (!isJobLink(absolute)) continue;

          seen.add(absolute);
          links.push(absolute);
          if (links.length >= maxJobs) break;
        } catch {
          // invalid URL
        }
      }

      return links;
    },
      { origin: baseUrl.origin, maxJobs: MAX_JOBS }
    );

    // Normalize and dedupe; exclude current page
    const currentNorm = baseUrl.pathname.replace(/\/$/, '') || '/';
    const filtered = jobLinks.filter((link) => {
      try {
        const u = new URL(link);
        const pathNorm = u.pathname.replace(/\/$/, '') || '/';
        return u.origin === baseUrl.origin ? pathNorm !== currentNorm : true;
      } catch {
        return true;
      }
    });

    return filtered;
  }

  /** In local (visible) mode: pause so user can log in to the site. Skipped on Render. */
  async waitForManualLogin(): Promise<void> {
    if (process.env.RENDER) return;

    const waitSeconds = 30;
    console.log(`\n⏳ If this site requires login (e.g. Internshala), log in now in the browser window. Continuing in ${waitSeconds}s...\n`);
    await this.page?.waitForTimeout(waitSeconds * 1000);
  }

  async analyzeForm(): Promise<{
    formFields: JobFormField[];
    jobTitle: string;
    companyName: string;
    jobDescription: string;
  }> {
    if (!this.page) {
      throw new Error('Page not loaded. Call navigateToJobApplication() first.');
    }

    // Extract job information
    const jobInfo = await this.page.evaluate(() => {
      const isValidTitle = (s: string) => s && s.length > 0 && s.length < 150 && !/^(apply|submit|login|sign in)/i.test(s.trim());
      const isValidCompany = (s: string) => s && s.length > 0 && s.length < 100 && !/^(apply|submit|login|sign in)/i.test(s.trim());

      // Job title selectors (order matters - most specific first)
      const titleSelectors = [
        '[data-testid="job-title"]', '[data-qa="job-title"]', '[data-cy="job-title"]',
        '.job-title', '.position-title', '.job-header-title', '.posting-headline',
        'h1[class*="job"]', 'h1[class*="title"]', 'h1[class*="position"]',
        '[class*="JobTitle"]', '[class*="job-title"]', '[class*="position-title"]',
        'h1', 'h2.posting-title'
      ];

      const companySelectors = [
        '[data-testid="company-name"]', '[data-qa="company-name"]', '[data-cy="company-name"]',
        '.company-name', '.employer-name', '.job-company', '.posting-company',
        '[class*="CompanyName"]', '[class*="company-name"]', '[class*="employer-name"]',
        'a[href*="/company/"]', '[class*="company"]', '[class*="employer"]'
      ];

      let jobTitle = '';
      let companyName = '';
      let jobDescription = '';

      // Try to find job title from DOM
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim() || '';
          if (isValidTitle(text)) {
            jobTitle = text.split('\n')[0].trim();
            break;
          }
        }
      }

      // Fallback: parse from meta tags (og:title, twitter:title)
      if (!jobTitle) {
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
        const docTitle = document.title;
        for (const t of [ogTitle, twitterTitle, docTitle]) {
          if (t && isValidTitle(t)) {
            jobTitle = t.split(/[|\-–—]/)[0].trim();
            break;
          }
        }
      }

      // Try to find company name from DOM
      for (const selector of companySelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim() || '';
          if (isValidCompany(text)) {
            companyName = text.split('\n')[0].trim();
            break;
          }
        }
      }

      // Fallback: parse company from page title (e.g. "Job Title | Company" or "Company - Job Title")
      if (!companyName && document.title) {
        const parts = document.title.split(/[|\-–—]/).map((p) => p.trim());
        if (parts.length >= 2) {
          const last = parts[parts.length - 1];
          if (isValidCompany(last) && last.length < 50) companyName = last;
        }
      }

      // Get job description (look for longer text content). Cap at 2500 chars for Groq API limits.
      const descriptionElements = document.querySelectorAll('p, div, section');
      let longestText = '';
      descriptionElements.forEach((el) => {
        const text = el.textContent?.trim() || '';
        if (text.length > longestText.length && text.length > 100) {
          longestText = text;
        }
      });
      jobDescription = longestText.length > 2500 ? longestText.slice(0, 2500) + ' [...]' : longestText;

      return { jobTitle, companyName, jobDescription };
    });

    // Analyze form fields
    const formFields = await this.page.evaluate(() => {
      const fields: JobFormField[] = [];
      
      // Find all form inputs
      const inputs = document.querySelectorAll('input, textarea, select');
      
      inputs.forEach((input, index) => {
        const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        
        // Skip hidden, submit, and button inputs
        if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
          return;
        }

        // Get field information
        const name = element.name || element.id || `field_${index}`;
        const type = element.tagName.toLowerCase() === 'textarea' ? 'textarea' :
                    element.tagName.toLowerCase() === 'select' ? 'select' :
                    (element as HTMLInputElement).type || 'text';
        
        // Find label
        let label = '';
        const labelElement = document.querySelector(`label[for="${element.id}"]`) ||
                           element.closest('label') ||
                           element.parentElement?.querySelector('label');
        
        if (labelElement) {
          label = labelElement.textContent?.trim() || '';
        } else {
          // Try to find nearby text that might be a label
          const parent = element.parentElement;
          if (parent) {
            const textNodes = Array.from(parent.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE)
              .map(node => node.textContent?.trim())
              .filter(text => text && text.length > 0);
            
            if (textNodes.length > 0) {
              label = textNodes[0] || '';
            }
          }
        }

        const placeholder = (element as HTMLInputElement).placeholder || '';
        const required = element.hasAttribute('required') || 
                        element.getAttribute('aria-required') === 'true';

        // Get options for select elements
        let options: string[] = [];
        if (element.tagName.toLowerCase() === 'select') {
          const selectElement = element as HTMLSelectElement;
          options = Array.from(selectElement.options)
            .map(option => option.textContent?.trim() || '')
            .filter(text => text.length > 0);
        }

        fields.push({
          name,
          type: type as JobFormField['type'],
          label: label || placeholder || name,
          placeholder,
          required,
          options: options.length > 0 ? options : undefined
        });
      });

      return fields;
    });

    return {
      formFields,
      jobTitle: jobInfo.jobTitle || '',
      companyName: jobInfo.companyName || '',
      jobDescription: jobInfo.jobDescription || 'No description available'
    };
  }

  async fillForm(responses: Record<string, string>): Promise<void> {
    if (!this.page) {
      throw new Error('Page not loaded.');
    }

    console.log('🤖 Starting intelligent form filling...');

    // Get all form fields on the page
    const formFields = await this.page.$$eval('input, textarea, select', elements => {
      return elements.map((el, index) => {
        const element = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        return {
          index,
          tagName: element.tagName.toLowerCase(),
          type: element.type || 'text',
          name: element.name || '',
          id: element.id || '',
          placeholder: (element as HTMLInputElement).placeholder || '',
          className: element.className || '',
          ariaLabel: element.getAttribute('aria-label') || '',
          labelText: '', // Will be filled by finding associated label
          required: element.hasAttribute('required')
        };
      });
    });

    console.log(`📋 Found ${formFields.length} form fields to analyze`);
    
    // Debug: Log all form fields
    formFields.forEach((field, index) => {
      console.log(`📝 Field ${index + 1}: type="${field.type}", name="${field.name}", id="${field.id}", placeholder="${field.placeholder}"`);
    });

    // Fill each field intelligently
    for (let i = 0; i < formFields.length; i++) {
      const field = formFields[i];
      
      try {
        // Skip hidden, submit, button, and file inputs
        if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button' || field.type === 'file') {
          console.log(`⏭️ Skipping ${field.type} input field ${i + 1}`);
          continue;
        }

        // Get the actual element using a more reliable selector
        let element = null;
        
        // Try different selectors to find the element
        if (field.id) {
          // Use attribute selector for IDs that start with numbers or contain special chars
          element = await this.page.$(`[id="${field.id}"]`); // Use attribute selector instead
        } else if (field.name) {
          element = await this.page.$(`[name="${field.name}"]`);
        } else {
          // Fallback to index-based selection
          const allFields = await this.page.$$('input, textarea, select');
          if (field.index < allFields.length) {
            element = allFields[field.index];
          }
        }
        
        if (!element) {
          console.log(`⚠️ Could not find element for field ${i + 1}`);
          continue;
        }

        // Determine what this field is for based on various clues
        const fieldPurpose = this.determineFieldPurpose(field);
        console.log(`🔍 Field ${i + 1}: ${fieldPurpose} (${field.type})`);

        // Get the appropriate value for this field
        const value = this.getValueForField(fieldPurpose, responses);
        
        if (value) {
          try {
            // Check if element is visible first
            const isVisible = await element.isVisible();
            if (!isVisible) {
              console.log(`⚠️ Element ${i + 1} is not visible, skipping`);
              continue;
            }

            // Scroll to the element and highlight it
            await element.scrollIntoViewIfNeeded({ timeout: 5000 });
            await element.focus();
          
            // Add visual feedback
            await element.evaluate(el => {
              el.style.border = '3px solid #ffa3d1';
              el.style.backgroundColor = '#fff0f5';
            });

            // Fill the field based on its type
            if (field.tagName === 'select') {
              // For select elements, try to find matching option
              const options = await element.$$eval('option', opts => 
                opts.map(opt => ({ value: opt.value, text: opt.textContent?.trim() || '' }))
              );
              
              const matchingOption = options.find(opt => 
                opt.text.toLowerCase().includes(value.toLowerCase()) ||
                opt.value.toLowerCase().includes(value.toLowerCase())
              );
              
              if (matchingOption) {
                await element.selectOption(matchingOption.value);
                console.log(`✅ Selected option: ${matchingOption.text}`);
              }
            } else {
              // For input and textarea elements
              await element.fill(value);
              console.log(`✅ Filled ${fieldPurpose}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
            }

            // Remove highlight after a moment
            setTimeout(async () => {
              try {
                await element.evaluate(el => {
                  el.style.border = '';
                  el.style.backgroundColor = '';
                });
              } catch {
                // Element might be gone, ignore
              }
            }, 2000);

            // Wait between fields for visibility
            await this.page.waitForTimeout(1000);
          } catch (fillError) {
            console.log(`❌ Error interacting with field ${i + 1}: ${fillError}`);
          }
        } else {
          console.log(`⚠️ No value found for field: ${fieldPurpose}`);
        }
      } catch (error) {
        console.log(`❌ Error processing field ${i + 1}: ${error}`);
        // Continue with next field instead of stopping
      }
    }

    console.log('🎉 Form filling completed!');
  }

  private determineFieldPurpose(field: {
    name: string;
    id: string;
    placeholder: string;
    className: string;
    ariaLabel: string;
    type: string;
    tagName: string;
  }): string {
    const allText = `${field.name} ${field.id} ${field.placeholder} ${field.className} ${field.ariaLabel}`.toLowerCase();
    
    // Check for common field patterns
    if (allText.includes('first') && allText.includes('name')) return 'firstName';
    if (allText.includes('last') && allText.includes('name')) return 'lastName';
    if (allText.includes('full') && allText.includes('name')) return 'fullName';
    if (allText.includes('email')) return 'email';
    if (allText.includes('phone')) return 'phone';
    if (allText.includes('cover') && allText.includes('letter')) return 'coverLetter';
    if (allText.includes('why') && (allText.includes('interested') || allText.includes('apply'))) return 'whyInterested';
    if (allText.includes('experience')) return 'experience';
    if (allText.includes('resume')) return 'resume';
    if (allText.includes('linkedin')) return 'linkedin';
    if (allText.includes('portfolio')) return 'portfolio';
    if (allText.includes('website')) return 'website';
    if (allText.includes('salary')) return 'salary';
    if (allText.includes('availability') || allText.includes('start')) return 'availability';
    if (allText.includes('address')) return 'address';
    if (allText.includes('city')) return 'city';
    if (allText.includes('state')) return 'state';
    if (allText.includes('zip') || allText.includes('postal')) return 'zipCode';
    if (allText.includes('country')) return 'country';
    
    // Default based on field type
    if (field.type === 'email') return 'email';
    if (field.type === 'tel') return 'phone';
    if (field.tagName === 'textarea') return 'coverLetter';
    
    return 'unknown';
  }

  private getValueForField(fieldPurpose: string, responses: Record<string, string>): string {
    switch (fieldPurpose) {
      case 'firstName': return responses.firstName || '';
      case 'lastName': return responses.lastName || '';
      case 'fullName': return `${responses.firstName || ''} ${responses.lastName || ''}`.trim();
      case 'email': return responses.email || '';
      case 'phone': return responses.phoneNumber || '';
      case 'coverLetter': return responses.coverLetter || '';
      case 'whyInterested': return responses.whyInterested || '';
      case 'experience': return responses.experience || '';
      case 'availability': return responses.availability || 'Immediately';
      case 'salary': return responses.salary || 'Negotiable';
      default: 
        // Try to find a matching response key
        const matchingKey = Object.keys(responses).find(key => 
          key.toLowerCase().includes(fieldPurpose.toLowerCase())
        );
        return matchingKey ? responses[matchingKey] : '';
    }
  }

  /** Best-effort: try to find and click a submit/apply button. Returns true if clicked. */
  async tryClickSubmit(): Promise<boolean> {
    if (!this.page) return false;
    try {
      // Try type=submit first
      const submitInput = await this.page.$('input[type="submit"], button[type="submit"]');
      if (submitInput && await submitInput.isVisible()) {
        await submitInput.click();
        return true;
      }
      // Try buttons with Submit/Apply text
      const buttons = await this.page.$$('button, input[type="button"]');
      for (const btn of buttons) {
        const text = (await btn.textContent())?.toLowerCase() || '';
        if (/submit|apply|send|continue/.test(text) && (await btn.isVisible())) {
          await btn.click();
          return true;
        }
      }
    } catch {
      // Ignore - form may have custom submit
    }
    return false;
  }

  async close(): Promise<void> {
    // Don't close the browser - let it stay open for user review
    console.log('🎉 Automation completed! Browser will stay open for you to review and submit the application.');
    this.browser = null;
    this.page = null;
  }

  // Force close the browser (for cleanup)
  async forceClose(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('🔒 Browser closed successfully');
      } catch (error) {
        console.error('Error closing browser:', error);
      }
      this.browser = null;
      this.page = null;
    }
  }

  // Keep browser open for user to review and submit
  async keepOpenForReview(): Promise<void> {
    console.log('✅ Form filled! Browser will stay open for you to review and submit. ');
    // Don't close the browser - let user review and submit manually
  }
}
