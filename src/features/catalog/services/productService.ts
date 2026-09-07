import { productFormSchema, type ProductFormInput } from '@/schemas/productSchema';
import {
  createProductWithId,
  newProductId,
  updateProduct,
} from '@/lib/repositories/productRepository';
import { uploadFile, deleteFile } from '@/lib/firebase/storage';
import { Timestamp } from 'firebase/firestore';
import type { Product, ProductImage } from '@/types/product';
import { MAX_IMAGE_BYTES, MAX_PRODUCT_IMAGES } from '@/config/app';
import { logger } from '@/lib/utils/logger';

function assertImageInvariants(images: ProductImage[]): void {
  if (images.length === 0) throw new Error('Add at least one product image.');
  if (images.length > MAX_PRODUCT_IMAGES)
    throw new Error(`A product can have up to ${MAX_PRODUCT_IMAGES} images.`);
  if (images.filter((image) => image.isCover).length !== 1)
    throw new Error('A product must have exactly one cover image.');
}

async function cleanupUploadedPaths(
  shopId: string,
  productId: string,
  uploadedPaths: string[],
): Promise<void> {
  const expectedPrefix = `shops/${shopId}/products/${productId}/`;
  const safePaths = uploadedPaths.filter((path) => path.startsWith(expectedPrefix));
  const results = await Promise.allSettled(safePaths.map((path) => deleteFile(path)));
  const failedPaths = safePaths.filter((_, index) => results[index]?.status === 'rejected');
  if (failedPaths.length > 0) {
    logger.warn('Some newly uploaded product images could not be rolled back.', {
      failedCount: failedPaths.length,
    });
    logger.debug('Product image rollback paths requiring later cleanup.', { paths: failedPaths });
  }
}

async function uploadImages(
  shopId: string,
  productId: string,
  files: File[],
  existing: ProductImage[],
  uploadedPaths: string[],
): Promise<ProductImage[]> {
  if (existing.length + files.length > MAX_PRODUCT_IMAGES)
    throw new Error(`A product can have up to ${MAX_PRODUCT_IMAGES} images.`);
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name} is larger than 5 MB.`);
    if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  }
  const result = [...existing];
  for (const file of files) {
    const id = crypto.randomUUID();
    const path = `shops/${shopId}/products/${productId}/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const url = await uploadFile(path, file, { contentType: file.type });
    uploadedPaths.push(path);
    result.push({ id, url, storagePath: path, isCover: false, uploadedAt: Timestamp.now() });
  }
  if (result.length && !result.some((i) => i.isCover)) result[0] = { ...result[0]!, isCover: true };
  return result;
}

export async function saveProduct(
  shopId: string,
  ownerUid: string,
  input: ProductFormInput,
  files: File[],
  existing?: Product,
): Promise<string> {
  const value = productFormSchema.parse(input);
  const productId = existing?.id ?? newProductId(shopId);
  const uploadedPaths: string[] = [];
  try {
    const images = await uploadImages(
      shopId,
      productId,
      files,
      existing?.images ?? [],
      uploadedPaths,
    );
    assertImageInvariants(images);
    const discountPrice =
      value.discountPrice === '' || value.discountPrice === undefined
        ? undefined
        : Number(value.discountPrice);
    const stockQty =
      value.stockQty === '' || value.stockQty === undefined ? undefined : Number(value.stockQty);
    const deactivating = !value.active && existing?.active !== false;
    const data = {
      ...value,
      brand: value.brand || undefined,
      description: value.description || undefined,
      discountPrice,
      stockQty,
      images,
      createdBy: existing?.createdBy ?? ownerUid,
      updatedBy: ownerUid,
      deletedAt: deactivating ? Timestamp.now() : (existing?.deletedAt ?? null),
      deletedBy: deactivating ? ownerUid : (existing?.deletedBy ?? null),
    };
    if (existing) await updateProduct(shopId, productId, data);
    else await createProductWithId(shopId, productId, data);
    return productId;
  } catch (error) {
    await cleanupUploadedPaths(shopId, productId, uploadedPaths);
    throw error;
  }
}
export async function setProductCover(
  shopId: string,
  product: Product,
  imageId: string,
  ownerUid: string,
): Promise<void> {
  if (!product.images.some((image) => image.id === imageId))
    throw new Error('The selected product image does not exist.');
  const images = product.images.map((i) => ({ ...i, isCover: i.id === imageId }));
  assertImageInvariants(images);
  await updateProduct(shopId, product.id, { images, updatedBy: ownerUid });
}
export async function removeProductImage(
  shopId: string,
  product: Product,
  imageId: string,
  ownerUid: string,
): Promise<void> {
  if (product.images.length <= 1) throw new Error('A product must keep at least one image.');
  const target = product.images.find((i) => i.id === imageId);
  if (!target) return;
  let images = product.images.filter((i) => i.id !== imageId);
  if (!images.some((i) => i.isCover))
    images = images.map((i, idx) => ({ ...i, isCover: idx === 0 }));
  assertImageInvariants(images);
  await updateProduct(shopId, product.id, { images, updatedBy: ownerUid });
  try {
    await deleteFile(target.storagePath);
  } catch (error) {
    try {
      await updateProduct(shopId, product.id, { images: product.images, updatedBy: ownerUid });
    } catch {
      logger.warn('Product image metadata rollback failed after object deletion failed.');
    }
    throw error;
  }
}

export async function reorderProductImage(
  shopId: string,
  product: Product,
  imageId: string,
  direction: 'left' | 'right',
  ownerUid: string,
): Promise<void> {
  const index = product.images.findIndex((image) => image.id === imageId);
  if (index < 0) return;
  const target = direction === 'left' ? index - 1 : index + 1;
  if (target < 0 || target >= product.images.length) return;
  const images = [...product.images];
  const [moved] = images.splice(index, 1);
  if (!moved) return;
  images.splice(target, 0, moved);
  await updateProduct(shopId, product.id, { images, updatedBy: ownerUid });
}
