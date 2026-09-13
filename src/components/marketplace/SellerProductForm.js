"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productSchema,
  PRODUCT_IMAGE_TYPES,
  PRODUCT_IMAGE_MAX_MB,
} from "@/lib/validators";
import { useProductStore, SELLER_ROLES } from "@/store/productStore";
import { useCategoryStore } from "@/store/categoryStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { ProductImage } from "@/components/marketplace/ProductImage";
import { BackendHealth } from "@/lib/backendHealth";
import api from "@/lib/api";

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

async function resolveImageUrl(file) {
  // Backend-first (FormData POST /uploads precedent: serviceStore, ChatPanel),
  // local data-URL fallback per docs/BACKEND_CONTRACTS.md migration rule.
  if (BackendHealth.isAvailable() === true) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url || res.data?.imageUrl;
      if (typeof url === "string" && url.length > 0) return url;
    } catch {
      // Fall through to local data URL
    }
  }
  return readAsDataURL(file);
}

function categoryValue(cat) {
  return cat.slug || cat.id || cat.value || "";
}

function categoryLabel(cat) {
  return cat.name || cat.label || categoryValue(cat);
}

/**
 * Seller part form. Persists to the backend via productStore (POST/PATCH
 * /api/products), with a local-only fallback when offline.
 * Reused in create mode (seller dashboard, marketplace CTA) and edit mode
 * (My Listings).
 */
export function SellerProductForm({ initialProduct = null, onSuccess }) {
  const isEdit = Boolean(initialProduct);
  const addSellerProduct = useProductStore((s) => s.addSellerProduct);
  const updateSellerProduct = useProductStore((s) => s.updateSellerProduct);
  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const role = useAuthStore((s) => s.user?.role);
  const [pickedFile, setPickedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(initialProduct?.image || "");
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    // Re-validate on blur so the required-photo error surfaces before submit.
    mode: "onTouched",
    defaultValues: {
      name: initialProduct?.name || "",
      price: initialProduct?.price ?? "",
      brand: initialProduct?.brand || "",
      category: initialProduct?.category || "",
      description: initialProduct?.description || "",
      availability: initialProduct?.availability !== false,
      deliveryTime: initialProduct?.deliveryTime || "",
      image: initialProduct?.image || "",
    },
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const availability = watch("availability");

  const handleFile = async (file) => {
    setPickedFile(file);
    if (!file) {
      setImageUrl("");
      setValue("image", "", { shouldValidate: true });
      return;
    }
    if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
      setPickedFile(null);
      setError("image", { type: "validate", message: "Use JPG, PNG or WebP." });
      return;
    }
    if (file.size > PRODUCT_IMAGE_MAX_MB * 1024 * 1024) {
      setPickedFile(null);
      setError("image", {
        type: "validate",
        message: `Image must be under ${PRODUCT_IMAGE_MAX_MB}MB.`,
      });
      return;
    }
    setUploading(true);
    try {
      const url = await resolveImageUrl(file);
      setImageUrl(url);
      setValue("image", url, { shouldValidate: true });
      clearErrors("image");
    } catch {
      setPickedFile(null);
      setError("image", {
        type: "validate",
        message: "Could not read image. Try another file.",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!SELLER_ROLES.includes(role)) {
      useToastStore.getState().error("Only sellers, mechanics and garages can sell parts.");
      return;
    }
    const payload = { ...data, price: Number(data.price) };
    const saved = isEdit
      ? await updateSellerProduct(initialProduct.id, payload)
      : await addSellerProduct(payload);
    if (saved && onSuccess) onSuccess(saved);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-lux rounded-2xl p-5 space-y-4"
    >
      <Input
        label="Part name *"
        placeholder="e.g. Brake Pad Set (Front)"
        error={errors.name?.message}
        {...register("name")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Price (₹) *"
          type="number"
          min="0"
          step="any"
          placeholder="e.g. 1249"
          error={errors.price?.message}
          {...register("price")}
        />
        <Input
          label="Brand"
          placeholder="e.g. Bosch"
          error={errors.brand?.message}
          {...register("brand")}
        />
      </div>

      <div className="w-full">
        <label
          htmlFor="seller-product-category"
          className="mb-2 block text-sm font-medium text-text-muted"
        >
          Category
        </label>
        <select
          id="seller-product-category"
          {...register("category")}
          className="w-full rounded-2xl border px-4 py-3 text-sm transition-all border-border-subtle bg-surface text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">Select category (optional)</option>
          {categories.map((cat) => (
            <option key={categoryValue(cat)} value={categoryValue(cat)}>
              {categoryLabel(cat)}
            </option>
          ))}
        </select>
        {errors.category?.message && (
          <p className="mt-1.5 text-xs text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div className="w-full">
        <label
          htmlFor="seller-product-description"
          className="mb-2 block text-sm font-medium text-text-muted"
        >
          Description *
        </label>
        <textarea
          id="seller-product-description"
          rows={3}
          placeholder="Condition, fitment, warranty… (min 10 chars)"
          aria-invalid={Boolean(errors.description)}
          className="w-full rounded-2xl border px-4 py-3 text-sm transition-all border-border-subtle bg-surface text-text-primary placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          {...register("description")}
        />
        {errors.description?.message && (
          <p className="mt-1.5 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <Input
          label="Delivery time"
          placeholder="e.g. 2-3 days"
          error={errors.deliveryTime?.message}
          {...register("deliveryTime")}
        />
        <label
          htmlFor="seller-product-availability"
          className="flex items-center gap-2 pb-3 text-sm text-text-muted cursor-pointer"
        >
          <input
            id="seller-product-availability"
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-primary)]"
            {...register("availability")}
          />
          {availability ? "In stock" : "Out of stock"}
        </label>
      </div>

      <div className="space-y-2">
        <FileUpload
          label="Part photo *"
          accept="image/*"
          value={pickedFile}
          onChange={handleFile}
          error={errors.image?.message}
        />
        {!imageUrl && !uploading && (
          <p className="text-xs text-text-muted">
            A photo of the actual part is required — buyers see this in the store.
          </p>
        )}
        {imageUrl && (
          <div className="w-28">
            <ProductImage
              src={imageUrl}
              alt="Part preview"
              productName={watch("name")}
            />
          </div>
        )}
        {uploading && (
          <p className="text-xs text-text-muted">Uploading image…</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting || uploading}
        disabled={uploading}
      >
        {isEdit ? "Save changes" : "List part for sale"}
      </Button>
    </form>
  );
}
