import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const QUICK_BILLS = [20, 50, 100, 200, 500, 1000];

export default function CashPaymentModal({ open, total, onConfirm, onCancel, confirming }) {
  const [tendered, setTendered] = useState('');

  useEffect(() => {
    if (open) setTendered('');
  }, [open]);

  const tenderedNum = Number(tendered) || 0;
  const change = tenderedNum - total;
  const canConfirm = tenderedNum >= total && tenderedNum > 0;

  const quickAmounts = useMemo(() => {
    const bills = QUICK_BILLS.filter((b) => b >= total);
    // Always offer the exact amount, plus up to 3 of the nearest bills above it.
    const amounts = [total, ...bills.slice(0, 3)];
    return [...new Set(amounts)];
  }, [total]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Cash Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Due</span>
            <span className="font-bold text-lg">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tendered">Cash Received</Label>
            <Input
              id="tendered"
              type="number"
              inputMode="decimal"
              autoFocus
              placeholder="0.00"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              className="h-12 text-lg font-semibold"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTendered(String(amt))}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-accent transition-colors"
              >
                {amt === total ? 'Exact' : formatCurrency(amt)}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Change</span>
            <span className={`font-bold text-xl ${change < 0 ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(Math.max(0, change))}
            </span>
          </div>
          {tenderedNum > 0 && tenderedNum < total && (
            <p className="text-xs text-destructive text-right -mt-2">Not enough cash received yet.</p>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onConfirm(tenderedNum, Math.max(0, change))}
            disabled={!canConfirm || confirming}
          >
            {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Complete Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
