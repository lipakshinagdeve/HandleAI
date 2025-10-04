#!/usr/bin/env python3
"""
Browser Use automation script for job application form filling.
This uses AI-powered visual understanding to fill forms intelligently.
"""

import asyncio
import json
import sys
import os
from browser_use import Agent

async def fill_job_application(job_url: str, user_data: dict):
    """
    Fill a job application form using Browser Use AI automation.
    
    Args:
        job_url: The URL of the job application
        user_data: Dictionary containing user information
    """
    
    # Create AI agent with instructions
    agent = Agent(
        task=f"""
        I need you to fill out a job application form intelligently. Here's what you need to do:

        1. Navigate to this job application URL: {job_url}
        
        2. Look at the page and identify all form fields that need to be filled
        
        3. Fill out the form with the following information:
           - Name: {user_data.get('firstName', '')} {user_data.get('lastName', '')}
           - Email: {user_data.get('email', '')}
           - Phone: {user_data.get('phone', '')}
           
        4. For any text areas or essay questions, use this background information to write personalized responses:
           {user_data.get('backgroundInfo', 'I am a motivated professional looking for new opportunities.')}
           
        5. For any questions about why you want to work there, motivation, or cover letter, create a personalized response based on:
           - The company name and job title you can see on the page
           - The background information provided above
           - Make it sound professional and enthusiastic
           
        6. Skip any file upload fields (resume, portfolio, etc.) - just leave them empty
        
        7. Do NOT submit the form - just fill it out and leave it for the user to review
        
        8. Take your time to understand each field before filling it
        
        9. If you encounter any errors or can't find certain fields, continue with the ones you can fill
        
        Please be thorough and intelligent about understanding what each field is asking for based on its label, placeholder text, or surrounding context.
        """
    )
    
    try:
        # Run the automation
        print("🚀 Starting Browser Use automation...")
        print(f"📝 Job URL: {job_url}")
        print(f"👤 User: {user_data.get('firstName', '')} {user_data.get('lastName', '')}")
        
        result = await agent.run()
        
        print("✅ Browser Use automation completed!")
        print("🎉 Form should be filled out. Please review and submit manually.")
        
        return {
            "success": True,
            "message": "Job application form filled successfully using AI visual understanding!",
            "result": str(result)
        }
        
    except Exception as e:
        print(f"❌ Browser Use automation failed: {e}")
        return {
            "success": False,
            "message": f"Automation failed: {str(e)}"
        }
    
    finally:
        # Keep browser open for user review
        print("🔍 Browser will stay open for you to review and submit the application.")
        # Don't close the browser - let user review

async def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) != 3:
        print("Usage: python browser_automation.py <job_url> <user_data_json>")
        sys.exit(1)
    
    job_url = sys.argv[1]
    user_data_json = sys.argv[2]
    
    try:
        user_data = json.loads(user_data_json)
        result = await fill_job_application(job_url, user_data)
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
    asyncio.run(main())
