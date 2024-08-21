import { defineEventHandler, readBody } from 'h3';
import { errorHandler } from '../utils/error';
import { fetchUserById } from '../users';
import { validateUserCredentials, verifyJwtToken, validateApiKey } from '.';

export default defineEventHandler(async (event) => {
  try {
    const { type, data } = await readBody(event);
    if (!type || !data) {
      throw new Error('Both validation type and data are required.');
    }

    switch (type) {
      case 'credentials': {
        const { username, password } = data;
        if (!username || !password) {
          throw new Error('Both username and password must be provided for credentials validation.');
        }
        const validationResponse = await validateUserCredentials(username, password);
        return validationResponse
          ? { success: true, message: '🚀 Credentials are valid. You are good to go!', data: validationResponse }
          : { success: false, message: '🚀 Mission abort! Invalid username or password.' };
      }
    
      case 'token': {
        const { token } = data;
        if (!token) {
          throw new Error('Token is required for token validation.');
        }
        const verificationResult = await verifyJwtToken(token);
        if (verificationResult.userId) {
          const userData = await fetchUserById(verificationResult.userId);
          return { success: true, message: '🚀 Token is valid. You are good to go!', user: userData };
        }
        return { success: false, message: '🚀 Mission abort! Invalid token.' };
      }
    
      case 'apiKey': {
        const { apiKey } = data;
        if (!apiKey) {
          throw new Error('API key is required for API key validation.');
        }
        const isApiKeyValid = await validateApiKey(apiKey);
        return isApiKeyValid
          ? { success: true, message: '🚀 API key is valid. You are good to go!' }
          : { success: false, message: '🚀 Mission abort! Invalid API key.' };
      }
    
      default:
        return { success: false, message: '🚀 Mission abort! Invalid validation type provided.' };
    }
    
  } catch (error) {
    const { message } = errorHandler(error);
    return { success: false, message: `🚀 Mission abort! ${message}` };
  }
});
