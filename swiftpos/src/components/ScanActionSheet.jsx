import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, PackagePlus } from 'lucide-react';

export default function ScanActionSheet({ open, onClose, onScanToSell, onScanToAddProduct }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <div className="text-center mb-1">
          <DialogTitle className="font-semibold text-lg">Scan Barcode</DialogTitle>
          <p className="text-sm text-muted-foreground">What do you want to do?</p>
        </div>

        <div className="space-y-2 mt-2">
          <button
            onClick={onScanToSell}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="w-6 h-6 shrink-0" />
            <div className="text-left">
              <p className="font-semibold">Scan to Sell</p>
              <p className="text-xs opacity-80">Add a product to the cart</p>
            </div>
          </button>

          <button
            onClick={onScanToAddProduct}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/30 transition-colors"
          >
            <PackagePlus className="w-6 h-6 shrink-0 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Scan to Add Product</p>
              <p className="text-xs text-muted-foreground">Register a new item's SKU</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
