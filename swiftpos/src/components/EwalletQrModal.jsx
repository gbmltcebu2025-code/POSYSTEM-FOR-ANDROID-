import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function EwalletQrModal({ wallet, total, onConfirm, onCancel, confirming }) {
  return (
    <Dialog open={!!wallet} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Scan to Pay with {wallet?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <img
            src={wallet?.qr_url}
            alt={`${wallet?.name} QR code`}
            className="w-56 h-56 object-contain rounded-xl border border-border bg-white p-2"
          />
          <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
          <p className="text-xs text-muted-foreground text-center">
            Let the customer scan this code, then confirm once payment has arrived.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Payment Received
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
