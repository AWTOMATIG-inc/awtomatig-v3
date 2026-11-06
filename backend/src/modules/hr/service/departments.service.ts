import { Injectable } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database, type Tx } from "../../../shared/db/database";
import { ConflictError, NotFoundError } from "../../../shared/errors/app-error";
import { type CreateDepartmentInput, type UpdateDepartmentInput } from "../domain/department";
import { type DepartmentPatch, DepartmentsRepo } from "../repo/departments.repo";
import { isUniqueViolation } from "./unique-violation";

interface Row {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NAME_TAKEN = "A department with this name already exists";

/**
 * Use cases for departments. A department that people belong to is deactivated, never deleted, so the timeline keeps its names.
 * Audit entries hold ids and field names only.
 */
@Injectable()
export class DepartmentsService {
  constructor(
    private readonly database: Database,
    private readonly repo: DepartmentsRepo,
    private readonly audit: AuditService,
  ) {}

  async create(input: CreateDepartmentInput, actorId: string) {
    try {
      return await this.database.transaction(async (tx) => {
        if (await this.repo.nameTaken(tx, input.name)) throw new ConflictError(NAME_TAKEN, { name: NAME_TAKEN });
        const inserted = await this.repo.insert(tx, { name: input.name, description: input.description, createdBy: actorId });
        await this.audit.record(
          { action: "hr.department.created", actorId, entityType: "department", entityId: inserted.id },
          tx,
        );
        return this.load(tx, inserted.id, 0);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError(NAME_TAKEN, { name: NAME_TAKEN });
      throw error;
    }
  }

  async list(active?: boolean) {
    const [rows, counts] = await Promise.all([this.repo.list(active), this.repo.employeeCounts()]);
    return { items: rows.map((row) => this.present(row, counts.get(row.id) ?? 0)) };
  }

  async get(id: string) {
    return this.database.transaction(async (tx) => this.load(tx, id, (await this.repo.employeeCounts()).get(id) ?? 0));
  }

  async update(id: string, input: UpdateDepartmentInput, actorId: string) {
    try {
      return await this.database.transaction(async (tx) => {
        const row = await this.repo.findById(tx, id);
        if (!row) throw new NotFoundError("Department not found");
        if (input.name !== undefined && (await this.repo.nameTaken(tx, input.name, id))) {
          throw new ConflictError(NAME_TAKEN, { name: NAME_TAKEN });
        }
        const patch = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as DepartmentPatch;
        await this.repo.update(tx, id, patch, actorId);
        await this.audit.record(
          {
            action: "hr.department.updated",
            actorId,
            entityType: "department",
            entityId: id,
            metadata: { fields: Object.keys(patch) },
          },
          tx,
        );
        return this.load(tx, id, (await this.repo.employeeCounts()).get(id) ?? 0);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError(NAME_TAKEN, { name: NAME_TAKEN });
      throw error;
    }
  }

  /** A deactivated department disappears from the pickers for new changes. People already in it stay in it. */
  async setActive(id: string, active: boolean, actorId: string) {
    return this.database.transaction(async (tx) => {
      const row = await this.repo.findById(tx, id);
      if (!row) throw new NotFoundError("Department not found");
      if (row.active === active)
        throw new ConflictError(active ? "The department is already active" : "The department is already inactive");
      await this.repo.update(tx, id, { active }, actorId);
      await this.audit.record(
        {
          action: active ? "hr.department.activated" : "hr.department.deactivated",
          actorId,
          entityType: "department",
          entityId: id,
        },
        tx,
      );
      return this.load(tx, id, (await this.repo.employeeCounts()).get(id) ?? 0);
    });
  }

  private async load(tx: Tx, id: string, employeeCount: number) {
    const row = await this.repo.findById(tx, id);
    if (!row) throw new NotFoundError("Department not found");
    return this.present(row, employeeCount);
  }

  private present(row: Row, employeeCount: number) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      active: row.active,
      employeeCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
