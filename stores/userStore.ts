import { defineStore } from 'pinia';
import type { User } from '@prisma/client';
import { errorHandler } from '../server/api/utils/error';
import { useMilestoneStore } from './milestoneStore';

interface UserState {
  user: User | null;
  token: string;
  apiKey: string | null;
  loading: boolean;
  lastError: string | null;
  highClickScores: number[]; // Assuming it's an array of numbers
  highMatchScores: number[]; // Assuming it's an array of numbers
  stayLoggedIn: boolean;
  milestones: number[];
}

export const useUserStore = defineStore({
  id: 'user',
  state: (): UserState => ({
    user: null,
    token: '',
    apiKey: typeof window !== 'undefined' ? localStorage.getItem('api_key') : null,
    loading: false,
    lastError: null,
    highClickScores: [],
    highMatchScores: [],
    stayLoggedIn: true,
    milestones: [],
  }),

  getters: {
    karma(): number {
      return this.user ? this.user.karma : 1000;
    },
    mana(): number {
      return this.user?.mana || this.milestones.length;
    },
    isLoggedIn(): boolean {
      return Boolean(this.token) && Boolean(this.user);
    },
    userId(): number {
      return this.user ? this.user.id : 0;
    },
    username(): string {
      return this.user ? this.user.username : 'Kind Guest';
    },
    email(): string {
      return this.user?.email || '';
    },
    role(): string {
      return this.user ? this.user.Role : 'GUEST';
    },
    avatarImage(): string {
      return this.user?.avatarImage || '/images/kindart.webp';
    },
    bio(): string {
      return this.user?.bio || 'I was born and then things happened and now I am here.';
    },
    clickRecord(): number {
      return this.user?.clickRecord || 0;
    },
    matchRecord(): number {
      return this.user?.matchRecord || 0;
    },
  },

  actions: {
    initializeUser() {
      const stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true';
      const storedToken = this.getFromLocalStorage('token');

      this.stayLoggedIn = stayLoggedIn;
      if (storedToken) {
        this.token = storedToken;
      }

      if (stayLoggedIn && storedToken) {
        this.fetchUserDataByToken(storedToken);
      }
    },
    async fetchUserDataByToken(token: string) {
      try {
        const response = await this.apiCall('/api/auth/validate', 'POST', { token });

        if (response.success) {
          this.setUser(response.user);
        }
      } catch (error) {
        this.setError(error);
      }
    },
    async fetchUserByApiKey(): Promise<void> {
      if (!this.apiKey) return;
      try {
        const response = await this.apiCall('/api/user');
        if (response.success) {
          this.setUser(response.user);
        } else {
          throw new Error('Failed to fetch user');
        }
      } catch (error) {
        this.setError(error);
      }
    },
    setUser(userData: User): void {
      this.user = { ...userData };
      this.updateKarmaAndMana().catch((error) => {
        console.error('Failed to update karma and mana:', error);
      });
    },
    setStayLoggedIn(value: boolean) {
      try {
        this.saveToLocalStorage('stayLoggedIn', value.toString());
        this.stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true';
      } catch (error) {
        this.setError(error);
      }
    },
    async fetchHighClickScores() {
      try {
        const response = await fetch('/api/milestones/highClickScores');
        const data = await response.json();
        this.highClickScores = data.milestones;
      } catch (error) {
        this.setError(error);
      }
    },
    async fetchHighMatchScores() {
      try {
        const response = await fetch('/api/milestones/highMatchScores');
        const data = await response.json();
        this.highMatchScores = data.milestones;
      } catch (error) {
        this.setError(error);
      }
    },
    async fetchUsernameById(userId: number): Promise<string | null> {
      try {
        const response = await fetch(`/api/users/${userId}/username`);
        if (response.ok) {
          const data = await response.json();
          return data.username || 'Unknown';
        } else {
          throw new Error(await response.text());
        }
      } catch (error) {
        this.setError(error);
        return null;
      }
    },
    async updateClickRecord(newScore: number) {
      try {
        const userId = this.userId;
        if (!userId) throw new Error('User ID is not available');

        const response = await fetch('/api/milestones/updateClickRecord', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newScore, userId }),
        });

        const data = await response.json();
        if (data.success) return 'Updated';
      } catch (error) {
        this.setError(error);
      }
    },
    async updateKarmaAndMana(): Promise<{ success: boolean, message: string }> {
      try {
        const milestoneStore = useMilestoneStore();

        await Promise.all([milestoneStore.fetchMilestones(), milestoneStore.fetchMilestoneRecords()]);

        const milestoneCount = milestoneStore.getMilestoneCountForUser(this.userId);

        const updatedKarma: number = milestoneCount * 1000;
        const updatedMana: number = milestoneCount;

        const response = await fetch(`/api/users/${this.userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: this.userId, karma: updatedKarma, mana: updatedMana }),
        });

        const data = await response.json();
        if (data.success) {
          if (this.user) {
            this.user.karma = updatedKarma;
            this.user.mana = updatedMana;
          }
          return { success: true, message: 'Successfully updated karma and mana.' };
        } else {
          return { success: false, message: data.message || 'Failed to update karma and mana.' };
        }
      } catch (error) {
        this.setError(error);
        return { success: false, message: this.lastError || 'An error occurred while updating karma and mana.' };
      }
    },
    async updateMatchRecord(newScore: number) {
      try {
        const userId = this.userId;
        if (!userId) throw new Error('User ID is not available');

        const response = await fetch('/api/milestones/updateMatchRecord', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newScore, userId }),
        });

        const data = await response.json();
        if (data.success) return this.fetchHighMatchScores();
      } catch (error) {
        this.setError(error);
      }
    },
    logout(): void {
      this.user = null;
      this.token = '';
      this.apiKey = null;

      try {
        this.removeFromLocalStorage('api_key');
        this.removeFromLocalStorage('token');
        this.removeFromLocalStorage('user');
        this.removeFromLocalStorage('stayLoggedIn');
      } catch (error) {
        this.setError(error);
      }

      this.setStayLoggedIn(false);
    },
    setToken(newToken: string): void {
      this.token = newToken;
      this.saveToLocalStorage('token', newToken);
    },
    setApiKey(apiKey: string): void {
      this.apiKey = apiKey;
      this.saveToLocalStorage('api_key', apiKey);
    },
    startLoading() {
      this.loading = true;
    },
    stopLoading() {
      this.loading = false;
    },
    setMilestones(milestoneIds: number[]) {
      this.milestones = milestoneIds;
    },
    setError(error: unknown) {
      const { message } = errorHandler(error instanceof Error ? error : new Error(String(error)));
      this.lastError = message || 'An unknown error occurred.';
    },
    getFromLocalStorage(key: string): string | null {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    },
    saveToLocalStorage(key: string, value: string): void {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },
    removeFromLocalStorage(key: string): void {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    },
    async apiCall(endpoint: string, method: string = 'GET', body?: any) {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
          const { message } = await response.json();
          throw new Error(message || 'Network response was not ok');
        }
        return await response.json();
      } catch (error) {
        this.setError(error);
        throw error;
      }
    },
    async getUsernames(): Promise<string[]> {
      try {
        const { usernames } = await this.apiCall('/api/users/usernames');
        return usernames;
      } catch (error) {
        this.setError(error);
        return [];
      }
    },
    async updateUserInfo(updatedUserInfo: Partial<User>) {
      try {
        const response = await this.apiCall('/api/users', 'PATCH', updatedUserInfo);
        if (response.success) {
          this.setUser(response.user);
          return { success: true, message: 'User info updated successfully' };
        } else {
          return { success: false, message: response.message };
        }
      } catch (error) {
        this.setError(error);
        return { success: false, message: this.lastError };
      }
    },
    async login(credentials: { username: string, password?: string }) {
      this.startLoading();
      try {
        const response = await this.apiCall('/api/auth/login', 'POST', credentials);
        if (response.success) {
          this.setUser(response.user);
          this.setToken(response.token);
          this.setApiKey(response.apiKey);

          if (this.stayLoggedIn) {
            this.saveToLocalStorage('token', response.token);
          }

          return { success: true };
        } else {
          return { success: false, message: response.message };
        }
      } catch (error) {
        this.setError(error);
        return { success: false, message: this.lastError };
      } finally {
        this.stopLoading();
      }
    },
    async validate(): Promise<boolean> {
      try {
        const credentials = this.token ? { token: this.token } : { apiKey: this.apiKey };

        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        const responseData = await response.json();

        if (responseData.success) {
          this.setUser(responseData.user);
          return true;
        } else {
          this.setError(new Error('Invalid token or API key'));
          return false;
        }
      } catch (error) {
        this.setError(error);
        return false;
      }
    },
    async register(userData: { username: string, email?: string, password?: string }): Promise<{ success: boolean, user?: User, token?: string, message?: string }> {
      try {
        const response = await this.apiCall('/api/users/register', 'POST', userData);
        if (response.success) {
          this.setUser(response.user);
          this.setToken(response.token);
          if (response.apiKey) {
            this.setApiKey(response.apiKey);
          }
          return { success: true, user: response.user, token: response.token };
        } else {
          return { success: false, message: response.message || 'An error occurred during registration.' };
        }
      } catch (error) {
        this.setError(error);
        return { success: false, message: this.lastError || 'An unknown error occurred.' };
      }
    },
  },
});

export type { User };
