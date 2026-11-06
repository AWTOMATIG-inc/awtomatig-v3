"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, ConfirmDialog, DataTable, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { formatNumber } from "@/lib/format";
import { type Department, employeesHref } from "@/lib/hr/employees";

import { DepartmentDialog } from "./DepartmentDialog";

type Dialogs = { kind: "edit"; department: Department } | { kind: "deactivate"; department: Department } | null;

/**
 * The departments list. A department that people belong to is deactivated, never deleted, so the timeline keeps its names:
 * a deactivated department disappears from the pickers for new changes and people already in it stay in it. Activating needs no
 * confirmation; deactivating says what it does.
 */
export function DepartmentsTable({ departments, canManage }: { departments: readonly Department[]; canManage: boolean }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setActive(department: Department, active: boolean) {
    setPending(true);
    setError(null);
    try {
      const path = { params: { path: { id: department.id } } };
      const { response, error: failure } = active
        ? await api.POST("/api/v1/hr/departments/{id}/activate", path)
        : await api.POST("/api/v1/hr/departments/{id}/deactivate", path);
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(
          response.status === 403
            ? "You do not have permission to do this."
            : apiMessage(failure, "That did not work. Try again."),
        );
        return;
      }
      setDialog(null);
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => (
        <div className="py-6">
          <p className="text-fg-strong font-medium">{row.original.name}</p>
          {row.original.description && <p className="text-fg-muted">{row.original.description}</p>}
        </div>
      ),
    },
    {
      accessorKey: "employeeCount",
      header: "People",
      meta: { numeric: true },
      cell: ({ row }) =>
        row.original.employeeCount > 0 ? (
          <Link
            href={employeesHref({
              page: 1,
              status: "working",
              departmentId: row.original.id,
              sort: "fullName",
              order: "asc",
            })}
            className="ease-out-quint underline underline-offset-4 hover:no-underline"
          >
            {formatNumber(row.original.employeeCount)}
          </Link>
        ) : (
          "0"
        ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => <StatusBadge>{row.original.active ? "Active" : "Inactive"}</StatusBadge>,
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
              <div className="flex justify-end gap-8">
                <Button size="sm" onClick={() => setDialog({ kind: "edit", department: row.original })}>
                  Edit
                </Button>
                {row.original.active ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setDialog({ kind: "deactivate", department: row.original });
                    }}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button size="sm" disabled={pending} onClick={() => setActive(row.original, true)}>
                    Activate
                  </Button>
                )}
              </div>
            ),
          } satisfies ColumnDef<Department>,
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={departments}
        caption="Departments"
        emptyMessage="No departments yet. Add the first one, then choose it for employees."
      />
      {dialog?.kind === "edit" && <DepartmentDialog department={dialog.department} onClose={() => setDialog(null)} />}
      {dialog?.kind === "deactivate" && (
        <ConfirmDialog
          open
          destructive
          onClose={() => setDialog(null)}
          title={`Deactivate ${dialog.department.name}?`}
          confirmLabel="Deactivate"
          pendingLabel="Deactivating"
          pending={pending}
          error={error}
          onConfirm={() => setActive(dialog.department, false)}
        >
          <p>
            It will no longer be offered when adding an employee or changing someone&apos;s department.
            {dialog.department.employeeCount > 0
              ? ` The ${formatNumber(dialog.department.employeeCount)} ${dialog.department.employeeCount === 1 ? "person" : "people"} in it stay in it, and the timeline keeps its name.`
              : ""}{" "}
            You can activate it again later.
          </p>
        </ConfirmDialog>
      )}
      {error && dialog === null && <p className="type-body-14 text-fg-primary p-16">{error}</p>}
    </>
  );
}
