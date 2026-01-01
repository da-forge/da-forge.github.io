import { saveAuthToken, clearAuthToken, getAuthToken } from "./storage";
import { GITHUB_CONFIG } from "@/config";

/**
 * Validate a Personal Access Token by making a test API call
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${GITHUB_CONFIG.apiBaseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Login with a Personal Access Token
 */
export async function loginWithToken(token: string): Promise<{ success: boolean; error?: string }> {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return { success: false, error: "Please enter a token" };
  }

  const isValid = await validateToken(trimmedToken);

  if (!isValid) {
    return { success: false, error: "Invalid token. Please check and try again." };
  }

  await saveAuthToken(trimmedToken, "bearer", "");
  return { success: true };
}

/**
 * Logout - clear all auth data
 */
export async function logout(): Promise<void> {
  await clearAuthToken();
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null;
}

/**
 * Get the current auth token (for API requests)
 */
export { getAuthToken };
