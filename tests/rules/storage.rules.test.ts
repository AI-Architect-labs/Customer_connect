// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';
import { readFileSync } from 'node:fs';

let env: RulesTestEnvironment;
const projectId = process.env.GCLOUD_PROJECT ?? 'agriconnect-dev';

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });
});

afterAll(async () => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'owners', 'owner1'), {
      shopId: 'shop1',
      email: 'owner@example.com',
      displayName: 'Owner',
      role: 'owner',
      createdAt: new Date(),
    });
  });
});

describe('Storage rules', () => {
  it('allows the shop owner to upload a small image and allows public read', async () => {
    const ownerStorage = env.authenticatedContext('owner1').storage();
    const imageRef = ref(ownerStorage, 'shops/shop1/products/p1/image.jpg');
    await assertSucceeds(
      uploadBytes(imageRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' }),
    );

    const publicStorage = env.unauthenticatedContext().storage();
    await assertSucceeds(getBytes(ref(publicStorage, 'shops/shop1/products/p1/image.jpg')));
  });

  it('denies a non-owner upload', async () => {
    const storage = env.authenticatedContext('farmer1').storage();
    await assertFails(
      uploadBytes(ref(storage, 'shops/shop1/products/p1/image.jpg'), new Uint8Array([1]), {
        contentType: 'image/jpeg',
      }),
    );
  });

  it('denies non-image uploads even for the owner', async () => {
    const storage = env.authenticatedContext('owner1').storage();
    await assertFails(
      uploadBytes(ref(storage, 'shops/shop1/products/p1/file.txt'), new Uint8Array([1]), {
        contentType: 'text/plain',
      }),
    );
  });

  it('denies an upload without content-type metadata', async () => {
    const storage = env.authenticatedContext('owner1').storage();
    await assertFails(
      uploadBytes(ref(storage, 'shops/shop1/products/p1/no-content-type.jpg'), new Uint8Array([1])),
    );
  });
});
