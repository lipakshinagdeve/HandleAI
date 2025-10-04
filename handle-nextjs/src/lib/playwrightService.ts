import { chromium, Browser, Page } from 'playwright';
import chromiumPkg from '@sparticuz/chromium';
import { JobFormField } from './groqService';

export class JobApplicationAutomator {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    try {
      const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
      
      if (isServerless) {
        // Use lightweight Chromium for serverless environments
        this.browser = await chromium.launch({
          executablePath: await chromiumPkg.executablePath(),
          args: [
            ...chromiumPkg.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
          ],
          headless: chromiumPkg.headless
        });
        console.log('✅ Browser launched in serverless mode');
      } else {
        // Use regular Chromium for local development
        this.browser = await chromium.launch({
          headless: false, // Keep visible so user can see what's happening
          slowMo: 1000, // Slow down actions for better visibility
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        });
        console.log('✅ Browser launched in visible mode for automation');
      }
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw new Error('Could not launch browser for automation. Please ensure Playwright is properly installed.');
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

    // Fill each field intelligently
    for (let i = 0; i < formFields.length; i++) {
      const field = formFields[i];
      
      try {
        // Skip hidden, submit, and button inputs
        if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') {
          continue;
        }

        // Get the actual element using a more reliable selector
        let element = null;
        
        // Try different selectors to find the element
        if (field.id) {
          element = await this.page.$(`#${field.id}`);
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
          // Scroll to the element and highlight it
          await element.scrollIntoViewIfNeeded();
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
          await this.page.waitForTimeout(1500);
        }
      } catch (error) {
        console.error(`❌ Error filling field ${i + 1}:`, error);
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
