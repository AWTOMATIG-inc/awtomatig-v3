import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { Database } from "../db/database";
import { rolePermissions, roles, userRoles } from "./rbac.schema";

export interface Grants {
  roles: string[];
  permissions: string[];
}

@Injectable()
export class RbacService {
  constructor(private readonly database: Database) {}

  /** The role names and the union of the permissions of every role a user holds. */
  async grantsFor(userId: string): Promise<Grants> {
    const rows = await this.database.db
      .select({ role: roles.name, permission: rolePermissions.permission })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const roleNames = new Set<string>();
    const permissions = new Set<string>();
    for (const row of rows) {
      roleNames.add(row.role);
      if (row.permission) permissions.add(row.permission);
    }
    return { roles: [...roleNames].sort(), permissions: [...permissions].sort() };
  }
}
