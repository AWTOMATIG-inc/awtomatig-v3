import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, RequirePermission } from "../../../shared/auth/auth.decorators";
import { hasPermission } from "../../../shared/auth/permissions";
import { SENSITIVE_PERMISSION } from "../domain/employee";
import { EmployeesService, type Viewer } from "../service/employees.service";
import {
  CreateEmployeeDto,
  DesignationListDto,
  EmployeeDto,
  EmployeeIdParamsDto,
  EmployeeListDto,
  EmploymentChangeDto,
  EmploymentRecordParamsDto,
  LeaveDto,
  ListEmployeesQueryDto,
  UpdateEmployeeDto,
} from "./employees.dto";

/** Salary and the full NID go to the caller only if their role holds `hr.sensitive.read`. */
function viewerOf(auth: AuthContext): Viewer {
  return { userId: auth.userId, canSeeSensitive: hasPermission(auth.permissions, SENSITIVE_PERMISSION) };
}

@ApiTags("hr")
@Controller("hr/employees")
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequirePermission("hr.employee.read")
  @ZodSerializerDto(EmployeeListDto)
  @ApiOkResponse({ type: EmployeeListDto })
  list(@Query() query: ListEmployeesQueryDto) {
    return this.employees.list(query);
  }

  @Post()
  @RequirePermission("hr.employee.create")
  @HttpCode(201)
  @ZodSerializerDto(EmployeeDto)
  @ApiCreatedResponse({ type: EmployeeDto })
  @ApiConflictResponse({ description: "The email or NID already belongs to an employee" })
  @ApiForbiddenResponse({ description: "A salary was sent without the permission to set salaries" })
  create(@Body() body: CreateEmployeeDto, @CurrentAuth() auth: AuthContext) {
    return this.employees.create(body, viewerOf(auth));
  }

  @Get(":id")
  @RequirePermission("hr.employee.read")
  @ZodSerializerDto(EmployeeDto)
  @ApiOkResponse({ type: EmployeeDto })
  @ApiNotFoundResponse({ description: "No such employee" })
  get(@Param() params: EmployeeIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.employees.get(params.id, viewerOf(auth));
  }

  /** Personal details and the joining date. Employment details change through `employment-changes`. */
  @Patch(":id")
  @RequirePermission("hr.employee.update")
  @ZodSerializerDto(EmployeeDto)
  @ApiOkResponse({ type: EmployeeDto })
  @ApiNotFoundResponse({ description: "No such employee" })
  @ApiConflictResponse({ description: "The email or NID already belongs to another employee" })
  update(@Param() params: EmployeeIdParamsDto, @Body() body: UpdateEmployeeDto, @CurrentAuth() auth: AuthContext) {
    return this.employees.update(params.id, body, viewerOf(auth));
  }

  /** Adds one timeline entry. Fields that are not sent carry forward. A future date schedules the change. */
  @Post(":id/employment-changes")
  @RequirePermission("hr.employee.update")
  @HttpCode(201)
  @ZodSerializerDto(EmployeeDto)
  @ApiCreatedResponse({ type: EmployeeDto, description: "The updated profile" })
  @ApiNotFoundResponse({ description: "No such employee" })
  @ApiConflictResponse({ description: "There is already an entry on that date" })
  @ApiForbiddenResponse({ description: "A salary was sent without the permission to set salaries" })
  changeEmployment(@Param() params: EmployeeIdParamsDto, @Body() body: EmploymentChangeDto, @CurrentAuth() auth: AuthContext) {
    return this.employees.changeEmployment(params.id, body, viewerOf(auth));
  }

  @Delete(":id/employment-changes/:recordId")
  @RequirePermission("hr.employee.update")
  @ZodSerializerDto(EmployeeDto)
  @ApiOkResponse({ type: EmployeeDto, description: "The updated profile" })
  @ApiNotFoundResponse({ description: "No such employee or timeline entry" })
  @ApiConflictResponse({ description: "The Joined entry cannot be removed" })
  removeEmployment(@Param() params: EmploymentRecordParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.employees.removeEmployment(params.id, params.recordId, viewerOf(auth));
  }

  @Post(":id/leave")
  @RequirePermission("hr.employee.update")
  @HttpCode(200)
  @ZodSerializerDto(EmployeeDto)
  @ApiOkResponse({ type: EmployeeDto })
  @ApiNotFoundResponse({ description: "No such employee" })
  @ApiConflictResponse({ description: "Already left, or people report to this employee and no new manager was chosen" })
  leave(@Param() params: EmployeeIdParamsDto, @Body() body: LeaveDto, @CurrentAuth() auth: AuthContext) {
    return this.employees.leave(params.id, body, viewerOf(auth));
  }

  @Post(":id/reinstate")
  @RequirePermission("hr.employee.update")
  @HttpCode(200)
  @ZodSerializerDto(EmployeeDto)
  @ApiOkResponse({ type: EmployeeDto })
  @ApiNotFoundResponse({ description: "No such employee" })
  @ApiConflictResponse({ description: "The employee has not been marked as left" })
  reinstate(@Param() params: EmployeeIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.employees.reinstate(params.id, viewerOf(auth));
  }

  /** Only for a record created by mistake; someone who worked here is marked as left instead. */
  @Delete(":id")
  @RequirePermission("hr.employee.delete")
  @HttpCode(204)
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiNotFoundResponse({ description: "No such employee" })
  @ApiConflictResponse({ description: "Other people's history names this employee as their manager" })
  async remove(@Param() params: EmployeeIdParamsDto, @CurrentAuth() auth: AuthContext): Promise<void> {
    await this.employees.remove(params.id, viewerOf(auth));
  }
}

@ApiTags("hr")
@Controller("hr/designations")
export class DesignationsController {
  constructor(private readonly employees: EmployeesService) {}

  /** Designations already in use, most used first, for the form's suggestions. */
  @Get()
  @RequirePermission("hr.employee.read")
  @ZodSerializerDto(DesignationListDto)
  @ApiOkResponse({ type: DesignationListDto })
  list() {
    return this.employees.designations();
  }
}
