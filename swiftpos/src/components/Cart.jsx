import { ShoppingCart, Trash2, CreditCard, Banknote, Wallet, HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CartItem from '@/components/CartItem';
import { formatCurrency } from '@/lib/utils';

export default function Cart({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onCheckout,
  isCheckingOut,
  ewallets = [],
  paymentMethod,
  onPaymentMethodChange,
}) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
        <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Cart is empty</p>
        <p className="text-xs mt-1">Scan or tap a product to add</p>
      </div>
    );
  }

  const buttonLabel =
    paymentMethod === 'credit'
      ? 'Charge to Customer'
      : ewallets.some((w) => w.id === paymentMethod)
      ? 'Show QR & Checkout'
      : 'Checkout';

  const pillClass = (active) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'border-border text-muted-foreground hover:bg-accent'
    }`;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-1 pb-2 shrink-0">
        <h2 className="font-semibold flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          Cart ({itemCount})
        </h2>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7" onClick={onClear}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 min-h-0">
        {items.map((item) => (
          <CartItem key={item.sku} item={item} onIncrease={onIncrease} onDecrease={onDecrease} onRemove={onRemove} />
        ))}
      </div>

      <div className="border-t border-border pt-3 space-y-2.5 px-1 shrink-0">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Payment method</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => onPaymentMethodChange('cash')} className={pillClass(paymentMethod === 'cash')}>
              <Banknote className="w-3.5 h-3.5" /> Cash
            </button>
            {ewallets.map((w) => (
              <button key={w.id} type="button" onClick={() => onPaymentMethodChange(w.id)} className={pillClass(paymentMethod === w.id)}>
                <Wallet className="w-3.5 h-3.5" /> {w.name}
              </button>
            ))}
            <button type="button" onClick={() => onPaymentMethodChange('credit')} className={pillClass(paymentMethod === 'credit')}>
              <HandCoins className="w-3.5 h-3.5" /> Credit
            </button>
          </div>
        </div>

        <div className="flex justify-between text-lg font-bold pt-1">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
        <Button
          className="w-full mt-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
          onClick={onCheckout}
          disabled={isCheckingOut}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          {isCheckingOut ? 'Processing...' : buttonLabel}
        </Button>
      </div>
    </div>
  );
}
