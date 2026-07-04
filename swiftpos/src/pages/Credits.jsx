import { useState, useEffect } from 'react';
import { listCreditAccounts, recordPayment } from '@/lib/creditAccounts';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HandCoins, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function Credits() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [paymentInputs, setPaymentInputs] = useState({});
  const [payingId, setPayingId] = useState('');

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
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Credits</h1>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Owed</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(totalOwed)}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer..." className="pl-9 h-11" />
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
            return (
              <div key={account.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : account.id)}
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{(account.history || []).length} transaction(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${account.balance > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {formatCurrency(account.balance || 0)}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border p-4 space-y-3 bg-muted/20">
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
                          <div key={i} className="flex justify-between text-xs py-1 border-b border-border/40 last:border-0">
                            <span className="text-muted-foreground">
                              {h.type === 'charge' ? 'Charged' : 'Payment'} · {new Date(h.date).toLocaleDateString()}
                            </span>
                            <span className={h.type === 'charge' ? 'text-foreground' : 'text-primary'}>
                              {h.type === 'charge' ? '+' : '-'}{formatCurrency(h.amount)}
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
    </div>
  );
}
