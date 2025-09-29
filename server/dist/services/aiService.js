"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("../config/openai"));
class AIService {
    async generateCoverLetter(job, user) {
        try {
            const prompt = `
        Generate a professional cover letter for the following job application:
        
        Job Details:
        - Title: ${job.title}
        - Company: ${job.company}
        - Location: ${job.location}
        - Job Description: ${job.description.substring(0, 500)}...
        - Requirements: ${job.requirements?.join(', ') || 'Not specified'}
        
        Candidate Profile:
        - Name: ${user.firstName} ${user.lastName}
        - Skills: ${user.skills}
        - Email: ${user.email}
        
        Please create a personalized, professional cover letter that:
        1. Addresses the hiring manager professionally
        2. Shows enthusiasm for the specific role and company
        3. Highlights relevant skills from the candidate's profile that match the job requirements
        4. Demonstrates knowledge about the company/role
        5. Includes a strong closing statement
        6. Is concise (under 300 words)
        7. Uses professional tone and formatting
        
        Format the response as a complete cover letter ready to submit.
      `;
            const response = await openai_1.default.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert career counselor and professional writer specializing in creating compelling cover letters that get results. Focus on quality, relevance, and professionalism."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            });
            return response.choices[0].message.content?.trim() || this.generateFallbackCoverLetter(job, user);
        }
        catch (error) {
            console.error('Cover letter generation error:', error);
            return this.generateFallbackCoverLetter(job, user);
        }
    }
    async answerJobQuestion(question, job, user) {
        try {
            const prompt = `
        Answer the following job application question professionally and convincingly:
        
        Question: "${question}"
        
        Job Context:
        - Title: ${job.title}
        - Company: ${job.company}
        - Description: ${job.description.substring(0, 300)}...
        - Requirements: ${job.requirements?.join(', ') || 'Not specified'}
        
        Candidate Profile:
        - Name: ${user.firstName} ${user.lastName}
        - Skills: ${user.skills}
        - Experience: Based on skills provided
        
        Please provide a compelling answer that:
        1. Directly addresses the question
        2. Showcases relevant skills and experience
        3. Shows enthusiasm for the role
        4. Demonstrates cultural fit
        5. Is concise but comprehensive (100-200 words)
        6. Uses specific examples when possible
      `;
            const response = await openai_1.default.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a career expert helping candidates provide excellent answers to job application questions. Focus on being authentic, relevant, and compelling."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 400,
                temperature: 0.6
            });
            return response.choices[0].message.content?.trim() || this.generateFallbackAnswer(question, job, user);
        }
        catch (error) {
            console.error('Question answering error:', error);
            return this.generateFallbackAnswer(question, job, user);
        }
    }
    async generateCustomAnswers(questions, job, user) {
        const answers = [];
        for (const question of questions) {
            const answer = await this.answerJobQuestion(question, job, user);
            answers.push({ question, answer });
        }
        return answers;
    }
    async optimizeApplication(job, user) {
        try {
            const prompt = `
        Analyze this job posting and candidate profile, then provide optimization suggestions:
        
        Job Details:
        - Title: ${job.title}
        - Company: ${job.company}
        - Requirements: ${job.requirements?.join(', ') || 'Not specified'}
        - Skills: ${job.skills?.join(', ') || 'Not specified'}
        
        Candidate Skills: ${user.skills}
        
        Provide:
        1. Match score (0-100%)
        2. Top 3 matching skills
        3. Top 3 skills to highlight
        4. 2-3 key points to emphasize in application
        5. Any red flags or concerns
        
        Format as JSON.
      `;
            const response = await openai_1.default.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI job matching expert. Analyze job-candidate fit and provide actionable insights in JSON format."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            });
            try {
                return JSON.parse(response.choices[0].message.content || '{}');
            }
            catch {
                return this.generateFallbackOptimization(job, user);
            }
        }
        catch (error) {
            console.error('Application optimization error:', error);
            return this.generateFallbackOptimization(job, user);
        }
    }
    generateFallbackCoverLetter(job, user) {
        return `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background in ${user.skills.split(',')[0]?.trim()}, I am confident that I would be a valuable addition to your team.

My experience includes ${user.skills}, which aligns well with the requirements for this role. I am particularly drawn to ${job.company} because of its reputation in the industry and commitment to innovation.

I am excited about the opportunity to contribute to your team and would welcome the chance to discuss how my skills and enthusiasm can benefit ${job.company}. Thank you for considering my application.

Sincerely,
${user.firstName} ${user.lastName}`;
    }
    generateFallbackAnswer(question, job, user) {
        const skillsList = user.skills.split(',').slice(0, 3);
        const skillsStr = skillsList.map(skill => skill.trim()).join(', ');
        return `Thank you for this question. Based on my experience with ${skillsStr}, I believe I am well-suited for the ${job.title} role at ${job.company}. My background has prepared me to contribute effectively to your team, and I am excited about the opportunity to apply my skills in this position. I am particularly motivated by the chance to grow professionally while contributing to ${job.company}'s success.`;
    }
    generateFallbackOptimization(job, user) {
        const userSkills = user.skills.split(',').map(skill => skill.trim().toLowerCase());
        const jobSkills = job.skills?.map(skill => skill.toLowerCase()) || [];
        const matchingSkills = userSkills.filter(skill => jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill)));
        const matchPercentage = Math.min(matchingSkills.length * 20, 100);
        return {
            matchScore: matchPercentage || 30,
            matchingSkills: matchingSkills.slice(0, 3),
            skillsToHighlight: userSkills.slice(0, 3),
            keyPoints: [
                `Emphasize your experience with ${userSkills[0] || 'relevant technologies'}`,
                `Highlight your fit for the ${job.title} role`,
                "Show enthusiasm for the company and position"
            ],
            concerns: matchPercentage < 50 ? ["Consider gaining more experience in job-specific requirements"] : []
        };
    }
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map