import { defineEventHandler, useQuery } from 'h3';
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { code } = useQuery(event);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = 'http://localhost:3000/api/auth/google/callback';

  try {
    // Exchange code for tokens
    const tokenResponse = await $fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
    });

    const { access_token } = tokenResponse;

    // Fetch user info from Google
    const userInfo = await $fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { sub: googleId, email, name, picture } = userInfo;

    if (!email) {
      throw new Error('Google account does not provide an email address');
    }

    // Check if a user with the provided email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Link the Google account to the existing user if not already linked
      if (!existingUser.googleId) {
        await prisma.user.update({
          where: { email },
          data: { googleId, googleEmail: email },
        });
      }

      return { success: true, message: 'Google account linked successfully', user: existingUser };
    }

    // Create a new user if no match is found
    const newUser = await prisma.user.create({
      data: {
        username: name || `user-${googleId.substring(0, 8)}`, // Fallback username
        email,
        googleId,
        googleEmail: email,
        avatarImage: picture,
      },
    });

    return { success: true, message: 'Account created successfully', user: newUser };
  } catch (error) {
    console.error('Google Auth Error:', error);
    return { success: false, message: 'Authentication failed' };
  }
});
