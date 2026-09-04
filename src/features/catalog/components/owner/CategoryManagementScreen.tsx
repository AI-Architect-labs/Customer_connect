'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  categoryFormSchema,
  type CategoryFormInput,
  type CategoryFormValue,
} from '@/schemas/categorySchema';
import { useAuth } from '@/features/auth';
import { useCategories } from '../../hooks/useCategories';
import { saveCategory, setCategoryActive } from '../../services/categoryService';
import type { Category } from '@/types/category';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
export function CategoryManagementScreen() {
  const { session } = useAuth();
  const shopId = session?.ownerProfile?.shopId ?? '';
  const { categories } = useCategories(shopId, true);
  const [editing, setEditing] = useState<Category | undefined>();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput, unknown, CategoryFormValue>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', sortOrder: 0, active: true },
  });
  function begin(c?: Category) {
    setEditing(c);
    reset(
      c
        ? { name: c.name, sortOrder: c.sortOrder, active: c.active }
        : { name: '', sortOrder: categories.length, active: true },
    );
  }
  async function submit(v: CategoryFormValue) {
    try {
      await saveCategory(shopId, session!.uid, v, editing);
      showToast({ type: 'success', message: editing ? 'Category updated.' : 'Category created.' });
      begin();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not save category.',
      });
    }
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Categories</h1>
        <Button onClick={() => begin()}>Add Category</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border bg-background p-4"
            >
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  Order {c.sortOrder} · {c.active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => begin(c)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void setCategoryActive(shopId, session!.uid, c, !c.active)}
                >
                  {c.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={handleSubmit(submit)}
          className="h-fit space-y-3 rounded-lg border bg-background p-4"
        >
          <h2 className="font-bold">{editing ? 'Edit Category' : 'New Category'}</h2>
          <label className="block">
            <span className="text-sm font-semibold">Name</span>
            <Input {...register('name')} />
            {errors.name && <span className="text-sm text-destructive">{errors.name.message}</span>}
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Sort order</span>
            <Input type="number" {...register('sortOrder')} />
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" {...register('active')} />
            Active
          </label>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Category'}
          </Button>
        </form>
      </div>
    </div>
  );
}
