# Telegram Login App

A Next.js application that demonstrates secure authentication using Telegram Login Widget. This app allows users to quickly sign in using their Telegram account without the need for traditional username/password credentials.

## Features

- 🔐 Secure authentication using Telegram Login Widget
- ⚡ Fast and responsive Next.js application
- 🔄 Automatic session management
- 🎨 Clean and modern UI using Geist font
- 📱 Mobile-responsive design

## Getting Started

1. First, obtain your Telegram API credentials:
   - Go to [my.telegram.org](https://my.telegram.org/auth)
   - Log in with your phone number
   - Click on 'API development tools'
   - Create a new application if you haven't already
   - You will receive your `api_id` and `api_hash`
   - Save these credentials securely

2. Configure environment variables:
   ```bash
   cp .venv.example .env.local
   ```
   Fill in your Telegram API credentials in the `.env.local` file:
   - `TELEGRAM_API_ID`: Your API ID from my.telegram.org
   - `TELEGRAM_API_HASH`: Your API Hash from my.telegram.org

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

The application implements Telegram's Login Widget to provide a seamless authentication experience. When users click the Telegram login button, they can authorize the application using their Telegram account. The app verifies the authentication data on the server side to ensure security.

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework for production
- [Telegram Login Widget](https://core.telegram.org/widgets/login) - For authentication
- [Geist Font](https://vercel.com/font) - Modern typography
- Server-side validation and session management

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
