import { Module } from "@nestjs/common";

import { DepartmentsController } from "./api/departments.controller";
import { HrStatsController } from "./api/stats.controller";
import { DocumentsController } from "./api/documents.controller";
import { DesignationsController, EmployeesController } from "./api/employees.controller";
import { DepartmentsRepo } from "./repo/departments.repo";
import { DocumentsRepo } from "./repo/documents.repo";
import { EmployeesRepo } from "./repo/employees.repo";
import { EmploymentRecordsRepo } from "./repo/employment-records.repo";
import { DepartmentsService } from "./service/departments.service";
import { DocumentsService } from "./service/documents.service";
import { EmployeesService } from "./service/employees.service";
import { HrStatsService } from "./service/stats.service";

/**
 * Employees, their career timeline and departments (the first ERP module). Employment details live only in the timeline and
 * "current" is read through a database view. Documents (NID, passport, …) are stored in the private R2 bucket through the shared
 * `StorageService` and opened only through short-lived signed links.
 */
@Module({
  controllers: [EmployeesController, DesignationsController, DepartmentsController, DocumentsController, HrStatsController],
  providers: [
    EmployeesService,
    DepartmentsService,
    DocumentsService,
    HrStatsService,
    EmployeesRepo,
    EmploymentRecordsRepo,
    DepartmentsRepo,
    DocumentsRepo,
  ],
})
export class HrModule {}
