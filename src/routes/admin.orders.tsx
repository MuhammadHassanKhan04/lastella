import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { useOrders, useOrderActions } from "@/lib/orders";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

function AdminOrders() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const { data: orders = [], isLoading } = useOrders(filter);
  const { updateStatus } = useOrderActions();
  const [open, setOpen] = useState<string | null>(null);

  function handleStatusChange(id: string, status: Status) {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast.success("Status updated"),
      onError: (err) => toast.error(err.message)
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-display text-3xl">Orders</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-full border border-border bg-background px-4 py-2 text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No orders.</div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => {
              const isOpen = open === o.id;
              // Add a generic subtotal since it might be missing in local representation
              const fallbackSubtotal = (o.items ?? []).reduce((acc, it) => acc + (it.price * it.quantity), 0);
              
              return (
                <div key={o.id}>
                  <button
                    onClick={() => setOpen(isOpen ? null : o.id)}
                    className="w-full text-start px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition"
                  >
                    <div className="min-w-0 flex-1 grid sm:grid-cols-5 gap-3 items-center">
                      <div className="font-medium truncate">{o.order_number}</div>
                      <div className="text-sm truncate">{o.full_name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                      <div><span className="capitalize inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">{o.status}</span></div>
                      <div className="text-end font-semibold">{formatPrice(Number(o.total))}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 py-5 bg-secondary/20 border-t border-border grid lg:grid-cols-2 gap-6">
                      <div className="space-y-2 text-sm">
                        <h4 className="font-semibold uppercase tracking-wider text-xs text-muted-foreground mb-2">Customer</h4>
                        <p>{o.full_name}</p>
                        <p className="text-muted-foreground">{o.email}</p>
                        <p className="text-muted-foreground">{o.phone}</p>
                        <p className="text-muted-foreground">{o.address}, {o.city}{o.postal_code ? ` – ${o.postal_code}` : ""}</p>
                        <div className="mt-4">
                          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">Update status</label>
                          <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value as Status)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold uppercase tracking-wider text-xs text-muted-foreground mb-3">Items</h4>
                        <div className="space-y-2">
                          {(o.items ?? []).map((it, idx) => (
                            <div key={it.id || idx} className="flex items-center gap-3 text-sm">
                              <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                                {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate">{it.name}</p>
                                <p className="text-xs text-muted-foreground">×{it.quantity} · {formatPrice(Number(it.price))}</p>
                              </div>
                              <span className="font-semibold">{formatPrice(Number(it.price) * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-border mt-4 pt-3 space-y-1 text-sm">
                          <Row label="Subtotal" value={formatPrice(fallbackSubtotal)} />
                          <Row label="Total" value={formatPrice(Number(o.total))} bold />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-display text-base pt-2 border-t border-border" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
