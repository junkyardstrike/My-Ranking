import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Trash2, Download, Upload, Info, Palette, CheckCircle2, AlertCircle, Clock, Settings2, Activity, Tv, Film, Music, BookOpen, Clapperboard, Gamepad2, Sparkles, FileText } from 'lucide-react';
import Counter from '../components/common/Counter';
import { getDefaultDuration } from '../utils/itemMetrics';

export default function SettingsView() {
  const rankings = useStore(state => state.rankings) || [];
  const unrankedItems = useStore(state => state.unrankedItems) || [];
  const folders = useStore(state => state.folders) || [];
  const settings = useStore(state => state.settings) || {};
  const updateSettings = useStore(state => state.updateSettings);
  const importData = useStore(state => state.importData);
  const clearData = useStore(state => state.clearData);
  
  const [confirmClear, setConfirmClear] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const fileInputRef = useRef(null);

  const totalItemsInRankings = rankings.reduce((acc, r) => acc + (r.items || []).filter(i => i.title).length, 0);
  const totalItems = totalItemsInRankings + unrankedItems.length;

  const handleExport = () => {
    // 設定（デフォルト所要時間など）もバックアップに含める（復元時に設定が消えないように）
    const data = { rankings, folders, unrankedItems, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('success', 'データを書き出しました');
  };

  const handleExportCSV = () => {
    const allItems = useStore.getState().getAllItems();
    const headers = ['ID', 'Title', 'Author', 'Genre', 'Rating', 'Views', 'Created At', 'Memo'];
    const rows = allItems.map(i => [
      i.id,
      i.title || '',
      i.author || '',
      i.genre || '',
      i.rating || 0,
      i.views || 0,
      i.createdAt || '',
      (i.memo || '').replace(/\n/g, ' ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('success', 'CSVを書き出しました');
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

  const handleDurationChange = (genre, value, unitLabel) => {
    const val = genre === 'game' ? (parseFloat(value) || 0) : (parseInt(value) || 0);
    if (confirm(`このジャンルのデフォルト時間を ${val} ${unitLabel}に変更しますか？統計データに即座に反映されます。`)) {
      updateSettings({
        defaultDurations: {
          ...settings.defaultDurations,
          [genre]: val
        }
      });
      showStatus('success', '設定を更新しました');
      return true;
    }
    return false;
  };

  const handleToggleViewCount = () => {
    const nextValue = !settings.useViewCount;
    if (confirm(`閲覧回数を計算に${nextValue ? '含める' : '含めない'}設定に変更しますか？`)) {
      updateSettings({ useViewCount: nextValue });
      showStatus('success', '設定を更新しました');
    }
  };

  return (
    <div className="space-y-6 pt-1 pb-20">
      <div className="relative">
        <div className="fes-pass bg-ink">
          <p className="font-fes text-[11px] tracking-[0.04em] opacity-90">STAFF ONLY</p>
          <h1 className="font-fes text-[28px] leading-tight mt-0.5">Settings</h1>
          <p className="text-[10px] font-bold tracking-[0.12em] opacity-85 mt-1">App Configuration ／ アプリ設定</p>
        </div>

        {status && (
          <div role="status" className={`fixed left-1/2 -translate-x-1/2 bottom-[calc(84px+env(safe-area-inset-bottom))] flex items-center gap-2 px-4 py-2.5 text-[12px] font-black text-white border-2 border-ink z-[95] whitespace-nowrap ${status.type === 'success' ? 'bg-teal' : 'bg-coral'}`}>
            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
          <div key={s.label} className="bg-mist border border-line rounded p-3 text-center">
            <p className="text-2xl font-black text-accent font-mono">
              {s.value}
            </p>
            <p className="text-[10px] text-muted mt-1 uppercase font-bold tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="bg-mist border border-line rounded-sm overflow-hidden">
          <div className="p-4 border-b border-line bg-mist">
            <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-black">Data Management</p>
          </div>

          <button
            onClick={handleExport}
            className="w-full flex items-center gap-4 p-4 hover:bg-mist transition-colors border-b border-line group"
          >
            <div className="w-10 h-10 rounded bg-mist flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-ink">JSONを書き出す (Export)</p>
              <p className="text-[11px] text-muted font-medium">画像を含む全データのバックアップ</p>
            </div>
          </button>

          <button
            onClick={handleImportClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-mist transition-colors border-b border-line group"
          >
            <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-ink">JSONを取り込む (Import)</p>
              <p className="text-[11px] text-muted font-medium">バックアップファイルから復元</p>
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
            onClick={handleExportCSV}
            className="w-full flex items-center gap-4 p-4 hover:bg-mist transition-colors border-b border-line group"
          >
            <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-ink">CSVを書き出す (Export CSV)</p>
              <p className="text-[11px] text-muted font-medium">Excel等で閲覧可能なデータ出力</p>
            </div>
          </button>

          <button
            onClick={handleClearAll}
            className="w-full flex items-center gap-4 p-4 hover:bg-mist transition-colors group"
          >
            <div className={`w-10 h-10 rounded flex items-center justify-center transition-all group-hover:scale-110 ${confirmClear ? 'bg-red-500/40' : 'bg-red-500/20'}`}>
              <Trash2 className={`w-5 h-5 ${confirmClear ? 'text-red-300' : 'text-red-400'}`} />
            </div>
            <div className="text-left flex-1">
              <p className={`text-sm font-black transition-colors ${confirmClear ? 'text-red-300' : 'text-ink'}`}>
                {confirmClear ? 'タップで削除確定' : '全データを削除 (Clear All)'}
              </p>
              <p className="text-[11px] text-muted font-medium">ストレージのデータを完全にリセット</p>
            </div>
          </button>
        </div>

        {/* Precision Calculation Settings */}
        {/* Precision Calculation Settings */}
        <div className="bg-mist border border-line rounded-sm overflow-hidden mt-6 relative">

          <div className="relative z-10">
            <div className="p-5 border-b border-line bg-mist flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-accent" />
                <p className="text-[10px] text-ink uppercase tracking-[0.2em] font-black">Precision Calculation / 視聴時間の精密設定</p>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Description Box */}
              <div className="relative p-5 bg-mist rounded-sm border border-line overflow-hidden">
                
                <div className="relative z-10">
                  <p className="text-sm text-accent font-black mb-2 flex items-center gap-2 not-italic">
                    <Sparkles size={16} /> 視聴時間の精密計算について
                  </p>
                  <p className="text-xs text-ink leading-relaxed font-medium not-italic font-sans">
                    STATSタブでの累計視聴時間の算出に使用される設定です。個々の作品詳細で「所要時間」が未入力の場合、ここで設定した時間がデフォルト値として適用されます。アニメや漫画等の連載形式は「設定時間 × 話数/巻数」で算出されます。
                  </p>
                </div>
              </div>

              {/* View Count Toggle */}
              <div className="relative flex items-center justify-between p-5 bg-mist rounded-sm border border-line overflow-hidden">
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all duration-500 ${settings.useViewCount ? 'bg-teal text-white' : 'bg-mist text-muted'}`}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-black text-ink tracking-tight">閲覧回数を計算に含める</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Include View Count in Duration</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleViewCount}
                  aria-pressed={!!settings.useViewCount}
                  aria-label="閲覧回数を計算に含める"
                  className={`relative z-10 flex-shrink-0 w-14 h-7 rounded-full p-1 transition-colors duration-150 after:content-[''] after:absolute after:-inset-2.5 ${settings.useViewCount ? 'bg-teal' : 'bg-line'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full  transition-transform duration-150 ${settings.useViewCount ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Durations Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Clock className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-black text-ink uppercase tracking-widest">Default Unit Durations</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-mist rounded-sm border border-line relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b to-transparent opacity-30" />
                  {[
                    { id: 'movie', label: '映画', icon: Film, unit: '作品' },
                    { id: 'music', label: '音楽', icon: Music, unit: '曲' },
                    { id: 'anime', label: 'アニメ', icon: Tv, unit: '話' },
                    { id: 'drama', label: 'ドラマ', icon: Clapperboard, unit: '話' },
                    { id: 'manga', label: '漫画', icon: BookOpen, unit: '巻' },
                    { id: 'game', label: 'ゲーム', icon: Gamepad2, unit: '回', timeUnit: 'hour' },
                  ].map(genre => (
                    <div key={genre.id} className="relative z-10 flex flex-col gap-3 p-4 bg-mist rounded-sm border border-line hover:border-line transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <genre.icon className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-black text-ink uppercase tracking-widest">{genre.label}</span>
                        </div>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">1{genre.unit}あたり</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          min="0"
                          step={genre.timeUnit === 'hour' ? '0.1' : '1'}
                          // 値が外部で変わった（復元・リセット）ときに表示を更新するため key に値を含める
                          key={`${genre.id}-${getDefaultDuration(genre.id, settings)}`}
                          defaultValue={getDefaultDuration(genre.id, settings)}
                          onBlur={(e) => {
                            const current = getDefaultDuration(genre.id, settings);
                            const val = genre.timeUnit === 'hour' ? (parseFloat(e.target.value) || 0) : (parseInt(e.target.value) || 0);
                            if (val !== current) {
                              const ok = handleDurationChange(genre.id, e.target.value, genre.timeUnit === 'hour' ? '時間' : '分');
                              // キャンセルしたら入力欄を元の値に戻す（表示と実際の設定がズレないように）
                              if (!ok) e.target.value = current;
                            } else {
                              e.target.value = current;
                            }
                          }}
                          className="bg-mist border border-line rounded px-4 py-2.5 text-ink font-mono font-black text-lg outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 w-full transition-all"
                        />
                        <span className="text-xs font-black text-muted uppercase tracking-[0.2em]">{genre.timeUnit === 'hour' ? 'hour' : 'min'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="bg-mist border border-line rounded-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-mist flex items-center justify-center">
            <Info className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-black text-ink tracking-widest uppercase">MASTERPIECE PWA</p>
            <p className="text-[11px] text-muted font-bold">バージョン {__APP_VERSION__}（{new Date(__BUILD_TIME__).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 更新）</p>
          </div>
        </div>
      </div>
    </div>
  );
}
