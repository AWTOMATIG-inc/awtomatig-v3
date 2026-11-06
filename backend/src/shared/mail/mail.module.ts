import { Global, Module } from "@nestjs/common";

import { AppConfig } from "../config/app-config";
import { createMailTransport, MAIL_TRANSPORT, MailService } from "./mail.service";

@Global()
@Module({
  providers: [
    { provide: MAIL_TRANSPORT, inject: [AppConfig], useFactory: (config: AppConfig) => createMailTransport(config) },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
