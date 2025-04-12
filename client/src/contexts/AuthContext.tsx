import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  username: string;
  googleId: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check for existing user on load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
      }
    }
    
    setIsLoading(false);
  }, []);
  
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // This is a mock Google auth since we can't implement the full OAuth flow here
      // In a real application, you would use Google's OAuth API
      const mockGoogleResponse = {
        googleId: "123456789", 
        email: "user@example.com",
        name: "Demo User",
        avatar: "https://ui-avatars.com/api/?name=Demo+User&background=random"
      };
      
      // Send the Google ID to our backend
      const response = await apiRequest("POST", "/api/auth/google", mockGoogleResponse);
      const data = await response.json();
      
      // Save the user in state and localStorage
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast({
        title: "Successfully signed in",
        description: `Welcome, ${data.user.username}!`,
      });
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in");
      toast({
        title: "Authentication Error",
        description: err.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
