// Admin configuration
export interface AdminConfig {
  adminUserIds: string[]
  moderatorUserIds: string[]
  permissions: {
    canCreateChangelogs: (userId: string) => boolean
    canModerateComments: (userId: string) => boolean
    canViewAnalytics: (userId: string) => boolean
    canManageUsers: (userId: string) => boolean
  }
}

// This would normally come from environment variables or a backend API
const ADMIN_USER_IDS = (import.meta.env.VITE_ADMIN_USER_IDS || '').split(',').filter(Boolean)
const MODERATOR_USER_IDS = (import.meta.env.VITE_MODERATOR_USER_IDS || '').split(',').filter(Boolean)

export const adminConfig: AdminConfig = {
  adminUserIds: ADMIN_USER_IDS,
  moderatorUserIds: MODERATOR_USER_IDS,
  permissions: {
    canCreateChangelogs: (userId: string) =>
      ADMIN_USER_IDS.includes(userId) || MODERATOR_USER_IDS.includes(userId),
    canModerateComments: (userId: string) =>
      ADMIN_USER_IDS.includes(userId) || MODERATOR_USER_IDS.includes(userId),
    canViewAnalytics: (userId: string) =>
      ADMIN_USER_IDS.includes(userId),
    canManageUsers: (userId: string) =>
      ADMIN_USER_IDS.includes(userId)
  }
}

export const isAdmin = (userId?: string): boolean => {
  if (!userId) return false
  return adminConfig.adminUserIds.includes(userId)
}

export const isModerator = (userId?: string): boolean => {
  if (!userId) return false
  return adminConfig.moderatorUserIds.includes(userId)
}

export const hasPermission = (userId: string | undefined, permission: keyof AdminConfig['permissions']): boolean => {
  if (!userId) return false
  return adminConfig.permissions[permission](userId)
}

// User roles
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

export const getUserRole = (userId?: string): UserRole => {
  if (!userId) return UserRole.USER
  if (isAdmin(userId)) return UserRole.ADMIN
  if (isModerator(userId)) return UserRole.MODERATOR
  return UserRole.USER
}

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator'
    case UserRole.MODERATOR:
      return 'Moderator'
    case UserRole.USER:
    default:
      return 'User'
  }
}

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-red-100 text-red-800'
    case UserRole.MODERATOR:
      return 'bg-blue-100 text-blue-800'
    case UserRole.USER:
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
