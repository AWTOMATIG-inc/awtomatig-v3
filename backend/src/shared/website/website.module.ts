import { Global, Module } from "@nestjs/common";

import { WebsiteRevalidator } from "./website-revalidator";

/** Lets any module ask the public website to drop a cached list after a change that affects the live site. */
@Global()
@Module({ providers: [WebsiteRevalidator], exports: [WebsiteRevalidator] })
export class WebsiteModule {}
