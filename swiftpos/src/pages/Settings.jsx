import { useState, useEffect } from 'react';
import { db } from '@/lib/localDb';
import { takeProductPhoto } from '@/lib/nativePhoto';
import {
  isNative,
  scanForPrinters,
  connectPrinter,
  getSavedPrinter,
  forgetPrinter,
  testPrintThermal,
} from '@/lib/thermalPrinter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Printer,
  Bluetooth,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  Wallet,
  Camera,
  Images,
  ImageOff,
  X,
  Store,
  Save,
} from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <StoreInfoSection />
      <ThermalPrinterSection />
      <EwalletSection />
    </div>
  );
}

function StoreInfoSection() {
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    db.settings.get().then((s) => {
      setStoreName(s.storeName || '');
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await db.settings.setStoreName(storeName.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Store className="w-4 h-4 text-primary" />
        Store Info
      </h2>
      <p className="text-sm text-muted-foreground">
        This name appears at the top of every printed receipt.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <form onSubmit={handleSave} className="flex gap-2">
          <Input
            placeholder="e.g. Aling Nena's Store"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {saved ? 'Saved!' : 'Save'}
          </Button>
        </form>
      )}
    </section>
  );
}

function ThermalPrinterSection() {
  const [connected, setConnected] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectingAddress, setConnectingAddress] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSavedPrinter().then(setConnected);
  }, []);

  const handleScan = async () => {
    setError('');
    setMessage('');
    setDevices([]);
    setScanning(true);
    try {
      const found = await scanForPrinters(setDevices);
      setDevices(found);
      if (found.length === 0) setMessage('No printers found. Make sure the printer is on and in pairing range.');
    } catch (e) {
      setError(e?.message || 'Could not scan for Bluetooth printers.');
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device) => {
    setError('');
    setConnectingAddress(device.address);
    try {
      const result = await connectPrinter(device.address);
      setConnected({ address: result.address, name: result.name });
      setDevices([]);
    } catch (e) {
      setError(e?.message || 'Could not connect to that printer.');
    } finally {
      setConnectingAddress('');
    }
  };

  const handleForget = async () => {
    await forgetPrinter();
    setConnected(null);
  };

  const handleTestPrint = async () => {
    setError('');
    setMessage('');
    setTesting(true);
    try {
      await testPrintThermal();
      setMessage('Test print sent!');
    } catch (e) {
      setError(e?.message || 'Test print failed.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Printer className="w-4 h-4 text-primary" />
        Thermal Receipt Printer
      </h2>
      <p className="text-sm text-muted-foreground">
        Connect a Bluetooth ESC/POS receipt printer to print directly, without a system print dialog.
      </p>

      {!isNative && (
        <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
          Bluetooth printer setup is only available in the installed Android app.
        </p>
      )}

      {isNative && (
        <div className="border border-border rounded-xl p-4 space-y-3">
          {connected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium">{connected.name || 'Unnamed printer'}</p>
                  <p className="text-xs text-muted-foreground">{connected.address}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTestPrint} disabled={testing}>
                  {testing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                  Test Print
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleForget}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning}>
                {scanning ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Bluetooth className="w-3.5 h-3.5 mr-2" />
                )}
                {scanning ? 'Scanning...' : 'Scan for Printers'}
              </Button>

              {devices.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {devices.map((d) => (
                    <div key={d.address} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <span>{d.name || d.address}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnect(d)}
                        disabled={connectingAddress === d.address}
                      >
                        {connectingAddress === d.address ? (
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        ) : null}
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {message && <p className="text-xs text-muted-foreground">{message}</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </section>
  );
}

const emptyWallet = { name: '', qr_url: '' };

function EwalletSection() {
  const [ewallets, setEwallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = not editing, {} = new, {...} = existing
  const [form, setForm] = useState(emptyWallet);
  const [photoLoading, setPhotoLoading] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const settings = await db.settings.get();
    setEwallets(settings.ewallets || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startAdd = () => {
    setForm(emptyWallet);
    setError('');
    setEditing({});
  };

  const startEdit = (wallet) => {
    setForm({ name: wallet.name, qr_url: wallet.qr_url });
    setError('');
    setEditing(wallet);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyWallet);
  };

  const handlePickPhoto = async (source) => {
    setError('');
    setPhotoLoading(source);
    try {
      const dataUrl = await takeProductPhoto(source);
      if (dataUrl) setForm((f) => ({ ...f, qr_url: dataUrl }));
    } catch (e) {
      setError(e?.message || 'Could not access the camera or photo library.');
    } finally {
      setPhotoLoading('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Give this e-wallet a name (e.g. GCash, Maya).');
      return;
    }
    if (!form.qr_url) {
      setError('Upload a QR code image.');
      return;
    }
    if (editing?.id) {
      await db.settings.updateEwallet(editing.id, form);
    } else {
      await db.settings.addEwallet(form);
    }
    await load();
    cancelEdit();
  };

  const handleRemove = async (id) => {
    await db.settings.removeEwallet(id);
    await load();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          E-Wallet QR Codes
        </h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startAdd}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Upload your GCash, Maya, or other e-wallet QR codes so customers can scan to pay at checkout.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          {ewallets.length === 0 && !editing && (
            <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">No e-wallets added yet.</p>
          )}

          <div className="space-y-2">
            {ewallets.map((w) => (
              <div key={w.id} className="flex items-center gap-3 border border-border rounded-xl p-3">
                <img src={w.qr_url} alt={w.name} className="w-12 h-12 rounded-md object-cover border border-border" />
                <span className="flex-1 font-medium text-sm">{w.name}</span>
                <Button variant="ghost" size="sm" onClick={() => startEdit(w)}>Edit</Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleRemove(w.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {editing && (
            <form onSubmit={handleSave} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{editing.id ? 'Edit E-Wallet' : 'New E-Wallet'}</p>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wallet-name">Name</Label>
                <Input
                  id="wallet-name"
                  placeholder="e.g. GCash"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border">
                  {form.qr_url ? (
                    <img src={form.qr_url} alt="QR preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handlePickPhoto('camera')} disabled={!!photoLoading}>
                    {photoLoading === 'camera' ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-2" />}
                    Camera
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => handlePickPhoto('gallery')} disabled={!!photoLoading}>
                    {photoLoading === 'gallery' ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Images className="w-3.5 h-3.5 mr-2" />}
                    Gallery
                  </Button>
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button type="submit" className="w-full">Save E-Wallet</Button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
