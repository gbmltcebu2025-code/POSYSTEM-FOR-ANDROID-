import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Home, ScanLine, Package, Boxes, BarChart3, HandCoins, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ScanActionSheet from '@/components/ScanActionSheet';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/pos', label: 'Sell', icon: ScanLine },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/sales', label: 'Sales', icon: BarChart3 },
  { to: '/credits', label: 'Credits', icon: HandCoins },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

// The mobile bottom bar only has room for a focused set of tabs around the
// floating scan button. Settings now lives behind the Home page's profile
// drawer instead of taking a bottom-bar slot.
const mobileNavItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/sales', label: 'Sales', icon: BarChart3 },
  { to: '/credits', label: 'Credits', icon: HandCoins },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showScanSheet, setShowScanSheet] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleScanToSell = () => {
    setShowScanSheet(false);
    navigate('/pos', { state: { autoScan: true } });
  };

  const handleScanToAddProduct = () => {
    setShowScanSheet(false);
    navigate('/products', { state: { autoScanNewProduct: true } });
  };

  // Splits the 4 mobile tabs into two either side of the center scan button.
  const [leftItems, rightItems] = [mobileNavItems.slice(0, 2), mobileNavItems.slice(2)];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col w-20 lg:w-56 bg-card border-r border-border p-3 gap-1 shrink-0 no-print">
          <div className="px-2 py-4 mb-2 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <ScanLine className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-primary font-bold text-xl hidden lg:block">SwiftPOS</h1>
          </div>
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}

          <div className="flex-1" />

          {user?.email && (
            <p className="hidden lg:block px-3 text-xs text-muted-foreground truncate mb-1" title={user.email}>
              {user.email}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">Log out</span>
          </button>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav: 4 tabs + floating center scan button */}
      <nav className="md:hidden relative bg-card border-t border-border shrink-0 no-print z-40">
        <div className="flex items-stretch">
          {leftItems.map((item) => (
            <MobileTabLink key={item.to} item={item} active={location.pathname === item.to} />
          ))}
          <div className="w-16 shrink-0" aria-hidden="true" />
          {rightItems.map((item) => (
            <MobileTabLink key={item.to} item={item} active={location.pathname === item.to} />
          ))}
        </div>

        <button
          onClick={() => setShowScanSheet(true)}
          aria-label="Scan barcode"
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-background active:scale-95 transition-transform"
        >
          <ScanLine className="w-7 h-7" />
        </button>
      </nav>

      <ScanActionSheet
        open={showScanSheet}
        onClose={() => setShowScanSheet(false)}
        onScanToSell={handleScanToSell}
        onScanToAddProduct={handleScanToAddProduct}
      />
    </div>
  );
}

function MobileTabLink({ item, active }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{item.label}</span>
    </Link>
  );
}
