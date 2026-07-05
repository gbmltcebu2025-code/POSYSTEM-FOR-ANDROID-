import { useState, useEffect } from 'react';
import { listCreditAccounts, recordPayment, recentItemNames, totalItemCount } from '@/lib/creditAccounts';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CreditCustomerForm from '@/components/CreditCustomerForm';
import { HandCoins, Search, ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react';

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function Credits() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [paymentInputs, setPaymentInputs] = useState({});
  const [payingId, setPayingId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const load = () => {
    listCreditAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = accounts.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const totalOwed = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const handlePay = async (account, amount) => {
    if (!amount || amount <= 0) return;
    setPayingId(account.id);
    try {
      await recordPayment(account.id, Math.min(amount, account.balance));
      setPaymentInputs((prev) => ({ ...prev, [account.id]: '' }));
      load();
    } finally {
      setPayingId('');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Customer utang</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowAddForm(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
        </Button>
      </div>

      <div className="bg-muted/40 rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">Total owed</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(totalOwed)}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer" className="pl-9 h-11" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-16">
          <HandCoins className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">{accounts.length === 0 ? 'No credit sales yet' : 'No matching customers'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((account) => {
            const isOpen = expanded === account.id;
            const isPaid = (account.balance || 0) === 0;
            const names = recentItemNames(account, 2);
            const itemCount = totalItemCount(account);
            return (
              <div key={account.id} className="rounded-xl overflow-hidden bg-muted/20">
                <button
                  className="w-full flex items-center gap-3 p-3 hover:bg-accent/20 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : account.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                    {initials(account.name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {names.length > 0 ? `${names.join(', ')}` : 'No items yet'}
                      {itemCount > 0 && ` · ${itemCount} item${itemCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-sm">{formatCurrency(account.balance || 0)}</p>
                    <span
                      className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-md mt-0.5 ${
                        isPaid ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3 pt-1 space-y-3">
                    {account.balance > 0 && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Payment amount"
                          value={paymentInputs[account.id] || ''}
                          onChange={(e) => setPaymentInputs((prev) => ({ ...prev, [account.id]: e.target.value }))}
                          className="flex-1 h-9"
                        />
                        <Button
                          size="sm"
                          onClick={() => handlePay(account, Number(paymentInputs[account.id]))}
                          disabled={payingId === account.id}
                        >
                          {payingId === account.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                          Record Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePay(account, account.balance)}
                          disabled={payingId === account.id}
                        >
                          Pay in Full
                        </Button>
                      </div>
                    )}

                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {(account.history || [])
                        .slice()
                        .reverse()
                        .map((h, i) => (
                          <div key={i} className="flex justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
                            <span className="text-muted-foreground">
                              {h.type === 'charge'
                                ? h.items?.length
                                  ? h.items.map((it) => it.name).join(', ')
                                  : 'Charged'
                                : 'Payment'}
                              <span className="block text-[10px] opacity-70">{new Date(h.date).toLocaleDateString()}</span>
                            </span>
                            <span className={h.type === 'charge' ? 'text-foreground' : 'text-primary'}>
                              {h.type === 'charge' ? '+' : '-'}
                              {formatCurrency(h.amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreditCustomerForm open={showAddForm} onClose={() => setShowAddForm(false)} onSaved={load} />
    </div>
  );
}
