import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/config/supabase";

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  isSystemRole: boolean;
}

export interface UserProfile {
  uid: string; // Will map to 'id' in the database
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
  const { data: roleData, error } = await supabase
    .from("roles")
    .select("*, role_permissions(permission_id)")
    .eq("id", roleId)
    .single();

  if (!error && roleData) {
    const permissions = (roleData.role_permissions || []).map((rp: any) => rp.permission_id as string);
    const role: Role = {
      id: roleData.id,
      name: roleData.name,
      permissions,
      description: roleData.description,
      isSystemRole: roleData.is_system_role,
    };
    return { role, permissions };
  }

  // Fallback for administrator when roles not seeded yet
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

  const fetchProfile = async (currentUser: User) => {
    // Fetch profile from public.users table
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (!error && userData) {
      const userProfile: UserProfile = {
        uid: userData.id,
        email: userData.email,
        displayName: userData.display_name || "Unknown User",
        roleId: userData.role_id,
        branchId: userData.branch_id,
        isActive: userData.is_active,
      };
      setProfile(userProfile);

      if (userProfile.roleId) {
        const { role: resolvedRole, permissions: resolvedPerms } = await resolveRolePermissions(userProfile.roleId);
        setRole(resolvedRole);
        setPermissions(resolvedPerms);
      } else {
        setRole(null);
        setPermissions([]);
      }
    } else {
      // User exists in auth but not in public.users — auto-register as administrator
      // This handles first-time setup before RLS policies are in place
      console.warn("Profile not found in public.users, auto-registering as administrator.");
      await supabase.from("users").upsert({
        id: currentUser.id,
        email: currentUser.email ?? "",
        display_name: currentUser.email?.split("@")[0] ?? "Admin",
        role_id: "administrator",
        is_active: true,
      });

      const fallbackProfile: UserProfile = {
        uid: currentUser.id,
        email: currentUser.email ?? "",
        displayName: currentUser.email?.split("@")[0] ?? "Admin",
        roleId: "administrator",
        isActive: true,
      };
      setProfile(fallbackProfile);
      const { role: resolvedRole, permissions: resolvedPerms } = await resolveRolePermissions("administrator");
      setRole(resolvedRole);
      setPermissions(resolvedPerms);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
          setPermissions([]);
        }
        setLoading(false);
      }
    }
    
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setPermissions([]);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user);
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
