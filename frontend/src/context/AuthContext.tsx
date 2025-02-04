"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface AuthContextType {
  user: string | null; // Now stores `userId` instead of email
  token: string | null;
  roles: string[];
  currentRole: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null); // Stores userId now
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("client");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Load stored auth state on mount
  useEffect(() => {
    console.log("🔹 Checking stored authentication state...");

    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user"); // This should now be userId
    const savedRoles = JSON.parse(localStorage.getItem("roles") || "[]");
    const savedCurrentRole = localStorage.getItem("currentRole");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser); // Ensure we store userId instead of email
      setRoles(savedRoles);

      const validRole = savedRoles.includes(savedCurrentRole) ? savedCurrentRole : savedRoles[0] || "client";
      setCurrentRole(validRole);

      console.log(`✅ Loaded userId: ${savedUser}, Roles: ${savedRoles}, Current Role: ${validRole}`);
    }
  }, []);

  // ✅ Login function
  const login = async (email: string, password: string) => {
    try {
      console.log(`🔹 Attempting login at: ${API_URL}/api/auth/login`);
      
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const rawResponse = await res.text();
      console.log("🔹 Raw API Response:", rawResponse);

      if (!res.ok) {
        throw new Error(`Login failed: ${res.status} ${res.statusText}`);
      }

      const data = JSON.parse(rawResponse);
      console.log("✅ Parsed Response:", data);

      if (!data.token || !data.userId || !data.roles) {
        throw new Error("❌ Invalid login response: Missing token, userId, or roles.");
      }

      setUser(data.userId); // Store `userId`, not email
      setToken(data.token);
      setRoles(data.roles);

      const validRole = data.roles.includes(currentRole) ? currentRole : data.roles[0] || "client";
      setCurrentRole(validRole);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", data.userId); // Store userId instead of email
      localStorage.setItem("roles", JSON.stringify(data.roles));
      localStorage.setItem("currentRole", validRole);

      console.log(`✅ Login successful. UserID: ${data.userId}, Role: ${validRole}`);
    } catch (error) {
      console.error("❌ Login error:", (error as Error).message);
      throw error;
    }
  };

  // ✅ Logout function
  const logout = () => {
    console.log("🔹 Logging out...");
    setUser(null);
    setToken(null);
    setRoles([]);
    setCurrentRole("client");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("roles");
    localStorage.removeItem("currentRole");

    console.log("✅ Logged out successfully.");
  };

  // ✅ Switch user role
  const switchRole = (newRole: string) => {
    if (!roles.includes(newRole)) {
      console.error(`❌ Role switch failed: User does not have role '${newRole}'. Available roles: ${roles}`);
      throw new Error("❌ You are not registered for this role");
    }

    console.log(`🔹 Switching role to: ${newRole}`);
    setCurrentRole(newRole);
    localStorage.setItem("currentRole", newRole);
  };

  return (
    <AuthContext.Provider value={{ user, token, roles, currentRole, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("❌ useAuth must be used within an AuthProvider");
  return context;
};
