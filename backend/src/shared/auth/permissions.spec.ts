import { hasPermission } from "./permissions";

describe("hasPermission", () => {
  it("matches an exact grant", () => {
    expect(hasPermission(["crm.lead.read"], "crm.lead.read")).toBe(true);
    expect(hasPermission(["crm.lead.read"], "crm.lead.delete")).toBe(false);
  });

  it("lets * grant everything", () => {
    expect(hasPermission(["*"], "inventory.stock.adjust")).toBe(true);
  });

  it("supports module and resource wildcards without matching a sibling prefix", () => {
    expect(hasPermission(["crm.*"], "crm.lead.read")).toBe(true);
    expect(hasPermission(["crm.lead.*"], "crm.lead.read")).toBe(true);
    expect(hasPermission(["crm.*"], "crm2.lead.read")).toBe(false);
    expect(hasPermission(["crm.lead.*"], "crm.contact.read")).toBe(false);
  });

  it("denies when nothing is granted", () => {
    expect(hasPermission([], "crm.lead.read")).toBe(false);
  });
});
