import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear the httpOnly auth token cookie
  response.cookies.delete('auth_token');
  
  return response;
}
