import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();
const db = getFirestore();
const REGION = 'us-central1';
const ENFORCE_APP_CHECK = process.env.ENFORCE_APP_CHECK === 'true';

type OrderStatus = 'placed' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
interface CreateOrderRequest {
  shopId?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  address?: unknown;
  village?: unknown;
  landmark?: unknown;
  items?: unknown;
}

function requireAuth(auth: { uid: string; token: Record<string, unknown> } | undefined) {
  if (!auth) throw new HttpsError('unauthenticated', 'Authentication is required.');
  return auth;
}
function nonEmpty(value: unknown, field: string, max = 500): string {
  if (typeof value !== 'string' || !value.trim()) throw new HttpsError('invalid-argument', `${field} is required.`);
  const result = value.trim();
  if (result.length > max) throw new HttpsError('invalid-argument', `${field} is too long.`);
  return result;
}
function optionalText(value: unknown, max = 250): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Invalid text value.');
  const result = value.trim();
  if (result.length > max) throw new HttpsError('invalid-argument', 'Text value is too long.');
  return result || undefined;
}
function normalizePhone(value: unknown): string {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Phone number is required.');
  let digits = value.replace(/[^\d+]/g, '');
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (!/^[6-9]\d{9}$/.test(digits)) throw new HttpsError('invalid-argument', 'Enter a valid Indian mobile number.');
  return `+91${digits}`;
}
async function assertOwner(uid: string, shopId: string) {
  const owner = await db.doc(`owners/${uid}`).get();
  if (!owner.exists || owner.data()?.shopId !== shopId || owner.data()?.role !== 'owner') {
    throw new HttpsError('permission-denied', 'You do not manage this shop.');
  }
}


async function enforceOrderRateLimit(uid: string): Promise<void> {
  const ref = db.doc(`_rateLimits/${uid}`);
  const now = Timestamp.now();
  const windowMs = 15 * 60 * 1000;
  const maxOrders = 10;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      tx.create(ref, { windowStartedAt: now, count: 1 });
      return;
    }
    const data = snap.data()!;
    const started = data.windowStartedAt instanceof Timestamp ? data.windowStartedAt : now;
    if (now.toMillis() - started.toMillis() > windowMs) {
      tx.set(ref, { windowStartedAt: now, count: 1 });
      return;
    }
    const count = Number(data.count ?? 0);
    if (count >= maxOrders) {
      throw new HttpsError('resource-exhausted', 'Too many orders were submitted from this device. Please wait a few minutes and try again.');
    }
    tx.update(ref, { count: count + 1 });
  });
}

