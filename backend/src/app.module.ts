import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod";

import { AuditModule } from "./shared/audit/audit.module";
import { AuthModule } from "./shared/auth/auth.module";
import { CrmModule } from "./modules/crm/crm.module";
import { ConfigModule } from "./shared/config/app-config";
import { DbModule } from "./shared/db/db.module";
import { AllExceptionsFilter } from "./shared/errors/all-exceptions.filter";
import { HealthModule } from "./shared/health/health.module";
import { LoggingModule } from "./shared/logging/logging.module";
import { RbacModule } from "./shared/rbac/rbac.module";

/**
 * Composition root. Cross-cutting infrastructure comes from shared/; business modules (cms, crm, inventory, …) are added
 * to `imports` as they are built, each one a folder under src/modules/.
 */
@Module({
  imports: [ConfigModule, LoggingModule, DbModule, AuditModule, RbacModule, AuthModule, HealthModule, CrmModule],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
