export async function retryRequest<T>(
  request: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Request attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(1.5, i);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`All ${maxRetries} retry attempts failed.`);
  throw lastError || new Error('Request failed after multiple attempts');
} 