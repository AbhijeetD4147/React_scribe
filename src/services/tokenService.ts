import {Apipath} from "../Comman/Constants";
import axios from "axios";

// Service for handling token-related operations
export const tokenService = {
  // Get token on application load
  getTokenOnLoad: async (): Promise<string | null> => {
    // Use proxy path instead of direct URL
    const url = `/token-api/api/Customer/GetTokenAsyncNew?accountId=DemoScribe`;
    
    try {
      const response = await axios.get(url);
      if (response.status === 200) {
        // Store token in localStorage for use across the app
        if (response.data) {
          Apipath.token = response.data;
        }
        return response.data || null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching token on load:", error);
      return null;
    }
  },
  
  // Get stored token
  getStoredToken: (): string | null => {
    return Apipath.token;
  },
  
  // Clear token (for logout)
  clearToken: (): void => {
    Apipath.token = '';
  }
};