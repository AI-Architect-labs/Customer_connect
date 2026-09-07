import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Product, ProductImage } from '@/types/product';

const storage = vi.hoisted(() => ({ uploadFile: vi.fn(), deleteFile: vi.fn() }));
const repository = vi.hoisted(() => ({
  createProductWithId: vi.fn(),
  newProductId: vi.fn(() => 'product-1'),
  updateProduct: vi.fn(),
}));
const log = vi.hoisted(() => ({ warn: vi.fn(), debug: vi.fn() }));

vi.mock('@/lib/firebase/storage', () => storage);
vi.mock('@/lib/repositories/productRepository', () => repository);
vi.mock('@/lib/utils/logger', () => ({ logger: log }));

import { removeProductImage, saveProduct } from '@/features/catalog/services/productService';

const input = {
  name: 'Urea',
  brand: 'IFFCO',
  categoryId: 'fertilizers',
  description: '',
  unit: 'kg' as const,
  packSize: 50,
  mrp: 500,
  discountPrice: 450,
  availabilityStatus: 'available' as const,
  stockQty: 10,
  active: true,
};

function file(name: string): File {
  return new File(['image'], name, { type: 'image/jpeg' });
}

function image(id: string, isCover = false): ProductImage {
  return {
    id,
    url: `https://example.test/${id}`,
    storagePath: `shops/demo-shop/products/product-1/${id}.jpg`,
    isCover,
    uploadedAt: Timestamp.now(),
  };
}

function product(images: ProductImage[]): Product {
  const timestamp = Timestamp.now();
  return {
    id: 'product-1',
    ...input,
    images,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'owner-1',
    updatedBy: 'owner-1',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  repository.newProductId.mockReturnValue('product-1');
  storage.uploadFile.mockImplementation(async (path: string) => `https://example.test/${path}`);
  storage.deleteFile.mockResolvedValue(undefined);
  repository.createProductWithId.mockResolvedValue(undefined);
  repository.updateProduct.mockResolvedValue(undefined);
});

describe('product image upload compensation', () => {
  it('keeps uploads when image uploads and Firestore creation succeed', async () => {
    await expect(
      saveProduct('demo-shop', 'owner-1', input, [file('a.jpg'), file('b.jpg'), file('c.jpg')]),
    ).resolves.toBe('product-1');
    expect(repository.createProductWithId).toHaveBeenCalledOnce();
    expect(storage.uploadFile).toHaveBeenCalledTimes(3);
    expect(storage.deleteFile).not.toHaveBeenCalled();
  });

  it('cleans the first object when the second upload fails', async () => {
    storage.uploadFile
      .mockResolvedValueOnce('https://example.test/a')
      .mockRejectedValueOnce(new Error('second upload failed'));
    await expect(
      saveProduct('demo-shop', 'owner-1', input, [file('a.jpg'), file('b.jpg')]),
    ).rejects.toThrow('second upload failed');
    expect(storage.deleteFile).toHaveBeenCalledOnce();
    expect(repository.createProductWithId).not.toHaveBeenCalled();
  });

  it('cleans every new object when Firestore creation fails', async () => {
    repository.createProductWithId.mockRejectedValueOnce(new Error('create failed'));
    await expect(
      saveProduct('demo-shop', 'owner-1', input, [file('a.jpg'), file('b.jpg')]),
    ).rejects.toThrow('create failed');
    expect(storage.deleteFile).toHaveBeenCalledTimes(2);
  });

  it('cleans only new edit uploads and preserves existing images', async () => {
    const existing = product([image('existing', true)]);
    storage.uploadFile
      .mockResolvedValueOnce('https://example.test/new')
      .mockRejectedValueOnce(new Error('edit upload failed'));
    await expect(
      saveProduct('demo-shop', 'owner-1', input, [file('new.jpg'), file('fail.jpg')], existing),
    ).rejects.toThrow('edit upload failed');
    expect(storage.deleteFile).toHaveBeenCalledOnce();
    expect(storage.deleteFile).not.toHaveBeenCalledWith(existing.images[0]?.storagePath);
    expect(repository.updateProduct).not.toHaveBeenCalled();
  });

  it('cleans all new edit uploads when the Firestore update fails', async () => {
    const existing = product([image('existing', true)]);
    repository.updateProduct.mockRejectedValueOnce(new Error('update failed'));
    await expect(
      saveProduct('demo-shop', 'owner-1', input, [file('new-c.jpg'), file('new-d.jpg')], existing),
    ).rejects.toThrow('update failed');
    expect(storage.deleteFile).toHaveBeenCalledTimes(2);
    expect(storage.deleteFile).not.toHaveBeenCalledWith(existing.images[0]?.storagePath);
  });

  it('preserves the primary failure when cleanup deletion fails', async () => {
    repository.createProductWithId.mockRejectedValueOnce(new Error('primary failure'));
    storage.deleteFile.mockRejectedValueOnce(new Error('cleanup failure'));
    await expect(saveProduct('demo-shop', 'owner-1', input, [file('a.jpg')])).rejects.toThrow(
      'primary failure',
    );
    expect(log.warn).toHaveBeenCalledOnce();
  });

  it('rejects more than six total images before uploading', async () => {
    const files = Array.from({ length: 7 }, (_, index) => file(`${index}.jpg`));
    await expect(saveProduct('demo-shop', 'owner-1', input, files)).rejects.toThrow(
      'up to 6 images',
    );
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });

  it('rejects a zero-image product', async () => {
    await expect(saveProduct('demo-shop', 'owner-1', input, [])).rejects.toThrow(
      'at least one product image',
    );
    expect(repository.createProductWithId).not.toHaveBeenCalled();
  });
});

describe('explicit product image deletion', () => {
  it('cannot remove the final image', async () => {
    await expect(
      removeProductImage('demo-shop', product([image('only', true)]), 'only', 'owner-1'),
    ).rejects.toThrow('keep at least one image');
    expect(repository.updateProduct).not.toHaveBeenCalled();
    expect(storage.deleteFile).not.toHaveBeenCalled();
  });

  it('selects a valid cover after deleting the cover image', async () => {
    const original = product([image('cover', true), image('remaining')]);
    await removeProductImage('demo-shop', original, 'cover', 'owner-1');
    const patch = repository.updateProduct.mock.calls[0]?.[2] as { images: ProductImage[] };
    expect(patch.images).toHaveLength(1);
    expect(patch.images[0]?.isCover).toBe(true);
    expect(storage.deleteFile).toHaveBeenCalledOnce();
    expect(storage.deleteFile).toHaveBeenCalledWith(original.images[0]?.storagePath);
  });

  it('restores image metadata when object deletion fails', async () => {
    const original = product([image('cover', true), image('remaining')]);
    storage.deleteFile.mockRejectedValueOnce(new Error('delete failed'));
    await expect(removeProductImage('demo-shop', original, 'cover', 'owner-1')).rejects.toThrow(
      'delete failed',
    );
    expect(repository.updateProduct).toHaveBeenCalledTimes(2);
    expect(repository.updateProduct.mock.calls[1]?.[2]).toMatchObject({ images: original.images });
  });
});
