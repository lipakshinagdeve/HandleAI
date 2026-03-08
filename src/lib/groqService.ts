import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/** Groq on-demand tier: 6000 tokens total (input + output). ~4 chars ≈ 1 token. Stay well under. */
const MAX_JOB_DESC_CHARS = 1800;   // ~450 tokens
const MAX_BACKGROUND_CHARS = 400;  // ~100 tokens
const MAX_FORM_FIELDS_CHARS = 800; // ~200 tokens

function truncateForGroq(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n[...truncated]';
}

export interface JobFormField {
  name: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
}

export interface JobApplicationData {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  formFields: JobFormField[];
}

export interface UserBackground {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  backgroundInfo: string;
}

export async function generatePersonalizedResponses(
  jobData: JobApplicationData,
  userBackground: UserBackground
): Promise<Record<string, string>> {
  try {
    const prompt = `
You are an expert job application assistant. Generate personalized, professional responses for a job application form.

COMPANY: ${jobData.companyName}
JOB TITLE: ${jobData.jobTitle}
JOB DESCRIPTION: ${truncateForGroq(jobData.jobDescription, MAX_JOB_DESC_CHARS)}

CANDIDATE BACKGROUND:
Name: ${userBackground.firstName} ${userBackground.lastName}
Email: ${userBackground.email}
Phone: ${userBackground.phoneNumber}
Background: ${truncateForGroq(userBackground.backgroundInfo, MAX_BACKGROUND_CHARS)}

FORM FIELDS TO FILL:
${truncateForGroq(jobData.formFields.map(field => `- ${field.name} (${field.type}): ${field.label}${field.required ? ' *REQUIRED*' : ''}`).join('\n'), MAX_FORM_FIELDS_CHARS)}

INSTRUCTIONS:
1. Generate personalized, professional responses for each form field
2. Tailor responses to the specific company and role
3. Use the candidate's background information to create relevant, compelling answers
4. Keep responses concise but impactful
5. For basic fields (name, email, phone), use exact values provided
6. For text areas (cover letter, why interested, etc.), write 2-3 compelling paragraphs
7. For selection fields, recommend the best option based on the candidate's background

Return ONLY a JSON object with field names as keys and responses as values:
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from Groq API');
    }

    // Clean the response text - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to extract JSON from the response if it's mixed with other text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    // Parse the JSON response with better error handling
    try {
      const responses = JSON.parse(cleanedResponse);
      return responses;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Cleaned Response:', cleanedResponse);
      
      // Fallback: try to fix common JSON issues
      const fixedResponse = cleanedResponse
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"')  // Replace single quotes with double quotes
        .replace(/\/\/.*$/gm, '')  // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '');  // Remove multi-line comments
      
      try {
        return JSON.parse(fixedResponse);
      } catch (secondError) {
        console.error('Even fixed JSON failed:', secondError);
        throw new Error('AI generated invalid JSON response');
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error generating personalized responses:', msg);
    throw new Error(`Groq API failed: ${msg}`);
  }
}

export async function analyzeJobDescription(jobDescription: string): Promise<{
  companyName: string;
  jobTitle: string;
  keyRequirements: string[];
  skills: string[];
}> {
  try {
    const prompt = `
Analyze this job description and extract key information:

JOB DESCRIPTION:
${truncateForGroq(jobDescription, MAX_JOB_DESC_CHARS)}

Return ONLY a JSON object with:
{
  "companyName": "extracted company name",
  "jobTitle": "extracted job title", 
  "keyRequirements": ["requirement 1", "requirement 2", ...],
  "skills": ["skill 1", "skill 2", ...]
}
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from Groq API');
    }

    // Clean the response text - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Error analyzing job description:', error);
    throw new Error('Failed to analyze job description');
  }
}
