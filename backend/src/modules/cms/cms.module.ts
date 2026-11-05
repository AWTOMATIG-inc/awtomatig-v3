import { Module } from "@nestjs/common";

import { CaseStudiesController, PublicCaseStudiesController } from "./api/case-studies.controller";
import { FaqsController, PublicFaqsController } from "./api/faqs.controller";
import { PublicSiteMetricsController, SiteMetricsController } from "./api/site-metrics.controller";
import { PublicTestimonialsController, TestimonialsController } from "./api/testimonials.controller";
import { CaseStudiesRepo } from "./repo/case-studies.repo";
import { FaqsRepo } from "./repo/faqs.repo";
import { SiteMetricsRepo } from "./repo/site-metrics.repo";
import { TestimonialsRepo } from "./repo/testimonials.repo";
import { CaseStudiesService } from "./service/case-studies.service";
import { FaqsService } from "./service/faqs.service";
import { PublicImageStore } from "./service/public-image-store";
import { SiteMetricsService } from "./service/site-metrics.service";
import { TestimonialsService } from "./service/testimonials.service";

/**
 * The website's managed content: case studies (each with one showcase image), client testimonials (each with an optional logo)
 * the trust numbers (a fixed set of figures) and the shared FAQ list.
 */
@Module({
  controllers: [
    CaseStudiesController,
    PublicCaseStudiesController,
    TestimonialsController,
    PublicTestimonialsController,
    SiteMetricsController,
    PublicSiteMetricsController,
    FaqsController,
    PublicFaqsController,
  ],
  providers: [
    CaseStudiesService,
    CaseStudiesRepo,
    TestimonialsService,
    TestimonialsRepo,
    SiteMetricsService,
    SiteMetricsRepo,
    FaqsService,
    FaqsRepo,
    PublicImageStore,
  ],
})
export class CmsModule {}