export const createOrder = onCall({ region: REGION, enforceAppCheck: ENFORCE_APP_CHECK }, async (request) => {
  const auth = requireAuth(request.auth);
  await enforceOrderRateLimit(auth.uid);
  const input = request.data as CreateOrderRequest;
  const shopId = nonEmpty(input.shopId, 'shopId', 100);
  const customerName = nonEmpty(input.customerName, 'Name', 120);
  const customerPhone = normalizePhone(input.customerPhone);
  const address = nonEmpty(input.address, 'Address', 500);
  const village = optionalText(input.village, 120);
  const landmark = optionalText(input.landmark, 180);
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) {
    throw new HttpsError('invalid-argument', 'Order must contain between 1 and 50 items.');
  }
  const requested = input.items.map((raw) => {
    if (!raw || typeof raw !== 'object') throw new HttpsError('invalid-argument', 'Invalid order item.');
    const item = raw as { productId?: unknown; qty?: unknown };
    const productId = nonEmpty(item.productId, 'productId', 100);
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new HttpsError('invalid-argument', 'Quantity must be 1–99.');
    return { productId, qty };
  });
  if (new Set(requested.map((i) => i.productId)).size !== requested.length) {
    throw new HttpsError('invalid-argument', 'Duplicate products are not allowed in an order.');
  }

  const shopRef = db.doc(`shops/${shopId}`);
  const orderRef = shopRef.collection('orders').doc();
  const customerRef = shopRef.collection('customers').doc(customerPhone);
  const now = Timestamp.now();

  const result = await db.runTransaction(async (tx) => {
    const shopSnap = await tx.get(shopRef);
    if (!shopSnap.exists || shopSnap.data()?.active !== true) throw new HttpsError('failed-precondition', 'This shop is not accepting orders right now.');
    const productSnaps = await Promise.all(requested.map((i) => tx.get(shopRef.collection('products').doc(i.productId))));
    const orderItems = requested.map((requestedItem, index) => {
      const snap = productSnaps[index];
      if (!snap?.exists) throw new HttpsError('not-found', 'One of the selected products no longer exists.');
      const p = snap.data()!;
      if (p.active !== true || p.availabilityStatus === 'out_of_stock') throw new HttpsError('failed-precondition', `${String(p.name ?? 'A product')} is currently unavailable.`);
      const unitPrice = typeof p.discountPrice === 'number' ? p.discountPrice : p.mrp;
      if (typeof unitPrice !== 'number' || unitPrice <= 0) throw new HttpsError('failed-precondition', 'A product has an invalid price.');
      return { productId: requestedItem.productId, name: String(p.name), brand: p.brand ? String(p.brand) : null, unit: String(p.unit), packSize: Number(p.packSize), qty: requestedItem.qty, unitPrice };
    });
    const subtotal = orderItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    tx.create(orderRef, {
      customerName, customerPhone, address,
      ...(village ? { village } : {}), ...(landmark ? { landmark } : {}),
      items: orderItems, subtotal, status: 'placed' as OrderStatus,
      statusHistory: [{ status: 'placed', at: now, note: null }],
      createdByUid: auth.uid, createdAt: now, updatedAt: now, updatedBy: auth.uid,
    });
    const existing = await tx.get(customerRef);
    if (existing.exists) {
      tx.update(customerRef, { name: customerName, address, village: village ?? FieldValue.delete(), landmark: landmark ?? FieldValue.delete(), lastOrderAt: now, totalOrders: FieldValue.increment(1), updatedBy: auth.uid });
    } else {
      tx.create(customerRef, { name: customerName, address, ...(village ? { village } : {}), ...(landmark ? { landmark } : {}), lastOrderAt: now, totalOrders: 1, createdAt: now, createdBy: auth.uid, updatedBy: auth.uid });
    }
    return { orderId: orderRef.id, subtotal };
  });
  return result;
});

export const getCheckoutPrefill = onCall({ region: REGION, enforceAppCheck: ENFORCE_APP_CHECK }, async (request) => {
  const auth = requireAuth(request.auth);
  const shopId = nonEmpty(request.data?.shopId, 'shopId', 100);
  const phone = normalizePhone(request.data?.phone);
  const snap = await db.doc(`shops/${shopId}/customers/${phone}`).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  const verifiedPhone = typeof auth.token.phone_number === 'string' ? auth.token.phone_number : undefined;
  const sameAnonymousIdentity = data.createdBy === auth.uid || data.updatedBy === auth.uid;
  if (verifiedPhone !== phone && !sameAnonymousIdentity) return null;
  return { name: String(data.name ?? ''), address: String(data.address ?? ''), village: data.village ? String(data.village) : undefined, landmark: data.landmark ? String(data.landmark) : undefined };
});

export const updateOrderStatus = onCall({ region: REGION, enforceAppCheck: ENFORCE_APP_CHECK }, async (request) => {
  const auth = requireAuth(request.auth);
  const shopId = nonEmpty(request.data?.shopId, 'shopId', 100);
  const orderId = nonEmpty(request.data?.orderId, 'orderId', 100);
  const target = nonEmpty(request.data?.status, 'status', 30) as OrderStatus;
  await assertOwner(auth.uid, shopId);
  const orderRef = db.doc(`shops/${shopId}/orders/${orderId}`);
  const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = { placed: ['confirmed', 'cancelled'], confirmed: ['out_for_delivery', 'cancelled'], out_for_delivery: ['delivered'] };
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef); if (!snap.exists) throw new HttpsError('not-found', 'Order not found.');
    const order = snap.data()!; const current = order.status as OrderStatus;
    if (!(allowed[current] ?? []).includes(target)) throw new HttpsError('failed-precondition', `Cannot move order from ${current} to ${target}.`);
    let items = order.items as Array<Record<string, unknown>>;
    let subtotal = Number(order.subtotal);
    if (current === 'placed' && Array.isArray(request.data?.items)) {
      const qtyMap = new Map<string, number>();
      for (const raw of request.data.items as Array<{ productId?: unknown; qty?: unknown }>) {
        const id = nonEmpty(raw.productId, 'productId', 100); const qty = Number(raw.qty);
        if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new HttpsError('invalid-argument', 'Invalid quantity.'); qtyMap.set(id, qty);
      }
      items = items.map((item) => ({ ...item, qty: qtyMap.get(String(item.productId)) ?? Number(item.qty) }));
      subtotal = items.reduce((sum, item) => sum + Number(item.qty) * Number(item.unitPrice), 0);
    }
    const now = Timestamp.now(); const cancelReason = target === 'cancelled' ? nonEmpty(request.data?.cancelReason, 'Cancellation reason', 250) : undefined;
    tx.update(orderRef, { status: target, items, subtotal, statusHistory: [...(order.statusHistory ?? []), { status: target, at: now, note: cancelReason ?? null }], ...(cancelReason ? { cancelReason } : {}), updatedAt: now, updatedBy: auth.uid });
  });
  return { ok: true };
});

