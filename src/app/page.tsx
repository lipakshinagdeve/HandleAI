'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  ArrowRight,
  Link as LinkIcon,
  Sparkles,
  BarChart3,
  Zap,
  Shield,
  Globe,
  CheckCircle,
  MessageSquare,
  X,
  Loader2,
  Send,
  Bot,
  MousePointerClick,
  Eye,
  Play,
} from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: LinkIcon,
    title: 'Paste Links',
    description:
      'Drop one or multiple job application URLs into your dashboard. Any job board, any company career page.',
    color: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    step: '02',
    icon: Bot,
    title: 'AI Takes Over',
    description:
      'Our AI reads the job posting, understands every form field, and fills in personalized answers automatically.',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    step: '03',
    icon: BarChart3,
    title: 'Track Progress',
    description:
      'Monitor every application in real-time. See what\'s pending, applied, or needs attention.',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
];

const features = [
  {
    icon: Eye,
    title: 'Visual Form Detection',
    description: 'AI sees forms like a human — reads labels, context, and layout to understand what\'s being asked.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Applications that took 30 minutes now take 3. Batch process multiple jobs at once.',
  },
  {
    icon: Shield,
    title: 'Personalized Answers',
    description: 'Every response is tailored to your background, skills, and the specific job requirements.',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Greenhouse, Lever, Workday, custom forms — Handle works across all major job platforms.',
  },
];

