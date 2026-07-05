import { useState, useEffect } from 'react';
import { db } from '@/lib/localDb';
import { takeProductPhoto } from '@/lib/nativePhoto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Loader2, Camera, Images, ImageOff, X } from 'lucide-react';

const emptyWallet = { name: '', qr_url: '' };

export default function EwalletSection() {
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
    <div className="space-y-3">
      {!editing && (
        <Button variant="outline" size="sm" onClick={startAdd}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add E-Wallet
        </Button>
      )}

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
    </div>
  );
}
