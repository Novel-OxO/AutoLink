export const LOCALES = ['KO', 'EN'] as const;

export const VISIBILITY = ['PRIVATE', 'PUBLIC'] as const;

export const CRAWL_STATUS = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;

export const OAUTH_PROVIDERS = ['GOOGLE', 'APPLE'] as const;

export const WORKSPACE_ROLES = ['ADMIN', 'MEMBER'] as const;
export const WORKSPACE_ID_HEADER_NAME = 'AutoLink-Workspace-Id';

export const INVITE_STATUS = ['PENDING', 'ACCEPTED', 'EXPIRED'] as const;

export const NOTIFICATION_TYPES = [
  'SUBSCRIPTION_NEW_LINK',
  'CONTENT_UPDATED',
  'UNREAD_REMINDER',
  'UNUSED_LINKS',
  'WEAKNESS_DETECTED',
  'WORKSPACE_INVITE',
  'RSS_NEW_ITEMS',
] as const;

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const TRASH_RETENTION_DAYS = 30;
export const NOTIFICATION_RETENTION_DAYS = 90;

export const INVITE_EXPIRY_DAYS = 7;

export const SEARCH_DEFAULT_LIMIT = 10;
export const SEARCH_MAX_LIMIT = 50;

export const API_PATHS = {
  AUTH: {
    LOGIN: '/auth/:provider',
    CALLBACK: '/auth/:provider/callback',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    CONNECT: '/auth/connect/:provider',
    DELETE_ME: '/auth/me',
  },
  LINKS: {
    ROOT: '/links',
    DETAIL: '/links/:linkId',
    RECRAWL: '/links/:linkId/recrawl',
  },
  FOLDERS: {
    ROOT: '/folders',
    DETAIL: '/folders/:folderId',
    SHARE: '/folders/:folderId/share',
  },
  TRASH: {
    ROOT: '/trash',
    RESTORE: '/trash/:linkId/restore',
    DELETE: '/trash/:linkId',
  },
  SEARCH: '/search',
  NOTIFICATIONS: {
    ROOT: '/notifications',
    READ: '/notifications/:notificationId/read',
    READ_ALL: '/notifications/read-all',
  },
  WORKSPACES: {
    ROOT: '/workspaces',
    DETAIL: '/workspaces/:workspaceId',
    INVITE: '/workspaces/:workspaceId/invite',
    MEMBERS: '/workspaces/:workspaceId/members',
    MEMBER: '/workspaces/:workspaceId/members/:userId',
  },
  INVITES: {
    ACCEPT: '/invites/:inviteToken/accept',
  },
  SHARED: {
    FOLDER: '/shared/:shareToken',
  },
} as const;
