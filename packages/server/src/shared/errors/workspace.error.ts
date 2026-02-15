import { ConflictException, ForbiddenException, NotFoundException } from './base.error';

export class WorkspaceNotFoundException extends NotFoundException {
  constructor() {
    super('Workspace not found', 'WORKSPACE_NOT_FOUND');
  }
}

export class WorkspacePermissionDeniedException extends ForbiddenException {
  constructor() {
    super('Workspace access denied', 'WORKSPACE_ACCESS_DENIED');
  }
}

export class WorkspaceAdminRequiredException extends ForbiddenException {
  constructor() {
    super('Workspace admin permission required', 'WORKSPACE_ADMIN_REQUIRED');
  }
}

export class WorkspaceMemberNotFoundException extends NotFoundException {
  constructor() {
    super('Workspace member not found', 'WORKSPACE_MEMBER_NOT_FOUND');
  }
}

export class WorkspaceLastAdminException extends ConflictException {
  constructor() {
    super('At least one workspace admin must remain', 'WORKSPACE_LAST_ADMIN_REQUIRED');
  }
}

export class WorkspaceMemberAlreadyExistsException extends ConflictException {
  constructor() {
    super('Workspace member already exists', 'WORKSPACE_MEMBER_ALREADY_EXISTS');
  }
}

export class WorkspaceInviteNotFoundException extends NotFoundException {
  constructor() {
    super('Workspace invite not found', 'WORKSPACE_INVITE_NOT_FOUND');
  }
}

export class WorkspaceInviteExpiredException extends ConflictException {
  constructor() {
    super('Workspace invite expired', 'WORKSPACE_INVITE_EXPIRED');
  }
}

export class WorkspaceInviteAlreadyAcceptedException extends ConflictException {
  constructor() {
    super('Workspace invite already accepted', 'WORKSPACE_INVITE_ALREADY_ACCEPTED');
  }
}

export class WorkspaceInviteEmailMismatchException extends ForbiddenException {
  constructor() {
    super('Workspace invite email mismatch', 'WORKSPACE_INVITE_EMAIL_MISMATCH');
  }
}

export class WorkspaceInviteAlreadyPendingException extends ConflictException {
  constructor() {
    super('Workspace invite already pending', 'WORKSPACE_INVITE_ALREADY_PENDING');
  }
}
