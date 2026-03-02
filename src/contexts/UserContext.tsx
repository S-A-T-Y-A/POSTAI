import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User } from "../../types";

// export interface User {
//     email: string;
//     name: string;
//     picture: string;
//     credits: number;
//     plan: string;
//     createdAt: string;
//     subscriptionStatus?: string;
//     subscriptionId?: string;
// }

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  accessToken: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    // Restore accessToken from localStorage if present
    return localStorage.getItem("postai_access_token") || null;
  });

  useEffect(() => {
    if (accessToken) {
      console.log("Google Access Token:", accessToken);
      localStorage.setItem("postai_access_token", accessToken);
    } else {
      localStorage.removeItem("postai_access_token");
    }
  }, [accessToken]);
  const getHeaders = useCallback(() => {
    const email = localStorage.getItem("postai_user_email");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (email) {
      headers["X-User-Email"] = email;
    }
    return headers;
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: getHeaders(),
      });
      const data = await response.json();
      console.log("User data received from /api/auth/me:", data);
      setUser(data.user);
      if (!data.user) {
        localStorage.removeItem("postai_user_email");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    refreshUser();

    const handleMessage = (event: MessageEvent) => {
      console.log("Received message in UserContext:", event.data);
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        console.log("OAuth success message received, refreshing user...");
        if (event.data.email) {
          localStorage.setItem("postai_user_email", event.data.email);
        }
        if (event.data.accessToken) {
          setAccessToken(event.data.accessToken);
          localStorage.setItem("postai_access_token", event.data.accessToken);
        }
        // Small delay to ensure session cookie is processed
        setTimeout(() => refreshUser(), 500);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refreshUser]);

  const login = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/google/url", {
        credentials: "include",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(
          `Login failed: ${errorData.error || "Unknown error"}. Please check your environment variables.`,
        );
        return;
      }
      const { url } = await response.json();
      console.log("Opening Google Auth URL:", url);
      window.open(url, "google_auth", "width=500,height=600");
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      alert("Failed to initiate login. Please try again.");
    }
  }, [getHeaders]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: getHeaders(),
      });
      localStorage.removeItem("postai_user_email");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [getHeaders]);

  return (
    <UserContext.Provider
      value={{ user, loading, login, logout, refreshUser, accessToken }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
