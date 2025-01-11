import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'telegram-login',
      name: 'Telegram',
      credentials: {
        phone: { label: 'Phone Number', type: 'text' },
        code: { label: 'Verification Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone) {
          return null;
        }

        try {
          // We'll handle the actual authentication in the MTProto API route
          return {
            id: credentials.phone,
            phone: credentials.phone,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
});

export { handler as GET, handler as POST }; 