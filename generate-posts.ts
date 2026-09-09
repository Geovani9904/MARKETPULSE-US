import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { generateFinancialPost } from './lib/generate-post'

async function main(): Promise<void> {
  try {
    const result = await generateFinancialPost()

    if (result.status === 'created') {
      console.log(`[TypeScript] Noticia real consumida e inyectada con éxito. ID: ${result.postId}`)
    } else if (result.status === 'duplicate') {
      console.log(`[TypeScript] ${result.message} "${result.title}"`)
    } else {
      console.log(`[TypeScript] ${result.message}`)
    }
  } catch (error: unknown) {
    console.error('Error al consumir la API de noticias:', (error as Error).message)
  }
}

main()