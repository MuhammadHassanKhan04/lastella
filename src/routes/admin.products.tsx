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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      slug: String(fd.get("slug")).trim(),
      name_en: String(fd.get("name_en")).trim(),
      name_ar: String(fd.get("name_ar") || "").trim() || null,
      category: String(fd.get("category")),
      price: Number(fd.get("price")),
      old_price: fd.get("old_price") ? Number(fd.get("old_price")) : null,
      image: String(fd.get("image")).trim(),
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
        toast.success("Updated");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Created");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <form onSubmit={onSubmit} className="bg-background rounded-3xl border border-border w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
          <h3 className="font-display text-2xl">{initial ? "Edit Product" : "New Product"}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          <Field label="Name (EN)"><input name="name_en" defaultValue={initial?.name_en} required className={inputCls} /></Field>
          <Field label="Name (AR)"><input name="name_ar" defaultValue={initial?.name_ar ?? ""} className={inputCls} /></Field>
          <Field label="Slug"><input name="slug" defaultValue={initial?.slug} required pattern="[a-z0-9-]+" className={inputCls} /></Field>
          <Field label="Category">
            <select name="category" defaultValue={initial?.category ?? "necklace"} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Price (Rs.)"><input name="price" type="number" step="1" min="0" defaultValue={initial?.price} required className={inputCls} /></Field>
          <Field label="Old Price (Rs.)"><input name="old_price" type="number" step="1" min="0" defaultValue={initial?.old_price ?? ""} className={inputCls} /></Field>
          <Field label="Stock"><input name="stock" type="number" min="0" defaultValue={initial?.stock ?? 0} className={inputCls} /></Field>
          <Field label="Badge">
            <select name="badge" defaultValue={initial?.badge ?? ""} className={inputCls}>
              {BADGES.map((b) => <option key={b} value={b}>{b || "— none —"}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Image URL"><input name="image" defaultValue={initial?.image} required placeholder="/assets/prod-1.jpg or https://…" className={inputCls} /></Field></div>
          <div className="sm:col-span-2"><Field label="Description (EN)"><textarea name="description_en" defaultValue={initial?.description_en ?? ""} rows={3} className={inputCls} /></Field></div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="accent-primary" />
            Active (visible in shop)
          </label>
        </div>
        <div className="p-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-background">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary">Cancel</button>
          <button disabled={busy} className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep disabled:opacity-60">
            {busy ? "Saving…" : "Save"}
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
