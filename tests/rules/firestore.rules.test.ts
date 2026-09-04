// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, query, collection, where, getDocs, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
let env: RulesTestEnvironment;
const projectId = process.env.GCLOUD_PROJECT ?? 'agriconnect-dev';
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'owners', 'owner1'), {
      shopId: 'shop1',
      email: 'o@test.com',
      displayName: 'Owner',
      role: 'owner',
      createdAt: new Date(),
    });
    await setDoc(doc(db, 'shops', 'shop1'), {
      name: 'Shop',
      ownerUid: 'owner1',
      ownerDisplayName: 'Owner',
      address: 'A',
      phone: '+919999999999',
      businessHours: '8-8',
      active: true,
      createdBy: 'owner1',
      updatedBy: 'owner1',
    });
    await setDoc(doc(db, 'shops', 'shop1', 'products', 'p1'), {
      name: 'Urea',
      categoryId: 'c1',
      images: [{ id: 'i', url: 'x', storagePath: 'x', isCover: true }],
      unit: 'kg',
      packSize: 50,
      mrp: 500,
      availabilityStatus: 'available',
      active: true,
      createdBy: 'owner1',
      updatedBy: 'owner1',
    });
    await setDoc(doc(db, 'shops', 'shop1', 'orders', 'o1'), {
      customerName: 'Farmer',
      customerPhone: '+919876543210',
      address: 'A',
      items: [],
      subtotal: 0,
      status: 'placed',
      statusHistory: [],
      createdByUid: 'anon1',
      updatedBy: 'anon1',
    });
  });
});
describe('Firestore rules', () => {
  it('allows public read of active product', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'shops', 'shop1', 'products', 'p1')));
  });
  it('allows owner product write', async () => {
    const db = env.authenticatedContext('owner1').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'shops', 'shop1', 'products', 'p2'), {
        name: 'DAP',
        categoryId: 'c1',
        images: [{ id: 'i', url: 'x', storagePath: 'x', isCover: true }],
        unit: 'kg',
        packSize: 50,
        mrp: 1000,
        availabilityStatus: 'available',
        active: true,
        createdBy: 'owner1',
        updatedBy: 'owner1',
      }),
    );
  });
  it('denies direct client order creation', async () => {
    const db = env.authenticatedContext('anon1').firestore();
    await assertFails(setDoc(doc(db, 'shops', 'shop1', 'orders', 'new'), { status: 'placed' }));
  });
  it('allows verified farmer to read own order only', async () => {
    const own = env.authenticatedContext('phone1', { phone_number: '+919876543210' }).firestore();
    const other = env.authenticatedContext('phone2', { phone_number: '+919111111111' }).firestore();
    await assertSucceeds(getDoc(doc(own, 'shops', 'shop1', 'orders', 'o1')));
    await assertFails(getDoc(doc(other, 'shops', 'shop1', 'orders', 'o1')));
  });
  it('allows public active-product query with active filter', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(
      getDocs(query(collection(db, 'shops', 'shop1', 'products'), where('active', '==', true))),
    );
  });
});
