import { defineStore } from 'pinia';
import type { User } from '@prisma/client';
import { useErrorStore, ErrorType } from '@/stores/errorStore'; // Import errorStore
import { useMilestoneStore } from './milestoneStore';

interface UserState {
  user: User | null;
  token: string;
  apiKey: string | null;
  loading: boolean;
  highClickScores: number[];
  highMatchScores: number[];
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
        useErrorStore().setError(ErrorType.AUTH_ERROR, error); // Use errorStore with ErrorType
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
        useErrorStore().setError(ErrorType.AUTH_ERROR, error); // Use errorStore with ErrorType
      }
    },

    setUser(userData: User): void {
      this.user = { ...userData };
      this.updateKarmaAndMana().catch((error) => {
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
      });
    },

    setStayLoggedIn(value: boolean) {
      try {
        this.saveToLocalStorage('stayLoggedIn', value.toString());
        this.stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true';
      } catch (error) {
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
      }
    },

    async fetchHighClickScores() {
      try {
        const response = await fetch('/api/milestones/highClickScores');
        const data = await response.json();
        this.highClickScores = data.milestones;
      } catch (error) {
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
      }
    },

    async fetchHighMatchScores() {
      try {
        const response = await fetch('/api/milestones/highMatchScores');
        const data = await response.json();
        this.highMatchScores = data.milestones;
      } catch (error) {
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
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
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
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
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
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
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
        return { success: false, message: useErrorStore().getErrors().map(e => e.message).join(', ') || 'An error occurred while updating karma and mana.' };
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
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
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
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
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

    async apiCall(endpoint: string, method: string = 'GET', body?: unknown) {
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
        useErrorStore().setError(ErrorType.NETWORK_ERROR, error); // Use errorStore with ErrorType
        throw error;
      }
    },

    async getUsernames(): Promise<string[]> {
      try {
        const { usernames } = await this.apiCall('/api/users/usernames');
        return usernames;
      } catch (error) {
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
        return [];
      }
    },

    async updateUserInfo(userInfo: Partial<User>): Promise<void> {
      try {
        await this.apiCall(`/api/users/${this.userId}`, 'PATCH', userInfo);
        this.user = { ...this.user, ...userInfo } as User;
      } catch (error) {
        useErrorStore().setError(ErrorType.GENERAL_ERROR, error); // Use errorStore with ErrorType
      }
    },

    saveToLocalStorage(key: string, value: string) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },

    removeFromLocalStorage(key: string) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    },

    getFromLocalStorage(key: string): string | null {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
  },
});
