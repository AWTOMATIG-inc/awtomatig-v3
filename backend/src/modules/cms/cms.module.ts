import { Module } from "@nestjs/common";

import { CaseStudiesController, PublicCaseStudiesController } from "./api/case-studies.controller";
import { PublicSiteMetricsController, SiteMetricsController } from "./api/site-metrics.controller";
import { PublicTestimonialsController, TestimonialsController } from "./api/testimonials.controller";
import { CaseStudiesRepo } from "./repo/case-studies.repo";
import { SiteMetricsRepo } from "./repo/site-metrics.repo";
import { TestimonialsRepo } from "./repo/testimonials.repo";
import { CaseStudiesService } from "./service/case-studies.service";
import { PublicImageStore } from "./service/public-image-store";
import { SiteMetricsService } from "./service/site-metrics.service";
import { TestimonialsService } from "./service/testimonials.service";

/**
 * The website's managed content: case studies (each with one showcase image), client testimonials (each with an optional logo)
 * and the trust numbers (a fixed set of figures).
 */
@Module({
  controllers: [
    CaseStudiesController,
    PublicCaseStudiesController,
    TestimonialsController,
    PublicTestimonialsController,
    SiteMetricsController,
    PublicSiteMetricsController,
  ],
  providers: [
    CaseStudiesService,
    CaseStudiesRepo,
    TestimonialsService,
    TestimonialsRepo,
    SiteMetricsService,
    SiteMetricsRepo,
    PublicImageStore,
  ],
})
export class CmsModule {}