const terminalLines = [
  { type: 'comment', text: '# Paste a job link and watch the magic' },
  { type: 'input', text: 'handle apply https://stripe.com/jobs/swe' },
  { type: 'output', text: '→ Analyzing job description...' },
  { type: 'output', text: '→ Detected 12 form fields' },
  { type: 'output', text: '→ Generating personalized responses...' },
  { type: 'output', text: '→ Filling: Name, Email, Resume...' },
  { type: 'output', text: '→ Filling: Cover letter, Work authorization...' },
  { type: 'success', text: '✓ Application submitted successfully!' },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  useEffect(() => {
    const updateAuth = () => setIsLoggedIn(!!localStorage.getItem('user'));
    updateAuth();
    window.addEventListener('auth-change', updateAuth);
    window.addEventListener('storage', updateAuth);
    return () => {
      window.removeEventListener('auth-change', updateAuth);
      window.removeEventListener('storage', updateAuth);
    };
  }, []);

  const handleFeedbackSubmit = async () => {
    if (!feedbackData.message.trim()) return;
    setFeedbackSending(true);
    setFeedbackError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSent(true);
        setFeedbackData({ name: '', email: '', message: '' });
      } else {
        setFeedbackError(data.message || 'Failed to send');
      }
    } catch {
      setFeedbackError('Something went wrong. Try again.');
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-hidden">
      <Navbar />

      {/* ===================== HERO ===================== */}
      <section className="relative pt-28 pb-32 px-6">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 noise-overlay" />

        {/* Floating gradient orbs */}
        <div className="absolute top-10 left-[15%] w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute top-40 right-[10%] w-96 h-96 bg-violet-400/15 rounded-full blur-3xl animate-float-reverse pointer-events-none" />
        <div className="absolute bottom-10 left-[40%] w-64 h-64 bg-pink-400/10 rounded-full blur-3xl animate-float pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-zinc-200 text-sm font-medium text-zinc-700 shadow-soft">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Now automating 500+ applications
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-slide-up mt-8 text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight text-zinc-900 leading-[1.05]">
              Paste a link.
              <br />
              <span className="gradient-text">AI applies for you.</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-slide-up stagger-1 mt-8 text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              Drop any job listing URL and our AI handles the entire
              application&nbsp;&mdash; form detection, intelligent field filling,
              and one-click submission. No more copy-pasting.
            </p>

            {/* CTA Buttons */}
            <div className="animate-slide-up stagger-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={isLoggedIn ? '/dashboard' : '/signup'}
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white text-sm font-medium rounded-2xl hover:bg-zinc-800 transition-all duration-300 hover:shadow-elevated active:scale-[0.97] shimmer-hover"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Start Applying Free'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-4 text-sm font-medium text-zinc-500 bg-white/60 backdrop-blur-sm border border-zinc-200 rounded-2xl hover:bg-white hover:text-zinc-900 hover:border-zinc-300 transition-all duration-300"
              >
                <MousePointerClick className="w-4 h-4" />
                See how it works
              </a>
            </div>
          </div>

          {/* Terminal Demo */}
          <div className="animate-scale-in stagger-3 mt-20 max-w-2xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-elevated bg-[#1a1a2e]">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#16162a] border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="ml-2 text-xs text-zinc-500 font-mono">
                  handle-cli
                </span>
              </div>
              {/* Terminal body */}
              <div className="px-5 py-4 font-mono text-sm space-y-1.5">
                {terminalLines.map((line, i) => (
                  <div
                    key={i}
                    className={`animate-fade-in`}
                    style={{ animationDelay: `${800 + i * 300}ms` }}
                  >
                    {line.type === 'comment' && (
                      <span className="text-zinc-600">{line.text}</span>
                    )}
                    {line.type === 'input' && (
                      <span>
                        <span className="text-emerald-400">$</span>{' '}
                        <span className="text-zinc-200">{line.text}</span>
                      </span>
                    )}
                    {line.type === 'output' && (
                      <span className="text-zinc-400">{line.text}</span>
                    )}
                    {line.type === 'success' && (
                      <span className="text-emerald-400 font-semibold">
                        {line.text}
                      </span>
                    )}
                  </div>
                ))}
                <div
                  className="animate-fade-in"
                  style={{ animationDelay: '3200ms' }}
                >
                  <span className="text-emerald-400">$</span>{' '}
                  <span className="cursor-blink text-zinc-200" />
                </div>
              </div>
            </div>

            {/* Glow underneath terminal */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-indigo-500/10 blur-2xl rounded-full" />
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how-it-works" className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-grid-dense" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-light text-accent text-xs font-semibold uppercase tracking-wider mb-4">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900">
              Three steps. Zero hassle.
            </h2>
            <p className="mt-4 text-zinc-500 text-lg max-w-lg mx-auto">
              From link to submitted application in under three minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <div
                key={item.step}
                className={`animate-slide-up stagger-${i + 1} group relative`}
              >
                {/* Connector line (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-14 -right-4 w-8 border-t-2 border-dashed border-zinc-300 z-10" />
                )}

                <div className="relative bg-white rounded-3xl border border-zinc-200 p-8 hover:border-zinc-300 transition-all duration-300 hover:shadow-card h-full">
                  {/* Step number */}
                  <div className="absolute -top-4 -right-2 text-6xl font-black text-zinc-100 select-none pointer-events-none">
                    {item.step}
                  </div>

                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${item.bgColor} ${item.textColor} mb-6`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== VIDEO DEMO ===================== */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-light text-accent text-xs font-semibold uppercase tracking-wider mb-4">
              See It In Action
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900">
              Watch how Handle works
            </h2>
            <p className="mt-4 text-zinc-500 text-lg max-w-lg mx-auto">
              A quick walkthrough of the entire process — from pasting a link to
              a submitted application.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-zinc-200 shadow-elevated bg-zinc-900 aspect-video group">
              {/* Placeholder — swap the contents of this div with a <video> or <iframe> later */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-zinc-900 to-violet-950" />
                <div className="absolute top-[20%] left-[15%] w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl" />
                <div className="absolute bottom-[15%] right-[15%] w-56 h-56 bg-violet-500/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col items-center gap-5">
                  <button className="flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-default">
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                  <p className="text-sm text-zinc-400 font-medium">
                    Video coming soon
                  </p>
                </div>
              </div>
            </div>

            {/* Caption */}
            <p className="mt-4 text-center text-xs text-zinc-400">
              Full tutorial &mdash; paste a link, let AI fill forms, track results
            </p>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="py-28 px-6 bg-white border-y border-zinc-200 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-light text-accent text-xs font-semibold uppercase tracking-wider mb-4">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900">
              Smarter than copy-paste.
            </h2>
            <p className="mt-4 text-zinc-500 text-lg max-w-lg mx-auto">
              AI that actually understands job applications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`animate-slide-up stagger-${i + 1} group relative bg-zinc-50 rounded-3xl p-8 border border-zinc-100 hover:bg-white hover:border-zinc-200 hover:shadow-card transition-all duration-300`}
              >
                <div className="flex items-start gap-5">
                  <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-zinc-200 text-zinc-600 group-hover:text-accent group-hover:border-accent/20 group-hover:bg-accent-light transition-all duration-300 flex-shrink-0">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900 mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIAL / QUOTE ===================== */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-8xl text-zinc-100 font-serif select-none pointer-events-none">
              &ldquo;
            </span>
            <blockquote className="relative text-2xl sm:text-3xl font-medium text-zinc-800 leading-relaxed">
              I used to spend 4 hours a day filling out job applications.
              Now I paste links and grab coffee.{' '}
              <span className="gradient-text">Handle changed everything.</span>
            </blockquote>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-sm font-bold">
                E
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-900">Early User</p>
                <p className="text-xs text-zinc-500">Software Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="py-28 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl" />

            <div className="relative px-8 py-20 sm:px-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-medium mb-6 backdrop-blur-sm border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                Free to get started
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Stop filling forms.
                <br />
                <span className="text-indigo-300">Start landing interviews.</span>
              </h2>
              <p className="mt-6 text-zinc-400 text-lg max-w-lg mx-auto">
                Join hundreds of job seekers who automated the boring part of
                job hunting.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={isLoggedIn ? '/dashboard' : '/signup'}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-zinc-900 text-sm font-semibold rounded-2xl hover:bg-zinc-100 transition-all duration-300 active:scale-[0.97] shimmer-hover"
                >
                  {isLoggedIn ? 'Go to Dashboard' : 'Start Applying Free'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  No credit card required
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="py-12 px-6 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <span className="text-sm font-semibold text-zinc-900">Handle</span>
              <span className="hidden sm:block text-zinc-200">·</span>
              <p className="text-sm text-zinc-400 text-center">
                Built for people who&apos;d rather not fill another form.
              </p>
              <span className="hidden sm:block text-zinc-200">·</span>
              <button
                onClick={() => {
                  setFeedbackOpen(true);
                  setFeedbackSent(false);
                  setFeedbackError('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 text-zinc-600 text-sm font-medium rounded-xl hover:bg-zinc-200 hover:text-zinc-900 transition-all duration-200"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Give Feedback
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Handle. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ===================== FEEDBACK MODAL ===================== */}
      {feedbackOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-elevated animate-scale-in">
            {feedbackSent ? (
              <div className="text-center py-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 mx-auto mb-4">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                  Thanks for the feedback!
                </h3>
                <p className="text-sm text-zinc-500 mb-6">
                  We appreciate you taking the time. Your input helps us
                  build a better Handle.
                </p>
                <button
                  onClick={() => setFeedbackOpen(false)}
                  className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-light text-accent">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">
                        Give Feedback
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Help us make Handle better
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFeedbackOpen(false)}
                    className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                        Name
                        <span className="text-zinc-400 font-normal">
                          {' '}
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={feedbackData.name}
                        onChange={(e) =>
                          setFeedbackData({
                            ...feedbackData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                        Email
                        <span className="text-zinc-400 font-normal">
                          {' '}
                          (optional)
                        </span>
                      </label>
                      <input
                        type="email"
                        value={feedbackData.email}
                        onChange={(e) =>
                          setFeedbackData({
                            ...feedbackData,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Feedback
                    </label>
                    <textarea
                      value={feedbackData.message}
                      onChange={(e) =>
                        setFeedbackData({
                          ...feedbackData,
                          message: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus-ring resize-none"
                      placeholder="What do you think about Handle? Any bugs, feature requests, or ideas..."
                    />
                  </div>

                  {feedbackError && (
                    <p className="text-sm text-red-500">{feedbackError}</p>
                  )}

                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={
                      feedbackSending || !feedbackData.message.trim()
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {feedbackSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
