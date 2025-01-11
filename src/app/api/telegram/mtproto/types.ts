declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TELEGRAM_API_ID: string;
      TELEGRAM_API_HASH: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
    }
  }
} 