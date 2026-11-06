import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, RequirePermission } from "../../../shared/auth/auth.decorators";
import { DepartmentsService } from "../service/departments.service";
import {
  CreateDepartmentDto,
  DepartmentDto,
  DepartmentIdParamsDto,
  DepartmentListDto,
  ListDepartmentsQueryDto,
  UpdateDepartmentDto,
} from "./employees.dto";

@ApiTags("hr")
@Controller("hr/departments")
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  @RequirePermission("hr.department.read")
  @ZodSerializerDto(DepartmentListDto)
  @ApiOkResponse({ type: DepartmentListDto })
  list(@Query() query: ListDepartmentsQueryDto) {
    return this.departments.list(query.active);
  }

  @Post()
  @RequirePermission("hr.department.manage")
  @HttpCode(201)
  @ZodSerializerDto(DepartmentDto)
  @ApiCreatedResponse({ type: DepartmentDto })
  @ApiConflictResponse({ description: "A department with this name already exists" })
  create(@Body() body: CreateDepartmentDto, @CurrentAuth() auth: AuthContext) {
    return this.departments.create(body, auth.userId);
  }

  @Get(":id")
  @RequirePermission("hr.department.read")
  @ZodSerializerDto(DepartmentDto)
  @ApiOkResponse({ type: DepartmentDto })
  @ApiNotFoundResponse({ description: "No such department" })
  get(@Param() params: DepartmentIdParamsDto) {
    return this.departments.get(params.id);
  }

  @Patch(":id")
  @RequirePermission("hr.department.manage")
  @ZodSerializerDto(DepartmentDto)
  @ApiOkResponse({ type: DepartmentDto })
  @ApiNotFoundResponse({ description: "No such department" })
  @ApiConflictResponse({ description: "A department with this name already exists" })
  update(@Param() params: DepartmentIdParamsDto, @Body() body: UpdateDepartmentDto, @CurrentAuth() auth: AuthContext) {
    return this.departments.update(params.id, body, auth.userId);
  }

  @Post(":id/activate")
  @RequirePermission("hr.department.manage")
  @HttpCode(200)
  @ZodSerializerDto(DepartmentDto)
  @ApiOkResponse({ type: DepartmentDto })
  @ApiNotFoundResponse({ description: "No such department" })
  @ApiConflictResponse({ description: "Already active" })
  activate(@Param() params: DepartmentIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.departments.setActive(params.id, true, auth.userId);
  }

  /** Hides the department from the pickers. People already in it stay in it. */
  @Post(":id/deactivate")
  @RequirePermission("hr.department.manage")
  @HttpCode(200)
  @ZodSerializerDto(DepartmentDto)
  @ApiOkResponse({ type: DepartmentDto })
  @ApiNotFoundResponse({ description: "No such department" })
  @ApiConflictResponse({ description: "Already inactive" })
  deactivate(@Param() params: DepartmentIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.departments.setActive(params.id, false, auth.userId);
  }
}
