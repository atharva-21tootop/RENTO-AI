import { NextRequest } from 'next/server';
import { apiError } from '@/lib/utils';
import { proxyData } from '@/lib/backend-proxy';
import { getBackendAuthToken } from '@/lib/backend-auth';

export async function GET(req: NextRequest) {
  try {
    const token = await getBackendAuthToken(req);
    if (!token) {
      return apiError('Unauthorized', 401);
    }
    return proxyData('/api/phc/profile', { token });
  } catch (error) {
    console.error('GET /api/phc Proxy Error:', error);
    return apiError('Internal server error', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getBackendAuthToken(req);
    if (!token) {
      return apiError('Unauthorized', 401);
    }
    const body = await req.json();
    return proxyData('/api/phc/profile', {
      method: 'PUT',
      body,
      token,
    });
  } catch (error) {
    console.error('PUT /api/phc Proxy Error:', error);
    return apiError('Internal server error', 500);
  }
}
