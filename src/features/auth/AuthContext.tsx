import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  isSystemRole: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roleId: string;
  branchId?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  permissions: string[];
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRoleName: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  permissions: [],
  role: null,
  loading: true,
  signOut: async () => {},
  hasPermission: () => false,
  hasRoleName: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          let docSnap = await getDoc(docRef);
          let userProfile: UserProfile;

          if (docSnap.exists()) {
            userProfile = docSnap.data() as UserProfile;
          } else {
            // Default setup for new users logged in via Google Auth
            userProfile = {
               uid: currentUser.uid,
               email: currentUser.email || '',
               displayName: currentUser.displayName || 'Unknown User',
               roleId: 'viewer', // default safe role
               isActive: true
            };
            await setDoc(docRef, userProfile);
          }
          
          setProfile(userProfile);

          // Fetch Role permissions
          if (userProfile.roleId) {
            const roleRef = doc(db, "roles", userProfile.roleId);
            const roleSnap = await getDoc(roleRef);
            if (roleSnap.exists()) {
              const roleData = { id: roleSnap.id, ...roleSnap.data() } as Role;
              setRole(roleData);
              setPermissions(roleData.permissions || []);
            } else {
              setRole(null);
              setPermissions([]);
            }
          }

        } catch (error) {
          console.error("Error fetching user profile or roles:", error);
          setProfile(null);
          setRole(null);
          setPermissions([]);
        }
      } else {
        setProfile(null);
        setRole(null);
        setPermissions([]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const hasPermission = (permission: string) => {
    // If it's a super admin role, we might want to bypass, but for now we rely on explicit permissions array
    return permissions.includes(permission);
  };

  const hasRoleName = (roleName: string) => {
    return role?.name === roleName;
  }

  return (
    <AuthContext.Provider value={{ user, profile, permissions, role, loading, signOut, hasPermission, hasRoleName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
