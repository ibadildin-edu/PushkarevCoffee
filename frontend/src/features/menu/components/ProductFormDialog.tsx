import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Category, Product } from '../../../api/types';
import { errorStatus, getErrorMessage, type ApiError } from '../../../shared/lib/apiError';
import { Button } from '../../../shared/ui/Button';
import { Dialog } from '../../../shared/ui/Dialog';
import { Field, Input } from '../../../shared/ui/Field';
import { Select } from '../../../shared/ui/Select';
import { useCreateProductMutation, useUpdateProductMutation } from '../api';

const MAX_PRICE = 1_000_000;

const productSchema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(100, 'Не длиннее 100 символов'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  price: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Цена — целое число в тенге, без копеек')
    .refine((value) => Number(value) > 0, 'Цена должна быть больше 0')
    .refine((value) => Number(value) <= MAX_PRICE, 'Слишком большая цена'),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  /** null = create a new product. */
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}

function defaults(product: Product | null, categories: Category[]): ProductFormValues {
  return {
    name: product?.name ?? '',
    categoryId: String(product?.category_id ?? categories[0]?.id ?? ''),
    price: product ? String(product.price) : '',
    isActive: product?.is_active ?? true,
  };
}

function ProductForm({ product, categories, onClose }: Omit<ProductFormDialogProps, 'open'>) {
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults(product, categories),
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      category_id: Number(values.categoryId),
      price: Number(values.price),
      is_active: values.isActive,
    };
    try {
      if (product) await updateProduct({ id: product.id, changes: payload }).unwrap();
      else await createProduct(payload).unwrap();
      onClose();
    } catch (caught) {
      const error = caught as ApiError;
      if (errorStatus(error) === 409) {
        setError('name', { message: 'Позиция с таким названием уже есть' });
      } else {
        setError('root', { message: getErrorMessage(error) });
      }
    }
  });

  const invalid = (name: keyof ProductFormValues) => ({
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `product-${name}-error` : undefined,
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Название" htmlFor="product-name" error={errors.name?.message}>
        <Input
          id="product-name"
          autoFocus
          autoComplete="off"
          {...invalid('name')}
          {...register('name')}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Категория" htmlFor="product-categoryId" error={errors.categoryId?.message}>
          <Select
            id="product-categoryId"
            className="[&_select]:h-11"
            {...invalid('categoryId')}
            {...register('categoryId')}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Цена, ₸" htmlFor="product-price" error={errors.price?.message}>
          <Input
            id="product-price"
            inputMode="numeric"
            placeholder="1400"
            {...invalid('price')}
            {...register('price')}
          />
        </Field>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft select-none">
        <input type="checkbox" className="size-4 accent-accent" {...register('isActive')} />В
        продаже (видна в меню и симуляторе)
      </label>

      {errors.root && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {errors.root.message}
        </p>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохраняем…' : product ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </form>
  );
}

export function ProductFormDialog({ open, product, categories, onClose }: ProductFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={product ? 'Изменить позицию' : 'Новая позиция'}>
      {/* key: a fresh form (and default values) for every opened product. */}
      <ProductForm
        key={product?.id ?? 'new'}
        product={product}
        categories={categories}
        onClose={onClose}
      />
    </Dialog>
  );
}
