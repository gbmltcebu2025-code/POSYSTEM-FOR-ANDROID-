import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/localDb';
import { listCreditAccounts } from '@/lib/creditAccounts';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import { ScanLine, ShoppingCart, DollarSign, AlertTriangle, HandCoins } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [creditOwed, setCreditOwed] = useState(0);

  useEffect(() => {
    Promise.all([
      db.entities.SaleTransaction.list('-created_date', 500),
      db.entities.Product.list('-updated_date', 500),
      listCreditAccounts(),
    ]).then(([transactions, products, accounts]) => {
      const today = new Date().toDateString();
      const todaySales = transactions.filter((t) => new Date(t.created_date).toDateString() === today);
      setTodayRevenue(todaySales.reduce((s, t) => s + t.total, 0));
      setTodayCount(todaySales.length);
      setLowStockCount(products.filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? 5)).length);
      setCreditOwed(accounts.reduce((s, a) => s + (a.balance || 0), 0));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Here's how today is going.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => navigate('/pos')}
          className="flex flex-col items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-8 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <ShoppingCart className="w-8 h-8" />
          <span className="font-semibold text-lg">New Sale</span>
        </button>
        <button
          onClick={() => navigate('/pos', { state: { autoScan: true } })}
          className="flex flex-col items-center justify-center gap-2 bg-card border border-border rounded-2xl py-8 hover:bg-accent/30 transition-colors shadow-sm"
        >
          <ScanLine className="w-8 h-8 text-primary" />
          <span className="font-semibold text-lg">Scan Item</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Today's Revenue" value={formatCurrency(todayRevenue)} icon={DollarSign} accent="text-primary" />
          <StatCard label="Today's Sales" value={todayCount} icon={ShoppingCart} />
          <StatCard label="Low Stock Items" value={lowStockCount} icon={AlertTriangle} accent={lowStockCount > 0 ? 'text-destructive' : ''} />
          <StatCard label="Credit Owed" value={formatCurrency(creditOwed)} icon={HandCoins} accent={creditOwed > 0 ? 'text-primary' : ''} />
        </div>
      )}
    </div>
  );
}
