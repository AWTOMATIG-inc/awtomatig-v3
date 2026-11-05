import { Module } from "@nestjs/common";

import { CaseStudiesController, PublicCaseStudiesController } from "./api/case-studies.controller";
import { PublicTestimonialsController, TestimonialsController } from "./api/testimonials.controller";
import { CaseStudiesRepo } from "./repo/case-studies.repo";
import { TestimonialsRepo } from "./repo/testimonials.repo";
import { CaseStudiesService } from "./service/case-studies.service";
import { PublicImageStore } from "./service/public-image-store";
import { TestimonialsService } from "./service/testimonials.service";

/** The website's managed content: case studies (each with one showcase image) and client testimonials (each with an optional logo). */
@Module({
  controllers: [CaseStudiesController, PublicCaseStudiesController, TestimonialsController, PublicTestimonialsController],
  providers: [CaseStudiesService, CaseStudiesRepo, TestimonialsService, TestimonialsRepo, PublicImageStore],
})
export class CmsModule {}
