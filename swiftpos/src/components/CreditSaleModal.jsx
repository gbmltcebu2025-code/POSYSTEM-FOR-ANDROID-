import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HandCoins, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CreditSaleModal({ open, total, onConfirm, onCancel, confirming }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setError('');
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter the customer's name to charge this to their account.");
      return;
    }
    onConfirm(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            Charge to Customer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-lg">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              autoFocus
              placeholder="e.g. Juan Dela Cruz"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This amount will be added to the customer's balance. Track and settle it later from the Credits page.
          </p>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={confirming}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" disabled={confirming}>
              {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Charge Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
