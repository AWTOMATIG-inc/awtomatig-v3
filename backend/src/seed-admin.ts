import "dotenv/config";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";

import { accounts, users } from "./shared/auth/auth.schema";
import { auditLog } from "./shared/audit/audit.schema";
import { rolePermissions, roles, userRoles } from "./shared/rbac/rbac.schema";

// Creates the first administrator (sign-up is closed, so someone has to exist before anyone can sign in). Safe to run again:
// an existing user keeps their password unless --reset-password is passed.
//
//   SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… npm run seed:admin [-- --reset-password]
const input = z.object({
  DATABASE_URL: z.string().min(1),
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_NAME: z.string().min(1).default("Administrator"),
  SEED_ADMIN_PASSWORD: z.string().min(12, "must be at least 12 characters").max(128),
});

async function main(): Promise<void> {
  const parsed = input.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Cannot seed the administrator:\n${lines.join("\n")}`);
  }
  const { DATABASE_URL, SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, SEED_ADMIN_PASSWORD } = parsed.data;
  const email = SEED_ADMIN_EMAIL.toLowerCase();
  const resetPassword = process.argv.includes("--reset-password");

  // Same hash format the sign-in endpoint verifies.
  const { hashPassword } = await import("better-auth/crypto");
  const passwordHash = await hashPassword(SEED_ADMIN_PASSWORD);

  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  const db = drizzle({ client: pool });
  try {
    const outcome = await db.transaction(async (tx) => {
      const [existingRole] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.name, "admin"));
      let roleId = existingRole?.id;
      if (!roleId) {
        const [created] = await tx
          .insert(roles)
          .values({ name: "admin", description: "Full access to every module", isSystem: true })
          .returning({ id: roles.id });
        if (!created) throw new Error("Could not create the admin role");
        roleId = created.id;
        await tx.insert(rolePermissions).values({ roleId, permission: "*" });
      }

      const [existingUser] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email));
      let userId = existingUser?.id;
      let result: "created" | "password reset" | "unchanged";
      if (!userId) {
        const [created] = await tx
          .insert(users)
          .values({ name: SEED_ADMIN_NAME, email, emailVerified: true })
          .returning({ id: users.id });
        if (!created) throw new Error("Could not create the user");
        userId = created.id;
        await tx.insert(accounts).values({ userId, accountId: userId, providerId: "credential", password: passwordHash });
        result = "created";
      } else if (resetPassword) {
        await tx.update(accounts).set({ password: passwordHash }).where(eq(accounts.userId, userId));
        result = "password reset";
      } else {
        result = "unchanged";
      }

      await tx.insert(userRoles).values({ userId, roleId }).onConflictDoNothing();
      if (result !== "unchanged") {
        await tx
          .insert(auditLog)
          .values({ action: `auth.seed_admin.${result.replace(" ", "_")}`, entityType: "user", entityId: userId });
      }
      return { userId, result };
    });
    console.log(`Administrator ${email}: ${outcome.result} (id ${outcome.userId}).`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
