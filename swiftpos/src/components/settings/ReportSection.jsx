import { useState, useEffect } from 'react';
import { db } from '@/lib/localDb';
import { formatCurrency } from '@/lib/utils';

function isWithinPeriod(dateStr, period) {
  const date = new Date(dateStr);
  const now = new Date();
  if (period === 'today') {
    return date.toDateString() === now.toDateString();
  }
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  return date >= weekAgo;
}

export function computeReport(transactions, period) {
  const filtered = transactions.filter((t) => isWithinPeriod(t.created_date, period));
  const totalSales = filtered.reduce((s, t) => s + t.total, 0);
  const totalCredit = filtered
    .filter((t) => t.payment_method === 'credit')
    .reduce((s, t) => s + t.total, 0);

  const itemTotals = {};
  filtered.forEach((t) => {
    (t.items || []).forEach((item) => {
      if (!itemTotals[item.name]) itemTotals[item.name] = { name: item.name, qty: 0, revenue: 0 };
      itemTotals[item.name].qty += item.quantity;
      itemTotals[item.name].revenue += item.line_total;
    });
  });
  const topItems = Object.values(itemTotals).sort((a, b) => b.revenue - a.revenue);

  return { totalSales, totalCredit, txnCount: filtered.length, topItems };
}

export default function ReportSection() {
  const [period, setPeriod] = useState('today');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.entities.SaleTransaction.list('-created_date', 1000).then((all) => {
      setTransactions(all);
      setLoading(false);
    });
  }, []);

  const { totalSales, totalCredit, txnCount, topItems } = computeReport(transactions, period);

  return (
    <div className="space-y-4">
      <div className="flex bg-muted rounded-lg p-1">
        <button
          type="button"
          onClick={() => setPeriod('today')}
          className={`flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-colors ${
            period === 'today' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setPeriod('week')}
          className={`flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-colors ${
            period === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          This Week
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-[11px] text-muted-foreground mb-1">Total sales</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalSales)}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-[11px] text-muted-foreground mb-1">Transactions</p>
              <p className="text-lg font-bold">{txnCount}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 col-span-2">
              <p className="text-[11px] text-muted-foreground mb-1">Total credit charged</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(totalCredit)}</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Top items sold</p>
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales in this period yet.</p>
            ) : (
              <div className="space-y-1.5">
                {topItems.slice(0, 8).map((item) => (
                  <div key={item.name} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{item.qty} sold</span>
                    <span className="text-sm font-medium text-primary shrink-0">{formatCurrency(item.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
