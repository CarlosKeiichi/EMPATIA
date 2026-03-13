import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-troque-em-producao');

const PUBLIC_ROUTES = ['/', '/cadastro', '/api/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas — deixar passar
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/logos')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Admin tentando acessar área de professor ou vice-versa
    if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/professor', req.url));
    }

    if (pathname.startsWith('/professor') && role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // Injetar dados do usuário no header para as API routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-nome', payload.nome as string);
    requestHeaders.set('x-user-email', payload.email as string);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // Token inválido — redirecionar para login
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos/).*)'],
};
