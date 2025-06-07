import { z } from 'zod'

const envSchema = z.object({
  VITE_APPWRITE_ENDPOINT: z.string().url(),
  VITE_APPWRITE_PROJECT_ID: z.string().min(1),
  VITE_APPWRITE_DATABASE_ID: z.string().min(1),
  VITE_PAYSTACK_PUBLIC_KEY: z.string().min(1),
})

export const validateEnv = () => {
  const env = {
    VITE_APPWRITE_ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT,
    VITE_APPWRITE_PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    VITE_APPWRITE_DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    VITE_PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  }

  try {
    const validatedEnv = envSchema.parse(env)
    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'))
      throw new Error(`Missing or invalid environment variables: ${missingVars.join(', ')}`)
    }
    throw error
  }
}

export const env = validateEnv() 