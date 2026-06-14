import { JwtHelpers } from "../../../utils/jwt.helper";
import config from "../../../config";

// Temporary implementations for missing storage utilities
const getFromLocalStorage = (key: string): string | null => {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(key);
};
const removeFromLocalStorage = (key: string): void => {
  if (typeof localStorage !== "undefined") localStorage.removeItem(key);
};
const setToLocalStorage = (key: string, value: string): void => {
  if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
};

const AUTH_KEY = "auth-token"; // Temporary replacement for AUTH_KEY
export { AUTH_KEY };

const AUTH_CHANGE_EVENT = "story-spark-auth-change";


const emitAuthChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export type AuthUserInfo = {
  email: string;
  userId: string;
  name: string;
  postsCount: number;
  role: string;
  subscriptionType: string;
  exp: number;
  iat: number;
  avatar?: string;
};

// Raw shape of the decoded JWT payload — fields are optional because
// different token versions or providers may omit some of them
interface RawJwtPayload {
  email?: string;
  userId?: string;
  _id?: string;
  name?: string;
  postsCount?: number;
  role?: string;
  subscriptionType?: string;
  exp?: number;
  iat?: number;
  avatar?: string;
}

// Maps raw JWT payload to a typed AuthUserInfo object
// Uses optional chaining + fallbacks to safely handle any missing fields
const buildUserInfo = (decodedData: RawJwtPayload): AuthUserInfo => ({
  email: decodedData?.email || "",
  userId: decodedData?.userId || decodedData?._id || "",
  name: decodedData?.name || "",
  postsCount: decodedData?.postsCount || 0,
  role: decodedData?.role || "guest",
  subscriptionType: decodedData?.subscriptionType || "free",
  exp: decodedData?.exp || 0,
  iat: decodedData?.iat || 0,
  avatar: decodedData?.avatar || "",
});

const getValidDecodedToken = () => {
  const authToken = getFromLocalStorage(AUTH_KEY);

  if (authToken) {
    try {
      const decodedData = JwtHelpers.verifyToken(authToken, config.jwt.secret) as RawJwtPayload;
      if (
        typeof decodedData.exp === "number" &&
        decodedData.exp <= Math.floor(Date.now() / 1000)
      ) {
        removeFromLocalStorage(AUTH_KEY);
        return null;
      }
      return buildUserInfo(decodedData);
    } catch (error) {
      console.error("Invalid auth token:", error);
      removeFromLocalStorage(AUTH_KEY);
      return null;
    }
  }
  return null;
};

export interface AccessToken {
  accessToken: string;
}

export const storeUserInfo = ({ accessToken }: AccessToken) => {
  const result = setToLocalStorage(AUTH_KEY, accessToken);
  emitAuthChange();
  return result;
};

export const getUserInfo = (): AuthUserInfo | null => {
  return getValidDecodedToken();
};

export const isLoggedIn = () => {
  return !!getValidDecodedToken();
};

export const removeUserInfo = () => {
  const result = removeFromLocalStorage(AUTH_KEY);
  emitAuthChange();
  return result;
};

export const getToken = () => getFromLocalStorage(AUTH_KEY);

export const authChangeEventName = AUTH_CHANGE_EVENT;

export const AuthService = {
  // Temporary placeholders for missing auth methods
  login: async (body: any) => ({ accessToken: "", refreshToken: "" }),
  register: async (body: any) => ({ accessToken: "", refreshToken: "" }),
  refreshToken: async (token: string) => ({ accessToken: "", refreshToken: "" }),
  logout: async (token: string) => {},
  googleLogin: async (body: any) => ({ accessToken: "", refreshToken: "" }),
  changePassword: async (user: any, body: any) => {},
  forgotPassword: async (email: string) => ({}),
  resetPassword: async (body: any) => ({ accessToken: "", refreshToken: "" }),
  storeUserInfo,
  getUserInfo,
  isLoggedIn,
  removeUserInfo,
  getToken,
  authChangeEventName,
};