import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/localDb';
import { useAuth } from '@/lib/AuthContext';
import { getSavedPrinter } from '@/lib/thermalPrinter';
import StoreInfoSection from '@/components/settings/StoreInfoSection';
import ThermalPrinterSection from '@/components/settings/ThermalPrinterSection';
import EwalletSection from '@/components/settings/EwalletSection';
import ThemeSection from '@/components/settings/ThemeSection';
import ReportSection from '@/components/settings/ReportSection';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  Printer,
  Wallet,
  BarChart3,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export default function ProfileDrawer({ open, onClose }) {
  const [storeName, setStoreName] = useState('');
  const [connectedPrinter, setConnectedPrinter] = useState(null);
  const [ewalletCount, setEwalletCount] = useState(0);
  const [subView, setSubView] = useState(null); // null | 'print' | 'ewallet' | 'report'
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setSubView(null);
    db.settings.get().then((s) => {
      setStoreName(s.storeName?.trim() || 'your store');
      setEwalletCount((s.ewallets || []).length);
    });
    getSavedPrinter().then(setConnectedPrinter);
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 no-print">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="absolute top-0 right-0 bottom-0 w-[86%] max-w-xs bg-card flex flex-col shadow-xl">
        {subView === null && (
          <>
            <div className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Hello,</p>
                  <p className="text-sm font-medium leading-tight">{storeName}</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-5">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Store Info</p>
                <StoreInfoSection compact />
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Print</p>
                <button
                  onClick={() => setSubView('print')}
                  className="w-full flex items-center gap-2.5 bg-muted/40 rounded-lg px-3 py-2.5 text-left"
                >
                  <Printer className="w-4 h-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm truncate">
                    {connectedPrinter ? connectedPrinter.name || 'Printer connected' : 'No printer connected'}
                  </span>
                  {connectedPrinter && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Background Theme</p>
                <ThemeSection />
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">E-Wallet</p>
                <button
                  onClick={() => setSubView('ewallet')}
                  className="w-full flex items-center gap-2.5 bg-muted/40 rounded-lg px-3 py-2.5 text-left"
                >
                  <Wallet className="w-4 h-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm">
                    {ewalletCount > 0 ? `${ewalletCount} wallet${ewalletCount === 1 ? '' : 's'} added` : 'No wallets added'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </div>

              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Report</p>
                <button
                  onClick={() => setSubView('report')}
                  className="w-full flex items-center gap-2.5 bg-muted/40 rounded-lg px-3 py-2.5 text-left"
                >
                  <BarChart3 className="w-4 h-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm">View sales report</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-3.5 border-t border-border text-destructive text-sm"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </>
        )}

        {subView !== null && (
          <>
            <div className="flex items-center gap-2 p-4 pb-3">
              <button onClick={() => setSubView(null)} aria-label="Back" className="text-muted-foreground">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-semibold">
                {subView === 'print' && 'Thermal Printer'}
                {subView === 'ewallet' && 'E-Wallet QR Codes'}
                {subView === 'report' && 'Report'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {subView === 'print' && <ThermalPrinterSection />}
              {subView === 'ewallet' && <EwalletSection />}
              {subView === 'report' && <ReportSection />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
