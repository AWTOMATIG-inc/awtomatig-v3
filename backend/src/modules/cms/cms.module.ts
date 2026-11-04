import { Module } from "@nestjs/common";

import { CaseStudiesController, PublicCaseStudiesController } from "./api/case-studies.controller";
import { CaseStudiesRepo } from "./repo/case-studies.repo";
import { CaseStudiesService } from "./service/case-studies.service";
import { WebsiteRevalidator } from "./service/website-revalidator";

/** The website's managed content. First piece: case studies, each with one showcase image in the public bucket. */
@Module({
  controllers: [CaseStudiesController, PublicCaseStudiesController],
  providers: [CaseStudiesService, CaseStudiesRepo, WebsiteRevalidator],
})
export class CmsModule {}
