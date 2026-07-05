import StoreInfoSection from '@/components/settings/StoreInfoSection';
import ThermalPrinterSection from '@/components/settings/ThermalPrinterSection';
import EwalletSection from '@/components/settings/EwalletSection';
import ThemeSection from '@/components/settings/ThemeSection';
import ReportSection from '@/components/settings/ReportSection';
import { Store, Printer, Wallet, Sun, BarChart3 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          Store Info
        </h2>
        <p className="text-sm text-muted-foreground">This name appears at the top of every printed receipt.</p>
        <StoreInfoSection />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Printer className="w-4 h-4 text-primary" />
          Thermal Receipt Printer
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect a Bluetooth ESC/POS receipt printer to print directly, without a system print dialog.
        </p>
        <div className="border border-border rounded-xl p-4">
          <ThermalPrinterSection />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" />
          Background Theme
        </h2>
        <p className="text-sm text-muted-foreground">Choose how SwiftPOS looks on this device.</p>
        <ThemeSection />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          E-Wallet QR Codes
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload your GCash, Maya, or other e-wallet QR codes so customers can scan to pay at checkout.
        </p>
        <EwalletSection />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Report
        </h2>
        <p className="text-sm text-muted-foreground">How customers are buying — item sales and credit charged.</p>
        <ReportSection />
      </section>
    </div>
  );
}
