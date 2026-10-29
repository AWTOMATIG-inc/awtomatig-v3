/**
 * Permissions are `module.resource.action` strings (`inventory.stock.adjust`). A grant may end in a wildcard segment:
 * `*` is everything, `crm.*` is the whole CRM module, `crm.lead.*` is every action on leads.
 */
export function hasPermission(granted: readonly string[], required: string): boolean {
  return granted.some((grant) => {
    if (grant === "*" || grant === required) return true;
    return grant.endsWith(".*") && required.startsWith(grant.slice(0, -1));
  });
}
