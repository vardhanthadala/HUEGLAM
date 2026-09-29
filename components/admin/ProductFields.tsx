"use client";

import { useState } from "react";
import { Card, Field, TextArea, Toggle } from "./ProductFormShell";
import { ImageListField } from "./ImageListField";
import { RichTextEditor } from "./RichTextEditor";
import type { AdminProduct } from "@/lib/admin-products";

const rupees = (paise: number | null) =>
  paise === null ? "" : String(paise / 100);

export function ProductFields({ product }: { product?: AdminProduct }) {
  const [showSkincareDetails, setShowSkincareDetails] = useState(
    Boolean(
      product?.activeIngredients ||
        product?.benefits?.length ||
        product?.ingredients ||
        product?.directions ||
        product?.careGuide
    )
  );

  return (
    <div className="flex flex-col gap-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      {/* 1. Basic Details */}
      <Card
        title="General Information"
        subtitle="Basic name, storefront web handle, and short summary."
      >
        <Field
          name="title"
          label="Product Name"
          defaultValue={product?.title ?? ""}
          placeholder="e.g. Radiance Vitamin C Daily Moisturizer"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="handle"
            label="URL Handle (Slug)"
            defaultValue={product?.handle ?? ""}
            placeholder="e.g. radiance-vitamin-c-moisturizer"
            hint="Leave blank to auto-generate from the product name."
          />
          <Field
            name="vendor"
            label="Brand / Vendor"
            defaultValue={product?.vendor ?? "HUEGLAM"}
            placeholder="HUEGLAM"
          />
        </div>

        <TextArea
          name="description"
          label="Short Summary"
          rows={2}
          defaultValue={product?.description ?? ""}
          placeholder="e.g. This conditioning sunscreen is infused with ceramide and vitamin C to prevent fine lines..."
          hint="Appears right under the price in product hero and search previews."
        />

        <RichTextEditor
          name="bodyHtml"
          label="Full Product Description (Detailed Tab Content)"
          rows={7}
          defaultValue={product?.bodyHtml ?? ""}
          hint="Select any word/phrase and click '✨ Highlight Word' or bold it. Changes will format in the Description tab."
        />
      </Card>

      {/* 2. Media / Photos */}
      <Card
        title="Product Imagery"
        subtitle="Upload product photos. The first image will be used as the primary catalog cover."
      >
        <ImageListField
          defaultValue={
            product?.images.map((i) => ({ src: i.src, alt: i.alt })) ?? []
          }
        />
      </Card>

      {/* 3. Pricing & Stock */}
      <Card
        title="Pricing & Inventory"
        subtitle="Set standard pricing, discount offers, and warehouse stock units."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="price"
            label="Selling Price (₹)"
            type="number"
            step="0.01"
            prefix="₹"
            defaultValue={product ? rupees(product.price) : ""}
            placeholder="999"
            required
            hint="Customer checkout price."
          />
          <Field
            name="compareAtPrice"
            label="Original Price / MRP (₹)"
            type="number"
            step="0.01"
            prefix="₹"
            defaultValue={product ? rupees(product.compareAtPrice) : ""}
            placeholder="1299"
            hint="Optional: shown as struck-through price to highlight savings."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          <Field
            name="inventory"
            label="Available Stock (Units)"
            type="number"
            defaultValue={product?.inventory ?? 0}
            placeholder="50"
            hint="Quantity currently on hand in inventory."
          />
          <Field
            name="sku"
            label="SKU (Product Code)"
            defaultValue={product?.sku ?? ""}
            placeholder="e.g. HG-VITC-50ML"
            hint="Optional: Stock Keeping Unit identifier for your warehouse."
          />
        </div>
      </Card>

      {/* 4. Care Guide & Additional Details */}
      <Card
        title="Care Guide & Usage Instructions"
        subtitle="Care instructions shown in the expandable Care Guide accordion on the product page."
      >
        <TextArea
          name="careGuide"
          label="Care Guide"
          rows={3}
          defaultValue={product?.careGuide ?? ""}
          placeholder="Store in a cool, dry place away from direct sunlight. Close cap tightly after each use."
          hint="Appears directly under the Shipping Information accordion on the product page."
        />

        {/* Optional extra formula details commented out:
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowSkincareDetails((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            {showSkincareDetails ? "− Hide Extra Formula Details" : "+ Add Ingredients / Benefits (Optional)"}
          </button>
        </div>

        {showSkincareDetails && (
          <div className="flex flex-col gap-4 border-t border-line/60 pt-4 mt-2">
            <Field
              name="activeIngredients"
              label="Key Active Ingredients (Optional)"
              defaultValue={product?.activeIngredients ?? ""}
              placeholder="e.g. 10% Vitamin C, 2% Hyaluronic Acid"
            />
            <TextArea
              name="benefits"
              label="Benefits (Optional)"
              rows={2}
              defaultValue={(product?.benefits ?? []).join("\n")}
              placeholder="Evens skin tone&#10;Hydrates all day"
            />
            <TextArea
              name="directions"
              label="How to Use (Optional)"
              rows={2}
              defaultValue={product?.directions ?? ""}
              placeholder="Apply 2-3 drops to clean face and neck every morning."
            />
            <TextArea
              name="ingredients"
              label="Full Ingredients (Optional)"
              rows={3}
              defaultValue={product?.ingredients ?? ""}
              placeholder="Aqua, Glycerin, Ethyl Ascorbic Acid..."
            />
          </div>
        )}
        */}
      </Card>

      {/* 5. Visibility & Publishing */}
      <Card
        title="Storefront Visibility"
        subtitle="Control whether this product is live on your website and how stock is handled."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            name="published"
            label="Publish on Storefront"
            description="When enabled, this product is visible in the shop and search results."
            defaultChecked={product?.published ?? true}
          />
          <Toggle
            name="trackInventory"
            label="Track Inventory Stock"
            description="Automatically marks product as Sold Out when stock hits 0."
            defaultChecked={product?.trackInventory ?? true}
          />
        </div>

        <div className="pt-2 sm:w-1/2">
          <Field
            name="position"
            label="Display Sort Priority"
            type="number"
            defaultValue={product?.position ?? 0}
            hint="Products with lower numbers (e.g. 0, 1) appear first in catalog listings."
          />
        </div>
      </Card>
    </div>
  );
}
