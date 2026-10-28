import clsx, { type ClassValue } from "clsx";

/** Joins class names, skipping falsy values. Never use it to override a property a component already sets. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
