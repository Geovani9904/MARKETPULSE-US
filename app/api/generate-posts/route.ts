import { NextRequest } from 'next/server'
import { generateFinancialPost } from '@/lib/generate-post'

// Hobby permite hasta 60s por función; sobrado para esta tarea.
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Vercel envía automáticamente "Authorization: Bearer <CRON_SECRET>"
  // en cada invocación del cron. Sin la variable definida, rechazamos todo.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await generateFinancialPost()
    return Response.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[generate-posts]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}