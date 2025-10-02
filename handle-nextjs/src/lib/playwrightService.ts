import { chromium, Browser, Page } from 'playwright';
import { JobFormField } from './groqService';

export class JobApplicationAutomator {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    try {
      // Try to launch in non-headless mode first
      this.browser = await chromium.launch({
        headless: false, // Keep visible so user can see what's happening
        slowMo: 1000, // Slow down actions for better visibility
      });
    } catch (error) {
      console.warn('Failed to launch browser in GUI mode, trying headless mode:', error);
      try {
        // Fallback to headless mode
        this.browser = await chromium.launch({
          headless: true,
          slowMo: 500,
        });
        console.log('✅ Browser launched in headless mode');
      } catch (headlessError) {
        console.error('Failed to launch browser in both GUI and headless modes:', headlessError);
        throw new Error('Could not launch browser. Please ensure Playwright is properly installed.');
      }
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

    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait a bit for any dynamic content to load
    await this.page.waitForTimeout(2000);
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
      // Common selectors for job titles and company names
      const titleSelectors = [
        'h1', '[data-testid="job-title"]', '.job-title', '.position-title',
        '[class*="title"]', '[class*="job"]', '[class*="position"]'
      ];
      
      const companySelectors = [
        '[data-testid="company-name"]', '.company-name', '.employer-name',
        '[class*="company"]', '[class*="employer"]'
      ];

      let jobTitle = '';
      let companyName = '';
      let jobDescription = '';

      // Try to find job title
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 0) {
          jobTitle = element.textContent.trim();
          break;
        }
      }

      // Try to find company name
      for (const selector of companySelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 0) {
          companyName = element.textContent.trim();
          break;
        }
      }

      // Get job description (look for longer text content)
      const descriptionElements = document.querySelectorAll('p, div, section');
      let longestText = '';
      descriptionElements.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (text.length > longestText.length && text.length > 100) {
          longestText = text;
        }
      });
      jobDescription = longestText;

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
      jobTitle: jobInfo.jobTitle || 'Unknown Position',
      companyName: jobInfo.companyName || 'Unknown Company',
      jobDescription: jobInfo.jobDescription || 'No description available'
    };
  }

  async fillForm(responses: Record<string, string>): Promise<void> {
    if (!this.page) {
      throw new Error('Page not loaded.');
    }

    // Fill each field based on the responses
    for (const [fieldName, value] of Object.entries(responses)) {
      try {
        // Try multiple selectors to find the field
        const selectors = [
          `[name="${fieldName}"]`,
          `#${fieldName}`,
          `[id="${fieldName}"]`,
          `[data-testid="${fieldName}"]`
        ];

        let filled = false;
        for (const selector of selectors) {
          try {
            const element = await this.page.$(selector);
            if (element) {
              const tagName = await element.evaluate(el => el.tagName.toLowerCase());
              const inputType = await element.evaluate(el => 
                el.tagName.toLowerCase() === 'input' ? (el as HTMLInputElement).type : null
              );

              // Fill based on element type
              if (tagName === 'textarea' || inputType === 'text' || inputType === 'email') {
                await element.fill(value);
                filled = true;
                break;
              } else if (tagName === 'select') {
                await element.selectOption({ label: value });
                filled = true;
                break;
              }
            }
          } catch (error) {
            // Continue to next selector
            continue;
          }
        }

        if (filled) {
          console.log(`✅ Filled field: ${fieldName} = ${value}`);
          // Add a small delay between fields
          await this.page.waitForTimeout(500);
        } else {
          console.log(`⚠️ Could not find field: ${fieldName}`);
        }
      } catch (error) {
        console.error(`Error filling field ${fieldName}:`, error);
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  // Keep browser open for user to review and submit
  async keepOpenForReview(): Promise<void> {
    console.log('✅ Form filled! Browser will stay open for you to review and submit.');
    // Don't close the browser - let user review and submit manually
  }
}
