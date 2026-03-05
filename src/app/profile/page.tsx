'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import {
  Upload,
  User,
  Briefcase,
  Link as LinkIcon,
  Plus,
  X,
  Loader2,
  CheckCircle,
  FileText,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    background_info?: string;
  };
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    backgroundInfo: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFormData({
        firstName: parsed.user_metadata?.first_name || '',
        lastName: parsed.user_metadata?.last_name || '',
        phoneNumber: parsed.user_metadata?.phone_number || '',
        backgroundInfo: parsed.user_metadata?.background_info || '',
      });
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const addPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, '']);
  };

  const updatePortfolioLink = (index: number, value: string) => {
    const updated = [...portfolioLinks];
    updated[index] = value;
    setPortfolioLinks(updated);
  };

  const removePortfolioLink = (index: number) => {
    if (portfolioLinks.length > 1) {
      setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          backgroundInfo: formData.backgroundInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber,
            background_info: formData.backgroundInfo,
          },
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage('Profile saved successfully!');
      } else {
        setMessage(data.message || 'Failed to save profile');
      }
    } catch {
      setMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <AppShell>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Profile Setup
          </h1>
          <p className="mt-1 text-zinc-500 text-sm">
            Complete your profile so AI can personalize applications.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
              message.includes('success')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {message.includes('success') ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : null}
            {message}
          </div>
        )}

        {/* Resume Upload */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-soft mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-light text-accent">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-zinc-900">Resume</h2>
          </div>

          <div
            className="border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center hover:border-zinc-300 transition-colors cursor-pointer"
            onClick={() => document.getElementById('resume-upload')?.click()}
          >
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) =>
                setResumeFile(e.target.files?.[0] || null)
              }
            />
            {resumeFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-zinc-900">
                  {resumeFile.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setResumeFile(null);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-700">
                  Click to upload your resume
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  PDF, DOC, or DOCX up to 5MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-soft mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-light text-accent">
              <User className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-zinc-900">
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                First name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus-ring"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus-ring"
              />
            </div>
            <div>
              <label
                htmlFor="profileEmail"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Email
              </label>
              <input
                type="email"
                id="profileEmail"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus-ring"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-soft mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-light text-accent">
              <Briefcase className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-zinc-900">Skills</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-sm rounded-lg"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring"
              placeholder="Type a skill and press Enter"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2.5 bg-zinc-100 text-zinc-600 text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portfolio Links */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-soft mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-light text-accent">
              <LinkIcon className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-zinc-900">Portfolio Links</h2>
          </div>

          <div className="space-y-3">
            {portfolioLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updatePortfolioLink(i, e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring"
                  placeholder="https://your-portfolio.com"
                />
                {portfolioLinks.length > 1 && (
                  <button
                    onClick={() => removePortfolioLink(i)}
                    className="px-3 py-2.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addPortfolioLink}
            className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another link
          </button>
        </div>

        {/* Background Info */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-soft mb-8">
          <h2 className="font-semibold text-zinc-900 mb-2">
            Background Information
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Tell the AI about your experience, education, and achievements.
            This will be used to personalize applications.
          </p>

          <textarea
            id="backgroundInfo"
            name="backgroundInfo"
            rows={8}
            value={formData.backgroundInfo}
            onChange={handleChange}
            placeholder={`e.g.\n- 5 years of software development experience\n- Proficient in React, Node.js, Python\n- Bachelor's in Computer Science\n- Led a team of 3 developers\n- Experience with AWS, Docker, microservices`}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring resize-none font-mono"
          />
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
