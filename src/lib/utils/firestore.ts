/** Remove undefined object properties before handing data to Firestore.
 * Firestore accepts null but rejects undefined by default. Arrays are kept
 * intact because domain arrays (images/order items) are already validated.
 */
export function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}
