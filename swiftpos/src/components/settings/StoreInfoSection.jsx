import { useState, useEffect } from 'react';
import { db } from '@/lib/localDb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';

export default function StoreInfoSection({ compact = false }) {
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <form onSubmit={handleSave} className="flex gap-2">
      <Input
        placeholder="e.g. Aling Nena's Store"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
        className={compact ? 'flex-1 h-9 text-sm' : 'flex-1'}
      />
      <Button type="submit" size={compact ? 'sm' : 'default'} disabled={saving}>
        {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
        {saved ? 'Saved!' : 'Save'}
      </Button>
    </form>
  );
}
