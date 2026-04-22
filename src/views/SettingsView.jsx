import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Trash2, Download, Upload, Info, Palette, CheckCircle2, AlertCircle } from 'lucide-react';
import Counter from '../components/common/Counter';

export default function SettingsView() {
  const rankings = useStore(state => state.rankings) || [];
  const unrankedItems = useStore(state => state.unrankedItems) || [];
  const folders = useStore(state => state.folders) || [];
  const importData = useStore(state => state.importData);
  const clearData = useStore(state => state.clearData);
  
  const [confirmClear, setConfirmClear] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const fileInputRef = useRef(null);

  const totalItemsInRankings = rankings.reduce((acc, r) => acc + (r.items || []).filter(i => i.title).length, 0);
  const totalItems = totalItemsInRankings + unrankedItems.length;

  const handleExport = () => {
    const data = { rankings, folders, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('success', 'データを書き出しました');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('現在のデータはすべて上書きされますがよろしいですか？')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await importData(json);
        showStatus('success', 'データを復元しました');
      } catch (err) {
        console.error('Import error', err);
        showStatus('error', 'ファイルの形式が正しくありません');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleClearAll = async () => {
    if (confirmClear) {
      await clearData();
      showStatus('success', 'データをリセットしました');
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pt-2 sm:pt-4 pb-20">
      <div className="flex items-end justify-between px-1 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Settings</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">アプリ設定・データ管理</p>
        </div>
        {status && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold animate-in slide-in-from-right-4 fade-in ${status.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {status.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {status.message}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'フォルダ', value: folders.length },
          { label: 'ランキング', value: rankings.length },
          { label: '作品数', value: totalItems },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-accent font-mono">
              <Counter value={s.value} />
            </p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Data Management</p>
          </div>

          <button
            onClick={handleExport}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-white">JSONを書き出す (Export)</p>
              <p className="text-[11px] text-slate-500 font-medium">画像を含む全データのバックアップ</p>
            </div>
          </button>

          <button
            onClick={handleImportClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-white">JSONを取り込む (Import)</p>
              <p className="text-[11px] text-slate-500 font-medium">バックアップファイルから復元</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
          </button>

          <button
            onClick={handleClearAll}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${confirmClear ? 'bg-red-500/40' : 'bg-red-500/20'}`}>
              <Trash2 className={`w-5 h-5 ${confirmClear ? 'text-red-300' : 'text-red-400'}`} />
            </div>
            <div className="text-left flex-1">
              <p className={`text-sm font-black transition-colors ${confirmClear ? 'text-red-300' : 'text-white'}`}>
                {confirmClear ? 'タップで削除確定' : '全データを削除 (Clear All)'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">ストレージのデータを完全にリセット</p>
            </div>
          </button>
        </div>

        {/* App info */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-widest uppercase">RANKING PWA</p>
            <p className="text-[11px] text-slate-500 font-medium">Premium Cinematic Experience</p>
          </div>
        </div>
      </div>
    </div>
  );
}
