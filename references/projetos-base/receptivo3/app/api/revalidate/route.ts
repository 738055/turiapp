import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Ex: POST /api/revalidate?secret=<token>
// Body: { "path": "/tours/my-tour-slug" }
// Or: { "paths": ["/tours/my-tour-slug", "/tours/search"] }

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Compare with a secret stored in environment variables
  if (secret !== process.env.REVALIDATION_SECRET_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const body = await request.json();
  const path = body.path;
  const paths = body.paths;

  if (!path && !paths) {
    return NextResponse.json({ message: 'Path(s) not provided' }, { status: 400 });
  }

  try {
    if (path) {
      revalidatePath(path);
      console.log(`Revalidated path: ${path}`);
    }

    if (paths && Array.isArray(paths)) {
      paths.forEach((p: string) => {
        revalidatePath(p);
        console.log(`Revalidated path: ${p}`);
      });
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err: any) {
    console.error('Error revalidating:', err);
    return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
  }
}
