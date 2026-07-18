import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

interface Row {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  category: string;
  price: number;
  old_price: number | null;
  image: string;
  stock: number;
  active: boolean;
  badge: string | null;
  rating: number;
  reviews: number;
  description_en: string | null;
}

const CATEGORIES = ["necklace", "bracelet", "ring", "earrings", "pendant", "watch"];
const BADGES = ["", "new", "sale", "bestseller"];

function AdminProducts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  async function toggleActive(row: Row) {
    const { error } = await supabase.from("products").update({ active: !row.active }).eq("id", row.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-3xl">Products</h2>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep">
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-start p-4">Product</th>
                  <th className="text-start">Category</th>
                  <th className="text-start">Price</th>
                  <th className="text-start">Stock</th>
                  <th className="text-start">Status</th>
                  <th className="text-end p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                          {r.image && <img src={r.image} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.name_en}</p>
                          <p className="text-xs text-muted-foreground">{r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">{r.category}</td>
                    <td>
                      <div className="font-medium">{formatPrice(Number(r.price))}</div>
                      {r.old_price && <div className="text-xs text-muted-foreground line-through">{formatPrice(Number(r.old_price))}</div>}
                    </td>
                    <td>{r.stock}</td>
                    <td>
                      <button onClick={() => toggleActive(r)} className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${r.active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {r.active ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-secondary" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(r.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No products yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(editing || creating) && (
        <ProductForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); refresh(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onClose, onSaved }: { initial: Row | null; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image ?? null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Optional: simple size check (e.g. max 2MB to keep DB small since we're using base64)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (!imagePreview) {
      toast.error("Please upload a product image");
      return;
    }

    const payload = {
      slug: String(fd.get("slug")).trim(),
      name_en: String(fd.get("name_en")).trim(),
      name_ar: String(fd.get("name_ar") || "").trim() || null,
      category: String(fd.get("category")),
      price: Number(fd.get("price")),
      old_price: fd.get("old_price") ? Number(fd.get("old_price")) : null,
      image: imagePreview,
      stock: Number(fd.get("stock") || 0),
      badge: (fd.get("badge") ? String(fd.get("badge")) : null) as string | null,
      description_en: String(fd.get("description_en") || "").trim() || null,
      active: fd.get("active") === "on",
    };
    
    setBusy(true);
    try {
      if (initial) {
        const { error } = await supabase.from("products").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Updated successfully");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Created successfully");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm transition-all">
      <form onSubmit={onSubmit} className="bg-background rounded-3xl border border-border/60 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <h3 className="font-display text-2xl bg-gradient-to-r from-primary to-rose-deep bg-clip-text text-transparent">
            {initial ? "Edit Product" : "New Product"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-secondary/80 transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="p-6 grid sm:grid-cols-2 gap-5 overflow-y-auto">
          <Field label="Name (EN)"><input name="name_en" defaultValue={initial?.name_en} required className={inputCls} /></Field>
          <Field label="Name (AR)"><input name="name_ar" defaultValue={initial?.name_ar ?? ""} className={inputCls} /></Field>
          <Field label="Slug"><input name="slug" defaultValue={initial?.slug} required pattern="[a-z0-9-]+" placeholder="e.g., gold-necklace" className={inputCls} /></Field>
          <Field label="Category">
            <select name="category" defaultValue={initial?.category ?? "necklace"} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Price (Rs.)"><input name="price" type="number" step="1" min="0" defaultValue={initial?.price} required className={inputCls} /></Field>
          <Field label="Old Price (Rs.)"><input name="old_price" type="number" step="1" min="0" defaultValue={initial?.old_price ?? ""} placeholder="Optional discount" className={inputCls} /></Field>
          <Field label="Stock (Quantity)"><input name="stock" type="number" min="0" defaultValue={initial?.stock ?? 0} className={inputCls} /></Field>
          <Field label="Badge (Highlight)">
            <select name="badge" defaultValue={initial?.badge ?? ""} className={inputCls}>
              {BADGES.map((b) => <option key={b} value={b}>{b || "— none —"}</option>)}
            </select>
          </Field>
          
          <div className="sm:col-span-2 mt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Product Image</label>
            <div className="relative border-2 border-dashed border-primary/20 rounded-2xl bg-secondary/10 hover:bg-secondary/30 transition-all group overflow-hidden">
              <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {imagePreview ? (
                <div className="relative h-48 w-full flex items-center justify-center p-4">
                  <img src={imagePreview} alt="Preview" className="h-full w-auto object-contain rounded-lg shadow-sm" />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-sm">
                    <p className="text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-md">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                      Change Image
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 shadow-sm group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-foreground/80">Click or drag image here</p>
                  <p className="text-xs opacity-70">PNG, JPG or WEBP (Max 2MB)</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="sm:col-span-2"><Field label="Description (EN)"><textarea name="description_en" defaultValue={initial?.description_en ?? ""} rows={3} placeholder="Describe the product details and material..." className={inputCls} /></Field></div>
          <label className="sm:col-span-2 flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-secondary/10 cursor-pointer hover:bg-secondary/20 transition-colors">
            <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary" />
            <span className="text-sm font-medium">Active (visible in the shop)</span>
          </label>
        </div>
        
        <div className="p-5 border-t border-border/50 flex justify-end gap-3 bg-secondary/10 shrink-0">
          <button type="button" onClick={onClose} className="rounded-full bg-background border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors">Cancel</button>
          <button disabled={busy} className="rounded-full bg-primary text-primary-foreground px-8 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep shadow-md transition-all disabled:opacity-60 disabled:shadow-none flex items-center gap-2">
            {busy ? (
              <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
            ) : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
