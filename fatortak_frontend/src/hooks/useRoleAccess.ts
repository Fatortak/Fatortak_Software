
import { useAuth } from '../contexts/AuthContext';

export enum UserRole {
  Admin = 1,
  Watcher = 2,
  Editor = 3,
}

export const useRoleAccess = () => {
  const { user } = useAuth();
  
  // Get user role from user object (assuming role is stored as string or number)
  const getUserRole = (): UserRole => {
    if (!user) return UserRole.Watcher; // Default to most restrictive
    
    // Assuming the role is stored as a string in user.role
    const roleString = user.role?.toLowerCase();
    switch (roleString) {
      case 'admin':
      case 'sysadmin':
        return UserRole.Admin;
      case 'editor':
        return UserRole.Editor;
      case 'watcher':
        return UserRole.Watcher;
      default:
        return UserRole.Watcher;
    }
  };

  const currentRole = getUserRole();

  const canCreate = () => {
    return currentRole === UserRole.Admin || currentRole === UserRole.Editor;
  };

  const canEdit = () => {
    return currentRole === UserRole.Admin || currentRole === UserRole.Editor;
  };

  const canDelete = () => {
    return currentRole === UserRole.Admin;
  };

  const canView = () => {
    return true; // All roles can view
  };

  const canToggleActivation = () => {
    return currentRole === UserRole.Admin || currentRole === UserRole.Editor;
  };

  const isAdmin = () => currentRole === UserRole.Admin;
  const isEditor = () => currentRole === UserRole.Editor;
  const isWatcher = () => currentRole === UserRole.Watcher;

  return {
    currentRole,
    canCreate,
    canEdit,
    canDelete,
    canView,
    canToggleActivation,
    isAdmin,
    isEditor,
    isWatcher,
  };
};
