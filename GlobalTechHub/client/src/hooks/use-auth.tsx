import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, "password">, Error, RegisterData>;
  updateProfileMutation: UseMutationResult<Omit<User, "password">, Error, ProfileUpdateData>;
};

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

// Helper type to fix omit issues
type OmitFields = {
  isVpnUser: true,
  createdAt: true,
  status: true,
  statusMessage: true,
};

export const registerSchema = insertUserSchema.omit({
  isVpnUser: true,
  createdAt: true,
  status: true,
  statusMessage: true,
} as unknown as OmitFields);

type RegisterData = z.infer<typeof registerSchema>;

const profileUpdateSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
  role: z.enum(["buyer", "seller", "both"]).optional(),
  status: z.enum(["active", "busy", "unavailable"]).optional(),
  statusMessage: z.string().max(50).optional(),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const validatedData = loginSchema.parse(credentials);
      const res = await apiRequest("POST", "/api/login", validatedData);
      return await res.json();
    },
    onSuccess: (user: Omit<User, "password">) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const validatedData = registerSchema.parse(credentials);
      const res = await apiRequest("POST", "/api/register", validatedData);
      return await res.json();
    },
    onSuccess: (user: Omit<User, "password">) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to TechTalentHub, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      const message = error.message.includes("already exists") 
        ? "An account with this email already exists. Please login instead."
        : error.message;
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: ProfileUpdateData) => {
      if (!user) throw new Error("Not logged in");
      const validatedData = profileUpdateSchema.parse(updates);
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, validatedData);
      return await res.json();
    },
    onSuccess: (updatedUser: Omit<User, "password">) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
