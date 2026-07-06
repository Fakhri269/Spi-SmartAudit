import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

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
  refreshProfile: () => Promise<void>;
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
  refreshProfile: async () => {},
});

const ADMIN_FALLBACK_PERMS = [
  "dashboard.view",
  "master.view", "master.create", "master.update", "master.delete",
  "user.view", "user.create", "user.update", "user.delete",
  "role.view", "role.create", "role.update", "role.delete",
  "pkpt.view", "pkpt.create", "pkpt.update", "pkpt.delete", "pkpt.approve",
  "assignment.view", "assignment.create", "assignment.update", "assignment.delete", "assignment.approve",
  "kka.view", "kka.create", "kka.update", "kka.review", "kka.approve",
  "finding.view", "finding.create", "finding.update", "finding.review", "finding.approve",
  "rtl.view", "rtl.create", "rtl.update", "rtl.verify", "rtl.close",
  "evidence.upload", "evidence.download", "evidence.delete",
  "report.view", "report.export", "report.print",
  "auditTrail.view",
  "settings.view", "settings.update",
];

async function resolveRolePermissions(roleId: string): Promise<{ role: Role | null; permissions: string[] }> {
  const roleRef = doc(db, "roles", roleId);
  const roleSnap = await getDoc(roleRef);
  if (roleSnap.exists()) {
    const roleData = { id: roleSnap.id, ...roleSnap.data() } as Role;
    return { role: roleData, permissions: roleData.permissions || [] };
  }
  // Fallback for administrator when roles collection not seeded yet
  if (roleId === "administrator") {
    const fallbackRole: Role = {
      id: "administrator",
      name: "Administrator",
      description: "Full access (fallback)",
      isSystemRole: true,
      permissions: ADMIN_FALLBACK_PERMS,
    };
    return { role: fallbackRole, permissions: ADMIN_FALLBACK_PERMS };
  }
  return { role: null, permissions: [] };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous profile listener
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setRole(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);

      // Ensure user document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "Unknown User",
          roleId: "viewer",
          isActive: true,
        };
        await setDoc(docRef, newProfile);
      }

      // ── Real-time listener for user profile ──────────────────────────────
      // Any change in Firestore (e.g. Admin changes roleId) is instantly reflected.
      profileUnsubscribe = onSnapshot(docRef, async (snap) => {
        if (!snap.exists()) {
          setProfile(null);
          setRole(null);
          setPermissions([]);
          return;
        }

        const userProfile = snap.data() as UserProfile;
        setProfile(userProfile);

        // Resolve role + permissions whenever profile changes
        if (userProfile.roleId) {
          const { role: resolvedRole, permissions: resolvedPerms } =
            await resolveRolePermissions(userProfile.roleId);
          setRole(resolvedRole);
          setPermissions(resolvedPerms);
        } else {
          setRole(null);
          setPermissions([]);
        }

        setLoading(false);
      });
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  /** Force-reload profile & permissions (e.g. after user saves their own profile) */
  const refreshProfile = async () => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const userProfile = snap.data() as UserProfile;
      setProfile(userProfile);
      if (userProfile.roleId) {
        const { role: resolvedRole, permissions: resolvedPerms } =
          await resolveRolePermissions(userProfile.roleId);
        setRole(resolvedRole);
        setPermissions(resolvedPerms);
      }
    }
  };

  const hasPermission = (permission: string) => permissions.includes(permission);

  const hasRoleName = (roleName: string) => role?.name === roleName;

  return (
    <AuthContext.Provider
      value={{ user, profile, permissions, role, loading, signOut, hasPermission, hasRoleName, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
