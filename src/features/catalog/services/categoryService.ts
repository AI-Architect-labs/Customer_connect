import { Timestamp } from 'firebase/firestore';
import { categoryFormSchema, type CategoryFormInput } from '@/schemas/categorySchema';
import { createCategory, updateCategory } from '@/lib/repositories/categoryRepository';
import type { Category } from '@/types/category';
export async function saveCategory(shopId:string, ownerUid:string, input:CategoryFormInput, existing?:Category):Promise<string>{
 const value=categoryFormSchema.parse(input); const nowDelete=!value.active && existing?.active!==false;
 const data={...value,createdBy:existing?.createdBy??ownerUid,updatedBy:ownerUid,deletedAt:nowDelete?Timestamp.now():(existing?.deletedAt??null),deletedBy:nowDelete?ownerUid:(existing?.deletedBy??null)};
 if(existing){await updateCategory(shopId,existing.id,data);return existing.id;} return createCategory(shopId,data);
}
export async function setCategoryActive(shopId:string, ownerUid:string, category:Category, active:boolean):Promise<void>{
 await updateCategory(shopId,category.id,{active,updatedBy:ownerUid,deletedAt:active?category.deletedAt??null:Timestamp.now(),deletedBy:active?category.deletedBy??null:ownerUid});
}
