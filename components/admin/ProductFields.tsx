"use client";

import { Card, Field, TextArea, Toggle } from "./ProductFormShell";
import { ImageListField } from "./ImageListField";
import type { AdminProduct } from "@/lib/admin-products";

const rupees = (paise: number | null) =>
  paise === null ? "" : String(paise / 100);

/** The full product form body, shared by the create and edit pages. */
export function ProductFields({ product }: { product?: AdminProduct }) {
  return (
    <>
      {product && <input type="hidden" name="id" value={product.id} />}

      <Card title="Product">
        <Field
          name="title"
          label="Name"
          defaultValue={product?.title ?? ""}
          placeholder="Vitamin C Day Moisturizer"
          required
        />
        <Field
          name="handle"
          label="URL handle"
          defaultValue={product?.handle ?? ""}
          placeholder="Leave blank to generate from the name"
          hint="Appears in the address: /products/your-handle"
        />
        <TextArea
          name="description"
          label="Short description"
          rows={3}
          defaultValue={product?.description ?? ""}
          hint="Shown under the price and in search results."
        />
      </Card>

      <Card title="Media">
        <ImageListField defaultValue={product?.images.map((i) => ({ src: i.src, alt: i.alt })) ?? []} />
      </Card>

      <Card title="Pricing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="price"
            label="Price (Rs.)"
            type="number"
            step="0.01"
            defaultValue={product ? rupees(product.price) : ""}
            required
          />
          <Field
            name="compareAtPrice"
            label="Compare-at price (Rs.)"
            type="number"
            step="0.01"
            defaultValue={product ? rupees(product.compareAtPrice) : ""}
            hint="The struck-through price. Leave blank for no sale."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="sku" label="SKU" defaultValue={product?.sku ?? ""} />
          <Field
            name="inventory"
            label="Stock"
            type="number"
            defaultValue={product?.inventory ?? 0}
          />
        </div>
      </Card>

      <Card title="Description tab">
        <TextArea
          name="activeIngredients"
          label="Active ingredients"
          rows={2}
          defaultValue={product?.activeIngredients ?? ""}
          placeholder="Ashwagandha and Glycyrrhiza Glabra Root Extract"
        />
        <TextArea
          name="benefits"
          label="Benefits"
          rows={4}
          defaultValue={(product?.benefits ?? []).join("\n")}
          hint="One per line. Shown as a numbered list."
        />
        <TextArea
          name="ingredients"
          label="Full ingredients"
          rows={6}
          defaultValue={product?.ingredients ?? ""}
        />
      </Card>

      <Card title="Directions and care">
        <TextArea
          name="directions"
          label="Directions"
          rows={4}
          defaultValue={product?.directions ?? ""}
        />
        <TextArea
          name="careGuide"
          label="Care guide"
          rows={4}
          defaultValue={product?.careGuide ?? ""}
          hint="Shown in the Care Guide accordion on the product page."
        />
      </Card>

      <Card title="Visibility">
        <Field
          name="position"
          label="Sort order"
          type="number"
          defaultValue={product?.position ?? 0}
          hint="Lower numbers appear first."
        />
        <Toggle
          name="published"
          label="Visible on the storefront"
          defaultChecked={product?.published ?? true}
        />
        <Toggle
          name="trackInventory"
          label="Track stock and show sold out at zero"
          defaultChecked={product?.trackInventory ?? true}
        />
      </Card>
    </>
  );
}
