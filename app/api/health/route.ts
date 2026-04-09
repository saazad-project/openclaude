import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasLongcatApiKey: !!process.env.LONGCAT_API_KEY,
      longcatApiUrl: process.env.LONGCAT_API_URL || 'Not set',
      longcatModel: process.env.LONGCAT_MODEL || 'Not set',
      nodeVersion: process.version,
    },
    service: 'OpenClaude Web',
    version: '1.0.0',
  }

  return NextResponse.json(health)
}
