export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
};

export const availableUserRole = Object.values(UserRolesEnum);

export const taskStatusEnum = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const availableTaskStatuses = Object.values(taskStatusEnum);
