"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Power, Package } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useProductStore } from "@/store/productStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/marketplace/ProductImage";
import { SellerProductForm } from "@/components/marketplace/SellerProductForm";
import { Badge } from "@/components/ui/Badge";

/**
 * Current seller's listings with edit / delete / stock toggle.
 * Listings come from the backend (GET /products/my-listings, server-scoped);
 * the edit flow reuses SellerProductForm in edit mode.
 */
export function MyListings({ onAddNew }) {
  const fetchMyListings = useProductStore((s) => s.fetchMyListings);
  const sellerProducts = useProductStore((s) => s.sellerProducts);
  const updateSellerProduct = useProductStore((s) => s.updateSellerProduct);
  const removeSellerProduct = useProductStore((s) => s.removeSellerProduct);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const listings = sellerProducts;

  const handleToggleStock = async (product) => {
    await updateSellerProduct(product.id, { availability: !product.availability });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const ok = await removeSellerProduct(deleting.id);
    if (ok) setDeleting(null);
  };

  if (listings.length === 0) {
    return (
      <div className="space-y-3">
        <EmptyState
          icon={Package}
          title="No listings yet"
          description="List your first part and it will appear in the marketplace instantly."
          action={
            onAddNew ? (
              <Button onClick={onAddNew}>Sell a part</Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((product) => (
        <div
          key={product.id}
          className="surface-card rounded-2xl p-3 flex items-center gap-3"
        >
          <div className="w-16 shrink-0">
            <ProductImage
              src={product.image}
              alt={product.name}
              productName={product.name}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {product.name}
            </p>
            <p className="text-sm font-bold text-primary">
              {formatCurrency(product.price ?? 0)}
            </p>
            <Badge variant={product.availability ? "success" : "pending"}>
              {product.availability ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setEditing(product)}
              aria-label={`Edit ${product.name}`}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleStock(product)}
              aria-label={`Toggle stock for ${product.name}`}
              className={cn(
                "min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg transition-colors",
                product.availability
                  ? "text-primary hover:bg-surface-soft"
                  : "text-text-muted hover:text-foreground hover:bg-surface-soft"
              )}
            >
              <Power size={16} />
            </button>
            <button
              type="button"
              onClick={() => setDeleting(product)}
              aria-label={`Delete ${product.name}`}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit listing"
      >
        {editing && (
          <SellerProductForm
            initialProduct={editing}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remove listing?"
        message={`"${deleting?.name ?? ""}" will be removed from the marketplace.`}
      />
    </div>
  );
}
