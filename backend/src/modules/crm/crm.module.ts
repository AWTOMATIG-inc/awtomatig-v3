import { Module } from "@nestjs/common";

import { IngestKeyGuard } from "../../shared/auth/ingest-key.guard";
import { LeadsController } from "./api/leads.controller";
import { LeadsRepo } from "./repo/leads.repo";
import { LeadsService } from "./service/leads.service";

/** Website inquiries: stored by the website's server, worked on by employees in the admin app. Sends no email (frontend D60). */
@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadsRepo, IngestKeyGuard],
})
export class CrmModule {}
