import { useState, useEffect } from 'react';
import {
  isNative,
  scanForPrinters,
  connectPrinter,
  getSavedPrinter,
  forgetPrinter,
  testPrintThermal,
} from '@/lib/thermalPrinter';
import { Button } from '@/components/ui/button';
import { Bluetooth, CheckCircle2, Trash2, Loader2 } from 'lucide-react';

export default function ThermalPrinterSection() {
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

  if (!isNative) {
    return (
      <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
        Bluetooth printer setup is only available in the installed Android app.
      </p>
    );
  }

  return (
    <div className="space-y-3">
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
  );
}
