import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";

/** The OpenAPI document is the contract with `frontend/` and `admin/` (root ARCHITECTURE.md S3). */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle("AWTOMATIG API")
    .setDescription("CMS and ERP modules. Employees only, except the public lead form and read-only CMS content.")
    .setVersion("1")
    .build();
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}

/** Serves the interactive docs at /api/docs. Called in development only. */
export function setupOpenApiUi(app: INestApplication): void {
  SwaggerModule.setup("api/docs", app, buildOpenApiDocument(app));
}
