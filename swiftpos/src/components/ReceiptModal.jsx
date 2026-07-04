import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { printReceiptHtml } from '@/lib/nativePrint';
import { getSavedPrinter, printReceiptThermal } from '@/lib/thermalPrinter';
import { db } from '@/lib/localDb';

function paymentLabel(method) {
  if (!method || method === 'cash') return 'Cash';
  if (method === 'credit') return 'Credit';
  return method;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function buildReceiptHtml(transaction, date, storeName) {
  const rows = transaction.items
    .map(
      (item) => `
        <div style="display:flex;justify-content:space-between;padding:2px 0;">
          <span>${item.quantity}&times; ${escapeHtml(item.name)}</span>
          <span>${formatCurrency(item.line_total)}</span>
        </div>`
    )
    .join('');

  const extraLines = [];
  if (transaction.payment_method === 'cash' && transaction.cash_received != null) {
    extraLines.push(`Cash: ${formatCurrency(transaction.cash_received)}`);
    extraLines.push(`Change: ${formatCurrency(transaction.change || 0)}`);
  }
  if (transaction.payment_method === 'credit' && transaction.customer_name) {
    extraLines.push(`Customer: ${escapeHtml(transaction.customer_name)}`);
  }

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: 'Courier New', monospace; font-size: 13px; color:#000; padding:16px; max-width:380px; margin:0 auto;">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="font-weight:bold;font-size:18px;">${escapeHtml(storeName)}</div>
          <div style="font-size:11px;color:#555;">${escapeHtml(date.toLocaleString())}</div>
        </div>
        <div style="border-top:1px dashed #999;border-bottom:1px dashed #999;padding:8px 0;margin-bottom:8px;">
          ${rows}
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:15px;padding-top:4px;border-top:1px solid #999;">
          <span>TOTAL</span>
          <span>${formatCurrency(transaction.total)}</span>
        </div>
        <div style="text-align:center;font-size:11px;color:#555;margin-top:6px;">
          Paid via ${escapeHtml(paymentLabel(transaction.payment_method))}
          ${extraLines.length ? `<br/>${extraLines.map(escapeHtml).join('<br/>')}` : ''}
        </div>
        <div style="text-align:center;font-size:11px;color:#888;margin-top:16px;">Thank you for your purchase!</div>
      </body>
    </html>`;
}

export default function ReceiptModal({ transaction, onClose }) {
  const open = !!transaction;
  const date = transaction ? new Date(transaction.created_date || Date.now()) : new Date();
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState('');
  const [connectedPrinter, setConnectedPrinter] = useState(null);
  const [storeName, setStoreName] = useState('SwiftPOS');

  useEffect(() => {
    if (open) {
      getSavedPrinter().then(setConnectedPrinter);
      db.settings.get().then((s) => setStoreName(s.storeName?.trim() || 'SwiftPOS'));
    }
  }, [open]);

  const handlePrint = async () => {
    setPrintError('');
    setPrinting(true);
    try {
      if (connectedPrinter) {
        await printReceiptThermal(transaction, date);
      } else {
        await printReceiptHtml(buildReceiptHtml(transaction, date, storeName), `Receipt ${date.toLocaleDateString()}`);
      }
    } catch (e) {
      if (!e?.message?.toLowerCase().includes('cancel')) {
        setPrintError(e?.message || 'Could not print the receipt.');
      }
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm no-print">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Sale Complete
          </DialogTitle>
        </DialogHeader>

        {transaction && (
          <>
            <div className="print-receipt bg-white text-black rounded-lg p-6 font-mono text-sm leading-relaxed">
              <div className="text-center mb-3">
                <h2 className="font-bold text-lg">{storeName}</h2>
                <p className="text-xs text-gray-500">{date.toLocaleString()}</p>
              </div>
              <div className="border-t border-b border-dashed border-gray-300 py-2 mb-2">
                {transaction.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span className="truncate pr-2">
                      {item.quantity}× {item.name}
                    </span>
                    <span>{formatCurrency(item.line_total)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-300 mt-1">
                <span>TOTAL</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
              <p className="text-center text-xs text-gray-500 mt-1.5">Paid via {paymentLabel(transaction.payment_method)}</p>
              {transaction.payment_method === 'cash' && transaction.cash_received != null && (
                <div className="text-center text-xs text-gray-500">
                  <p>Cash: {formatCurrency(transaction.cash_received)}</p>
                  <p>Change: {formatCurrency(transaction.change || 0)}</p>
                </div>
              )}
              {transaction.payment_method === 'credit' && transaction.customer_name && (
                <p className="text-center text-xs text-gray-500">Customer: {transaction.customer_name}</p>
              )}
              <p className="text-center text-xs text-gray-400 mt-4">Thank you for your purchase!</p>
            </div>

            {printError && <p className="text-xs text-destructive mt-2 no-print">{printError}</p>}

            <div className="flex gap-2 mt-4 no-print">
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handlePrint}
                disabled={printing}
              >
                {printing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                {printing ? 'Printing...' : connectedPrinter ? `Print via ${connectedPrinter.name || 'Thermal Printer'}` : 'Print Receipt'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                New Sale
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
