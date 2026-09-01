import { createShop, getShop, updateShop } from '@/lib/repositories/shopRepository';
import { uploadFile, deleteFile } from '@/lib/firebase/storage';
import { shopFormSchema, type ShopFormInput } from '@/schemas/shopSchema';
import type { Shop } from '@/types/shop';

export async function saveShopProfile(shopId:string, ownerUid:string, input:ShopFormInput, existing:Shop|null, photo?:File):Promise<void>{
  const value=shopFormSchema.parse(input);
  let shopPhotoURL=existing?.shopPhotoURL; let shopPhotoStoragePath=existing?.shopPhotoStoragePath;
  if(photo){
    if(shopPhotoStoragePath) await deleteFile(shopPhotoStoragePath).catch(()=>undefined);
    shopPhotoStoragePath=`shops/${shopId}/shop/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    shopPhotoURL=await uploadFile(shopPhotoStoragePath,photo,{contentType:photo.type});
  }
  const data={...value,ownerUid,shopPhotoURL,shopPhotoStoragePath,createdBy:existing?.createdBy??ownerUid,updatedBy:ownerUid,deletedAt:existing?.deletedAt??null,deletedBy:existing?.deletedBy??null};
  if(existing) await updateShop(shopId,data); else await createShop(shopId,data);
}
export { getShop };
