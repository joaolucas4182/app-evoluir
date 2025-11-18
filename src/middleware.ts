import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Middleware simplificado - autenticação é gerenciada no client-side
  // Supabase usa localStorage, não cookies server-side
  
  const { pathname } = request.nextUrl;
  
  // Permitir acesso à página de auth sempre
  if (pathname.startsWith('/auth')) {
    return NextResponse.next();
  }
  
  // Para outras rotas, deixar o client-side verificar autenticação
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
