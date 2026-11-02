import { Global, Module } from "@nestjs/common";

import { AppConfig } from "../config/app-config";
import { createR2Client, S3_CLIENT, StorageService } from "./storage.service";

@Global()
@Module({
  providers: [
    { provide: S3_CLIENT, inject: [AppConfig], useFactory: (config: AppConfig) => createR2Client(config) },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
