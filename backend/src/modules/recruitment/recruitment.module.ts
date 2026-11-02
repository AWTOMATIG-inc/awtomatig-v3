import { Module } from "@nestjs/common";

import { ApplicationsController, PublicJobsController } from "./api/applications.controller";
import { JobsController } from "./api/jobs.controller";
import { ApplicationsRepo } from "./repo/applications.repo";
import { JobsRepo } from "./repo/jobs.repo";
import { ApplicationsService } from "./service/applications.service";
import { JobsService } from "./service/jobs.service";

/**
 * Job openings, the public careers endpoints and the applications for them. Sends no email: the website sends the candidate's
 * confirmation. Resumes are stored through the shared `StorageService` (private bucket).
 */
@Module({
  controllers: [JobsController, PublicJobsController, ApplicationsController],
  providers: [JobsService, ApplicationsService, JobsRepo, ApplicationsRepo],
})
export class RecruitmentModule {}
