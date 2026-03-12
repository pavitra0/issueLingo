import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url || !url.includes('github.com') || !url.includes('/issues/')) {
            return NextResponse.json({ error: 'Invalid GitHub issue URL' }, { status: 400 });
        }

        // Parse GitHub URL: https://github.com/owner/repo/issues/123
        const urlParts = new URL(url).pathname.split('/');
        if (urlParts.length < 5) {
            return NextResponse.json({ error: 'Invalid GitHub issue URL format' }, { status: 400 });
        }
        const owner = urlParts[1];
        const repo = urlParts[2];
        const issueNumber = urlParts[4];

        // Fetch from GitHub
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'IssueLingo-App'
        };

        if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here') {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        const [issueRes, commentsRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, { headers }),
            fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=5`, { headers })
        ]);

        if (!issueRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch issue from GitHub' }, { status: 400 });
        }

        const issue = await issueRes.json();
        const comments = commentsRes.ok ? await commentsRes.json() : [];

        return NextResponse.json({
            title: issue.title,
            number: issue.number,
            state: issue.state, // 'open' or 'closed'
            createdAt: issue.created_at,
            commentsCount: issue.comments,
            author: issue.user?.login || 'unknown',
            avatarUrl: issue.user?.avatar_url || 'https://github.com/identicons/github.png',
            authorAssociation: issue.author_association,
            body: issue.body || 'No description provided.',
            labels: issue.labels?.map((l: any) => ({ name: l.name, color: l.color })) || [],
            assignees: issue.assignees?.map((a: any) => ({ login: a.login, avatarUrl: a.avatar_url })) || [],
            milestone: issue.milestone?.title || null,
            comments: comments.map((c: any) => ({
                id: c.id,
                author: c.user?.login,
                avatarUrl: c.user?.avatar_url,
                authorAssociation: c.author_association,
                createdAt: c.created_at,
                body: c.body
            }))
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
