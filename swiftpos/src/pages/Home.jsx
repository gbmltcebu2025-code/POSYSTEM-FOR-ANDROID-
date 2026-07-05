import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/localDb';
import { listCreditAccounts } from '@/lib/creditAccounts';
import { formatCurrency } from '@/lib/utils';
import ProfileDrawer from '@/components/ProfileDrawer';
import {
  Store,
  Bell,
  Calendar,
  ChevronRight,
  ShoppingCart,
  ScanLine,
  Package,
  Box,
  TrendingUp,
  Receipt,
  HandCoins,
} from 'lucide-react';

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('your store');
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentTxns, setRecentTxns] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = () => {
    Promise.all([
      db.settings.get(),
      db.entities.SaleTransaction.list('-created_date', 500),
      db.entities.Product.list('-updated_date', 500),
      listCreditAccounts(),
    ]).then(([settings, transactions, products]) => {
      setStoreName(settings.storeName?.trim() || 'your store');
      const today = new Date().toDateString();
      const todaySales = transactions.filter((t) => new Date(t.created_date).toDateString() === today);
      setTodayRevenue(todaySales.reduce((s, t) => s + t.total, 0));
      setTodayCount(todaySales.length);
      setLowStockCount(products.filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? 5)).length);
      setRecentTxns(transactions.slice(0, 3));
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const shortcuts = [
    { label: 'New sale', icon: ShoppingCart, onClick: () => navigate('/pos') },
    { label: 'Scan item', icon: ScanLine, onClick: () => navigate('/pos', { state: { autoScan: true } }) },
    { label: 'Products', icon: Package, onClick: () => navigate('/products') },
    { label: 'Inventory', icon: Box, onClick: () => navigate('/inventory'), badge: lowStockCount > 0 ? lowStockCount : null },
    { label: 'Credits', icon: HandCoins, onClick: () => navigate('/credits') },
    { label: 'Sales', icon: TrendingUp, onClick: () => navigate('/sales') },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2.5 rounded-xl -m-1 p-1 hover:bg-accent/20 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-[11px] text-muted-foreground leading-none">Hello,</p>
            <p className="text-sm font-medium leading-tight">{storeName}</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate('/inventory')}
          className="relative text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {lowStockCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 mb-4 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        {formatToday()}
      </div>

      <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-4 mb-4 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs opacity-80 mb-1.5">Today's revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
            <p className="text-xs opacity-80 mt-1.5">{todayCount} sale{todayCount === 1 ? '' : 's'} today</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            onClick={s.onClick}
            className="relative flex flex-col items-center gap-1.5 bg-card border border-border rounded-xl py-3.5 hover:bg-accent/20 transition-colors"
          >
            <s.icon className="w-5 h-5 text-primary" />
            <span className="text-[11px] font-medium">{s.label}</span>
            {s.badge && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-medium flex items-center justify-center">
                {s.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Recent transactions</h2>
        <button onClick={() => navigate('/sales')} className="text-xs text-primary flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : recentTxns.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 text-center">No sales yet today.</p>
      ) : (
        <div className="space-y-2">
          {recentTxns.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate('/sales')}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5 text-left hover:bg-accent/20 transition-colors"
            >
              <Receipt className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{new Date(t.created_date).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t.payment_method === 'credit' ? 'Credit' : t.payment_method === 'cash' ? 'Cash' : t.payment_method}
                </p>
              </div>
              <span className="text-sm font-medium shrink-0">{formatCurrency(t.total)}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
