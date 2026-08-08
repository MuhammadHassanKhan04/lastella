import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
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
  images: string[];
  sizes: string[];
  colors: string[];
}

const CATEGORIES = ["necklace", "bracelet", "ring", "earrings", "pendant", "watch"];
const BADGES = ["", "new", "sale", "bestseller"];

function AdminProducts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/products?all=true");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Failed to load products");
    }
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      refresh();
    } catch (e) {
      toast.error("Failed to delete product");
    }
  }

  async function toggleActive(row: Row) {
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, active: !row.active }),
      });
      if (!res.ok) throw new Error("Update failed");
      refresh();
    } catch (e) {
      toast.error("Failed to update");
    }
  }

  const filteredRows = rows.filter((r) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    return (
      (r.name_en && r.name_en.toLowerCase().includes(query)) ||
      (r.name_ar && r.name_ar.toLowerCase().includes(query)) ||
      (r.slug && r.slug.toLowerCase().includes(query)) ||
      (r.category && r.category.toLowerCase().includes(query)) ||
      (r.badge && r.badge.toLowerCase().includes(query))
    );
  });

  async function seedDemoProducts() {
    if (!confirm("Add 25 curated luxury demo products to your database?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/seed");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seeding failed");
      toast.success(data.message || "25 Demo products loaded!");
      refresh();
    } catch (e) {
      toast.error("Failed to seed products");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Products</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage your store catalog ({rows.length} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seedDemoProducts}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-secondary transition-all"
          >
            + Add 25 Demo Products
          </button>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep transition-all">
            <Plus className="h-4 w-4" /> New Product
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, slug, or category..."
            className="w-full rounded-full border border-border bg-background/50 backdrop-blur pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {search && (
          <span className="text-xs text-muted-foreground">
            {filteredRows.length} {filteredRows.length === 1 ? "result" : "results"} found
          </span>
        )}
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
                {filteredRows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border/40">
                          {r.image && <img src={r.image} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.name_en}</p>
                          {r.name_ar && <p className="text-xs text-muted-foreground truncate" dir="rtl">{r.name_ar}</p>}
                          <p className="text-[11px] text-muted-foreground/70 font-mono">{r.slug}</p>
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
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">
                      {search ? `No products matching "${search}"` : "No products yet."}
                    </td>
                  </tr>
                )}
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initial?.images ?? []);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [nameEn, setNameEn] = useState(initial?.name_en ?? "");
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [translating, setTranslating] = useState(false);

  async function translateToArabic(text: string) {
    if (!text.trim() || nameAr) return;
    // Auto-generate slug from English name
    if (!slug) {
      setSlug(text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
    setTranslating(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`);
      const json = await res.json();
      if (json.responseStatus === 200 && json.responseData?.translatedText) {
        setNameAr(json.responseData.translatedText);
      }
    } catch (e) {
    } finally {
      setTranslating(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image should be less than 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (galleryPreviews.length + files.length > 5) { toast.error("Maximum 5 gallery images allowed"); return; }
    const newFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} is too large (max 5MB)`); return false; }
      return true;
    });
    setGalleryFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setGalleryPreviews(prev => [...prev, ev.target!.result as string]); };
      reader.readAsDataURL(file);
    });
  };

  // Convert File to base64 for MongoDB storage
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!imagePreview) { toast.error("Please upload a product image"); return; }
    setBusy(true);
    try {
      // Use base64 for main image
      let mainImageUrl = initial?.image ?? imagePreview;
      if (imageFile) {
        mainImageUrl = await fileToBase64(imageFile);
      }

      // Convert new gallery images to base64
      const existingUrls = galleryPreviews.filter(p => p.startsWith('data:') || p.startsWith('http'));
      const newGalleryBase64: string[] = [];
      for (const file of galleryFiles) {
        const b64 = await fileToBase64(file);
        newGalleryBase64.push(b64);
      }
      const allGalleryUrls = [...existingUrls.filter(p => !galleryFiles.some(f => f.name === p)), ...newGalleryBase64];

      const payload: any = {
        slug: String(fd.get("slug")).trim(),
        name_en: String(fd.get("name_en")).trim(),
        name_ar: String(fd.get("name_ar") || "").trim() || null,
        category: String(fd.get("category")),
        price: Number(fd.get("price")),
        old_price: fd.get("old_price") ? Number(fd.get("old_price")) : null,
        image: mainImageUrl,
        stock: Number(fd.get("stock") || 0),
        badge: (fd.get("badge") ? String(fd.get("badge")) : null) as string | null,
        description_en: String(fd.get("description_en") || "").trim() || null,
        active: fd.get("active") === "on",
        sizes: String(fd.get("sizes") || "").split(",").map(s => s.trim()).filter(Boolean),
        colors: String(fd.get("colors") || "").split(",").map(s => s.trim()).filter(Boolean),
        images: allGalleryUrls,
      };

      if (initial) {
        const res = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, ...payload }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Update failed"); }
        toast.success("Updated successfully");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Save failed"); }
        toast.success("Created successfully");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      console.error(err);
      toast.error(msg);
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
          <Field label="Name (EN)">
            <div className="relative">
              <input
                name="name_en"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                onBlur={(e) => translateToArabic(e.target.value)}
                required
                placeholder="e.g. Rose Gold Necklace"
                className={inputCls}
              />
            </div>
          </Field>
          <Field label={translating ? "Name (AR) — Translating..." : "Name (AR) — Auto from EN"}>
            <div className="relative">
              <input
                name="name_ar"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={translating ? "Translating..." : "Auto-translated or type manually"}
                dir="rtl"
                className={`${inputCls} ${translating ? 'opacity-50' : ''}`}
              />
              {translating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
              )}
            </div>
          </Field>
          <Field label="Slug (Auto-generated)">
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              placeholder="auto-filled from name"
              className={inputCls}
            />
          </Field>
          <Field label="Category">
            <select name="category" defaultValue={initial?.category ?? "necklace"} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Price (SAR)"><input name="price" type="number" step="0.01" min="0" defaultValue={initial?.price} required className={inputCls} /></Field>
          <Field label="Old Price (SAR)"><input name="old_price" type="number" step="0.01" min="0" defaultValue={initial?.old_price ?? ""} placeholder="Optional discount" className={inputCls} /></Field>
          <Field label="Stock (Quantity)"><input name="stock" type="number" min="0" defaultValue={initial?.stock ?? 0} className={inputCls} /></Field>
          <Field label="Badge (Highlight)">
            <select name="badge" defaultValue={initial?.badge ?? ""} className={inputCls}>
              {BADGES.map((b) => <option key={b} value={b}>{b || "— none —"}</option>)}
            </select>
          </Field>
          <Field label="Colors (Comma separated)"><input name="colors" defaultValue={initial?.colors?.join(", ")} placeholder="e.g. Gold, Silver" className={inputCls} /></Field>
          <Field label="Sizes (Comma separated)"><input name="sizes" defaultValue={initial?.sizes?.join(", ")} placeholder="e.g. S, M, L" className={inputCls} /></Field>
          
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

          <div className="sm:col-span-2 mt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Gallery Images (Up to 5)</label>
            <div className="flex flex-wrap gap-3">
              {galleryPreviews.map((img, i) => (
                <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border group">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setGalleryPreviews(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {galleryPreviews.length < 5 && (
                <label className="h-24 w-24 rounded-lg border-2 border-dashed border-primary/20 bg-secondary/10 hover:bg-secondary/30 flex items-center justify-center cursor-pointer transition-colors">
                  <input type="file" multiple accept="image/png, image/jpeg, image/webp" onChange={handleGalleryChange} className="hidden" />
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </label>
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
