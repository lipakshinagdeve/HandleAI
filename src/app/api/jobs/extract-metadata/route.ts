import { NextRequest, NextResponse } from 'next/server';

function getDomainFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, '');
  } catch {
    return 'Job';
  }
}

function getTitleFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segments = path.split('/').filter(Boolean);
    const jobSegment = segments.find((s) => /job|position|role|career|opening/i.test(s));
    const idx = jobSegment ? segments.indexOf(jobSegment) + 1 : -1;
    if (idx > 0 && idx < segments.length) {
      const raw = segments[idx];
      return raw
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (last.length > 2 && /^[a-z-]+$/i.test(last)) {
        return last
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }
  } catch {
    // ignore
  }
  return '';
}

function extractMetaContent(html: string, patterns: { attr: string; value: string }[]): string {
  for (const { attr, value } of patterns) {
    const regex = new RegExp(
      `<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`,
      'i'
    );
    const match = html.match(regex);
    if (match?.[1]) return match[1].trim();
    const reverseRegex = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`,
      'i'
    );
    const reverseMatch = html.match(reverseRegex);
    if (reverseMatch?.[1]) return reverseMatch[1].trim();
  }
  return '';
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() || '';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let jobUrl = '';
  try {
    const body = await request.json();
    jobUrl = body.jobUrl;

    if (!jobUrl || typeof jobUrl !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Job URL is required' },
        { status: 400 }
      );
    }

    const url = jobUrl.trim();
    if (!url.startsWith('http')) {
      return NextResponse.json(
        { success: false, message: 'Invalid URL' },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const html = await res.text();

    // Extract job title: og:title > twitter:title > document title
    let jobTitle =
      extractMetaContent(html, [
        { attr: 'property', value: 'og:title' },
        { attr: 'name', value: 'twitter:title' },
      ]) || extractTitle(html);

    // Clean title: remove company suffix (e.g. "Software Engineer | Acme Inc" -> "Software Engineer")
    if (jobTitle) {
      jobTitle = jobTitle
        .split(/[|\-–—]/)[0]
        .trim();
      if (/^(apply|submit|login|sign in)/i.test(jobTitle) || jobTitle.length > 150) {
        jobTitle = '';
      }
    }

    // Extract company: og:site_name, or parse from title (Company - Job), or use domain
    let company =
      extractMetaContent(html, [
        { attr: 'property', value: 'og:site_name' },
        { attr: 'name', value: 'twitter:site' },
      ]) || '';

    if (company && (/^(apply|submit|login|sign in|twitter|linkedin)/i.test(company) || company.length > 100)) {
      company = '';
    }

    const domain = getDomainFromUrl(url);
    const urlTitle = getTitleFromUrl(url);

    return NextResponse.json({
      success: true,
      data: {
        jobTitle: jobTitle || urlTitle || 'Job Application',
        companyName: company || domain,
      },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('Extract metadata error:', error);

    // Return URL-derived fallbacks when we have a valid URL
    if (jobUrl && jobUrl.startsWith('http')) {
      return NextResponse.json({
        success: true,
        data: {
          jobTitle: getTitleFromUrl(jobUrl) || 'Job Application',
          companyName: getDomainFromUrl(jobUrl),
        },
      });
    }

    return NextResponse.json(
      { success: false, message: errMessage },
      { status: 500 }
    );
  }
}
