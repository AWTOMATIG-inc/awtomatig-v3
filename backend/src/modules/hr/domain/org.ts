/** A reporting chain longer than this means the data is already broken; stop instead of looping forever. */
const MAX_CHAIN_DEPTH = 50;

/**
 * True when making `managerId` the manager of `employeeId` would close a loop (A manages B manages A, or someone manages
 * themselves). Walks up from the new manager through each person's current manager. `managerOf` returns the current manager of
 * an employee, or null at the top.
 */
export async function createsManagerLoop(
  employeeId: string,
  managerId: string,
  managerOf: (id: string) => Promise<string | null>,
): Promise<boolean> {
  let cursor: string | null = managerId;
  for (let depth = 0; cursor !== null && depth < MAX_CHAIN_DEPTH; depth += 1) {
    if (cursor === employeeId) return true;
    cursor = await managerOf(cursor);
  }
  return cursor !== null;
}
