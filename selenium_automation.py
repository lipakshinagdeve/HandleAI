#!/usr/bin/env python3
"""
Selenium automation script for job application form filling.
This uses Selenium WebDriver for reliable browser automation.
"""

import json
import sys
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import requests

def generate_ai_response(prompt, user_background, company_name="", job_title=""):
    """Generate AI response using Groq API"""
    try:
        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            return f"Based on my background: {user_background}"
        
        headers = {
            'Authorization': f'Bearer {groq_api_key}',
            'Content-Type': 'application/json'
        }
        
        full_prompt = f"""
        Based on this background information: {user_background}
        
        Company: {company_name}
        Job Title: {job_title}
        
        Question: {prompt}
        
        Please provide a professional, personalized response (2-3 sentences max):
        """
        
        data = {
            "messages": [{"role": "user", "content": full_prompt}],
            "model": "llama-3.1-8b-instant",
            "max_tokens": 200
        }
        
        response = requests.post('https://api.groq.com/openai/v1/chat/completions', 
                               headers=headers, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content'].strip()
        else:
            return f"Based on my background: {user_background}"
            
    except Exception as e:
        print(f"AI generation error: {e}")
        return f"Based on my background: {user_background}"

def determine_field_purpose(element):
    """Determine what a form field is for based on various attributes"""
    try:
        # Get various attributes
        name = element.get_attribute('name') or ''
        field_id = element.get_attribute('id') or ''
        placeholder = element.get_attribute('placeholder') or ''
        field_type = element.get_attribute('type') or ''
        
        # Find label text
        label_text = ''
        try:
            # Try to find label by 'for' attribute
            if field_id:
                label = element.find_element(By.XPATH, f"//label[@for='{field_id}']")
                label_text = label.text.strip()
        except:
            try:
                # Try to find parent label
                label = element.find_element(By.XPATH, "./ancestor::label[1]")
                label_text = label.text.strip()
            except:
                try:
                    # Try to find nearby text
                    parent = element.find_element(By.XPATH, "./..")
                    label_text = parent.text.strip()
                except:
                    pass
        
        # Combine all text for analysis
        all_text = f"{name} {field_id} {placeholder} {label_text}".lower()
        
        # Determine field purpose
        if 'first' in all_text and 'name' in all_text:
            return 'firstName'
        elif 'last' in all_text and 'name' in all_text:
            return 'lastName'
        elif 'full' in all_text and 'name' in all_text:
            return 'fullName'
        elif 'email' in all_text or field_type == 'email':
            return 'email'
        elif 'phone' in all_text or field_type == 'tel':
            return 'phone'
        elif 'cover' in all_text and 'letter' in all_text:
            return 'coverLetter'
        elif any(word in all_text for word in ['why', 'interested', 'apply', 'motivation']):
            return 'whyInterested'
        elif 'experience' in all_text:
            return 'experience'
        elif 'resume' in all_text:
            return 'resume'
        elif 'linkedin' in all_text:
            return 'linkedin'
        elif 'portfolio' in all_text or 'website' in all_text:
            return 'portfolio'
        elif 'salary' in all_text:
            return 'salary'
        elif 'availability' in all_text or 'start' in all_text:
            return 'availability'
        elif 'address' in all_text:
            return 'address'
        elif 'city' in all_text:
            return 'city'
        elif 'state' in all_text:
            return 'state'
        elif 'zip' in all_text or 'postal' in all_text:
            return 'zipCode'
        elif 'country' in all_text:
            return 'country'
        else:
            return 'unknown'
            
    except Exception as e:
        print(f"Error determining field purpose: {e}")
        return 'unknown'

def get_value_for_field(field_purpose, user_data, company_name="", job_title=""):
    """Get the appropriate value for a form field"""
    try:
        if field_purpose == 'firstName':
            return user_data.get('firstName', '')
        elif field_purpose == 'lastName':
            return user_data.get('lastName', '')
        elif field_purpose == 'fullName':
            return f"{user_data.get('firstName', '')} {user_data.get('lastName', '')}".strip()
        elif field_purpose == 'email':
            return user_data.get('email', '')
        elif field_purpose == 'phone':
            return user_data.get('phone', '')
        elif field_purpose == 'coverLetter':
            prompt = "Write a cover letter for this position"
            return generate_ai_response(prompt, user_data.get('backgroundInfo', ''), company_name, job_title)
        elif field_purpose == 'whyInterested':
            prompt = "Why are you interested in this position?"
            return generate_ai_response(prompt, user_data.get('backgroundInfo', ''), company_name, job_title)
        elif field_purpose == 'experience':
            prompt = "Describe your relevant experience"
            return generate_ai_response(prompt, user_data.get('backgroundInfo', ''), company_name, job_title)
        elif field_purpose == 'availability':
            return 'Immediately'
        elif field_purpose == 'salary':
            return 'Negotiable'
        else:
            # For unknown fields, try to generate a response based on context
            if user_data.get('backgroundInfo'):
                return generate_ai_response("Please provide a brief professional response", 
                                          user_data.get('backgroundInfo', ''), company_name, job_title)
            return ''
    except Exception as e:
        print(f"Error getting value for field: {e}")
        return ''

def fill_job_application(job_url, user_data):
    """Fill a job application form using Selenium"""
    driver = None
    try:
        print("🚀 Starting Selenium automation...")
        print(f"📝 Job URL: {job_url}")
        print(f"👤 User: {user_data.get('firstName', '')} {user_data.get('lastName', '')}")
        
        # Setup Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--window-size=1280,720")
        
        # Don't run headless so user can see the automation
        # chrome_options.add_argument("--headless")
        
        # Setup Chrome driver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print("✅ Chrome browser launched")
        
        # Navigate to the job application
        driver.get(job_url)
        print("🌐 Navigated to job application page")
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Wait longer for dynamic content and forms to load
        time.sleep(5)
        
        # Try to wait for form elements specifically
        try:
            WebDriverWait(driver, 10).until(
                lambda d: len(d.find_elements(By.TAG_NAME, "input")) > 0 or 
                         len(d.find_elements(By.TAG_NAME, "textarea")) > 0 or
                         len(d.find_elements(By.TAG_NAME, "select")) > 0
            )
            print("✅ Form elements detected")
        except TimeoutException:
            print("⚠️ No form elements found after waiting - page might not have forms or they're loaded differently")
        
        # Try to extract company name and job title from the page
        company_name = ""
        job_title = ""
        
        try:
            # Common selectors for job titles
            title_selectors = ["h1", "[data-testid*='job-title']", ".job-title", ".position-title"]
            for selector in title_selectors:
                try:
                    element = driver.find_element(By.CSS_SELECTOR, selector)
                    if element.text.strip():
                        job_title = element.text.strip()
                        break
                except:
                    continue
        except:
            pass
            
        try:
            # Common selectors for company names
            company_selectors = ["[data-testid*='company']", ".company-name", ".employer-name"]
            for selector in company_selectors:
                try:
                    element = driver.find_element(By.CSS_SELECTOR, selector)
                    if element.text.strip():
                        company_name = element.text.strip()
                        break
                except:
                    continue
        except:
            pass
        
        print(f"🏢 Company: {company_name or 'Unknown'}")
        print(f"💼 Position: {job_title or 'Unknown'}")
        
        # Find all form fields - get fresh elements each time to avoid stale references
        def get_all_fields():
            inputs = driver.find_elements(By.TAG_NAME, "input")
            textareas = driver.find_elements(By.TAG_NAME, "textarea")
            selects = driver.find_elements(By.TAG_NAME, "select")
            return inputs + textareas + selects
        
        all_fields = get_all_fields()
        print(f"📋 Found {len(all_fields)} form fields")
        
        # Debug: Print page title and URL to confirm we're on the right page
        print(f"🔍 Page title: {driver.title}")
        print(f"🔍 Current URL: {driver.current_url}")
        
        # Debug: Check if there are any forms on the page
        forms = driver.find_elements(By.TAG_NAME, "form")
        print(f"🔍 Found {len(forms)} form elements")
        
        # Debug: Look for common form field patterns
        all_elements = driver.find_elements(By.CSS_SELECTOR, "input, textarea, select, button")
        print(f"🔍 Found {len(all_elements)} total interactive elements")
        
        if len(all_elements) > 0:
            print("🔍 Interactive elements found:")
            for i, elem in enumerate(all_elements[:10]):  # Show first 10
                try:
                    tag = elem.tag_name
                    elem_type = elem.get_attribute('type') or 'N/A'
                    elem_id = elem.get_attribute('id') or 'N/A'
                    elem_name = elem.get_attribute('name') or 'N/A'
                    print(f"   {i+1}. {tag} (type: {elem_type}, id: {elem_id}, name: {elem_name})")
                except:
                    print(f"   {i+1}. Element info unavailable")
        
        if len(all_fields) == 0:
            print("⚠️ No form fields found. The page might:")
            print("   - Be loading content dynamically")
            print("   - Require user interaction first")
            print("   - Use non-standard form elements")
            print("   - Be behind authentication")
            print("🔍 Browser will stay open for manual inspection")
        
        filled_count = 0
        
        # Process each field
        for i in range(len(all_fields)):
            try:
                # Get fresh element to avoid stale reference
                current_fields = get_all_fields()
                if i >= len(current_fields):
                    print(f"⚠️ Field {i + 1} no longer exists, skipping")
                    continue
                    
                field = current_fields[i]
                
                # Skip hidden, submit, button, and file inputs
                field_type = field.get_attribute('type') or ''
                if field_type in ['hidden', 'submit', 'button', 'file']:
                    print(f"⏭️ Skipping {field_type} field {i + 1}")
                    continue

                # Check if field is visible
                if not field.is_displayed():
                    print(f"⚠️ Field {i + 1} is not visible, skipping")
                    continue
                
                # Determine field purpose
                field_purpose = determine_field_purpose(field)
                print(f"🔍 Field {i + 1}: {field_purpose} ({field.tag_name})")
                
                # Get value for this field
                value = get_value_for_field(field_purpose, user_data, company_name, job_title)
                
                if value:
                    # Scroll to field
                    driver.execute_script("arguments[0].scrollIntoView(true);", field)
                    time.sleep(0.5)
                    
                    # Highlight field
                    driver.execute_script("arguments[0].style.border='3px solid #4CAF50';", field)
                    driver.execute_script("arguments[0].style.backgroundColor='#f0f8ff';", field)
                    
                    # Fill the field
                    if field.tag_name.lower() == 'select':
                        # Handle select dropdown
                        select = Select(field)
                        options = [option.text.lower() for option in select.options]
                        
                        # Try to find matching option
                        value_lower = value.lower()
                        matching_option = None
                        for option in select.options:
                            if value_lower in option.text.lower() or option.text.lower() in value_lower:
                                matching_option = option
                                break
                        
                        if matching_option:
                            select.select_by_visible_text(matching_option.text)
                            print(f"✅ Selected: {matching_option.text}")
                        else:
                            print(f"⚠️ No matching option found for: {value}")
                    else:
                        # Handle input and textarea
                        field.clear()
                        field.send_keys(value)
                        print(f"✅ Filled {field_purpose}: {value[:50]}{'...' if len(value) > 50 else ''}")
                    
                    filled_count += 1
                    
                    # Remove highlight after a moment
                    time.sleep(1)
                    driver.execute_script("arguments[0].style.border='';", field)
                    driver.execute_script("arguments[0].style.backgroundColor='';", field)
                    
                    # Wait between fields
                    time.sleep(1)
                else:
                    print(f"⚠️ No value for field: {field_purpose}")
                    
            except Exception as e:
                print(f"❌ Error processing field {i + 1}: {e}")
                continue
        
        print(f"🎉 Form filling completed! Filled {filled_count} fields.")
        print("🔍 Browser will stay open for you to review and submit.")
        
        # Keep browser open - don't close it
        # driver.quit()
        
        return {
            "success": True,
            "message": f"Job application form filled successfully! Filled {filled_count} fields. Please review and submit.",
            "data": {
                "companyName": company_name,
                "jobTitle": job_title,
                "fieldsFound": len(all_fields),
                "fieldsFilled": filled_count
            }
        }
        
    except Exception as e:
        print(f"❌ Selenium automation failed: {e}")
        if driver:
            print("🔍 Browser will stay open for manual completion")
            # Don't close browser on error
        return {
            "success": False,
            "message": f"Automation failed: {str(e)}"
        }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) != 3:
        print("Usage: python selenium_automation.py <job_url> <user_data_json>")
        sys.exit(1)
    
    job_url = sys.argv[1]
    user_data_json = sys.argv[2]
    
    try:
        user_data = json.loads(user_data_json)
        result = fill_job_application(job_url, user_data)
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "message": f"Invalid JSON data: {str(e)}"
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "message": f"Automation error: {str(e)}"
        }))

if __name__ == "__main__":
    main()