export const cancelOrder = onCall({ region: REGION, enforceAppCheck: ENFORCE_APP_CHECK }, async (request) => {
  const auth = requireAuth(request.auth);
  const shopId = nonEmpty(request.data?.shopId, 'shopId', 100); const orderId = nonEmpty(request.data?.orderId, 'orderId', 100); const reason = nonEmpty(request.data?.reason, 'Cancellation reason', 250);
  const verifiedPhone = typeof auth.token.phone_number === 'string' ? auth.token.phone_number : undefined;
  if (!verifiedPhone) throw new HttpsError('permission-denied', 'Phone verification is required.');
  const ref = db.doc(`shops/${shopId}/orders/${orderId}`);
  await db.runTransaction(async (tx) => { const snap = await tx.get(ref); if (!snap.exists) throw new HttpsError('not-found', 'Order not found.'); const data = snap.data()!; if (data.customerPhone !== verifiedPhone) throw new HttpsError('permission-denied', 'This order belongs to another phone number.'); if (data.status !== 'placed') throw new HttpsError('failed-precondition', 'Only placed orders can be cancelled by the customer.'); const now=Timestamp.now(); tx.update(ref,{status:'cancelled',cancelReason:reason,statusHistory:[...(data.statusHistory??[]),{status:'cancelled',at:now,note:reason}],updatedAt:now,updatedBy:auth.uid}); });
  return { ok: true };
});

export const registerOwnerFcmToken = onCall({ region: REGION, enforceAppCheck: ENFORCE_APP_CHECK }, async (request) => {
  const auth=requireAuth(request.auth); const shopId=nonEmpty(request.data?.shopId,'shopId',100); const token=nonEmpty(request.data?.token,'token',4096); await assertOwner(auth.uid,shopId);
  const id = Buffer.from(token).toString('base64url').slice(0, 120);
  await db.doc(`owners/${auth.uid}/devices/${id}`).set({ token, shopId, updatedAt: Timestamp.now() }, { merge: true });
  return { ok:true };
});

export const notifyOwnerOnNewOrder = onDocumentCreated({ region: REGION, document: 'shops/{shopId}/orders/{orderId}' }, async (event) => {
  const shopId=event.params.shopId; const orderId=event.params.orderId; const shop=await db.doc(`shops/${shopId}`).get(); const ownerUid=shop.data()?.ownerUid; if(!ownerUid)return;
  const devices=await db.collection(`owners/${ownerUid}/devices`).get(); const tokens=devices.docs.map(d=>d.data().token).filter((t):t is string=>typeof t==='string'&&t.length>0); if(tokens.length===0)return;
  const order=event.data?.data(); const response=await getMessaging().sendEachForMulticast({tokens,notification:{title:'New AgriConnect order',body:`${String(order?.customerName??'Farmer')} placed an order of ₹${Number(order?.subtotal??0).toLocaleString('en-IN')}`},webpush:{fcmOptions:{link:`/owner/orders/${orderId}`}}});
  const invalid=response.responses.map((r,i)=>!r.success&&['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(r.error?.code??'')?devices.docs[i]?.ref:null).filter(Boolean);
  await Promise.all(invalid.map(ref=>ref!.delete()));
});
