import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { chargeCredit, recordPayment } from '@/lib/creditAccounts';

const emptyItem = () => ({ id: Math.random().toString(36).slice(2), name: '', price: '' });

export default function CreditCustomerForm({ open, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState([emptyItem(), emptyItem()]);
  const [totalPaid, setTotalPaid] = useState('0');
  const [status, setStatus] = useState('unpaid'); // 'paid' | 'unpaid'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const itemsTotal = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const paidNum = status === 'paid' ? itemsTotal : Number(totalPaid) || 0;
  const balance = Math.max(0, itemsTotal - paidNum);

  const reset = () => {
    setName('');
    setPhone('');
    setItems([emptyItem(), emptyItem()]);
    setTotalPaid('0');
    setStatus('unpaid');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const validItems = items
      .filter((i) => i.name.trim() && Number(i.price) > 0)
      .map((i) => ({ name: i.name.trim(), price: Number(i.price) }));

    if (!name.trim()) {
      setError("Enter the customer's name.");
      return;
    }
    if (validItems.length === 0) {
      setError('Add at least one item with a name and price.');
      return;
    }

    setSaving(true);
    try {
      const account = await chargeCredit(name.trim(), validItems, { phone: phone.trim() });
      if (paidNum > 0) {
        await recordPayment(account.id, paidNum);
      }
      onSaved?.();
      handleClose();
    } catch (err) {
      setError(err?.message || 'Could not save this entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Customer info</p>
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Customer name</Label>
              <Input id="cust-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">Number</Label>
              <Input id="cust-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Items</p>
              <button type="button" onClick={addItem} className="text-xs font-medium text-primary flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                    className="w-24"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total paid</span>
              {status === 'paid' ? (
                <span className="font-medium">{formatCurrency(itemsTotal)}</span>
              ) : (
                <Input
                  type="number"
                  inputMode="decimal"
                  value={totalPaid}
                  onChange={(e) => setTotalPaid(e.target.value)}
                  className="w-28 h-7 text-right"
                />
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total balance</span>
              <span className="font-semibold text-primary">{formatCurrency(balance)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Status</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'paid' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setStatus('unpaid')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'unpaid' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                Unpaid
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
