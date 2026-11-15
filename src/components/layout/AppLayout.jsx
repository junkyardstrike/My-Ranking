import { Activity, useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Breadcrumb from './Breadcrumb';
import HamburgerMenu from './HamburgerMenu';
import BottomTabBar from './BottomTabBar';
import DialogHost from '../ranking/DialogHost';
import { useStore } from '../../store/useStore';
import { useRoute, tabOf, matchPath, navigate } from '../../lib/router';
import FolderView from '../../views/FolderView';
import RankingView from '../../views/RankingView';
import AllRankingsView from '../../views/AllRankingsView';
import StatsView from '../../views/StatsView';
import SettingsView from '../../views/SettingsView';

// ヘッダーの切り替えスイッチ（並び替え・編集）
function Toggle({ label, shortLabel, on, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex items-center gap-1.5 h-11 px-1.5 sm:px-2 active:bg-mist"
    >
      <span className={`text-[10px] font-black ${on ? 'text-ink' : 'text-muted'}`}>
        {shortLabel ? (<><span className="hidden xs:inline">{label}</span><span className="xs:hidden">{shortLabel}</span></>) : label}
      </span>
      <span className={`relative w-8 h-[18px] rounded-full ${on ? color : 'bg-line'}`}>
        <span className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-white ${on ? 'translate-x-[14px]' : ''}`} />
      </span>
    </button>
  );
}

// MASTERPIECE タブの中の画面（フォルダ・ランキング）
function HomeScreen({ pathname }) {
  const ranking = matchPath('/ranking/:rankingId', pathname);
  const folder = matchPath('/folder/:folderId', pathname);
  const known = pathname === '/' || ranking || folder;
  useEffect(() => { if (!known) navigate('/', { replace: true }); }, [known]);
  if (ranking) return <RankingView rankingId={ranking.rankingId} />;
  return <FolderView folderId={folder?.folderId ?? null} />;
}

export default function AppLayout() {
  const init = useStore(state => state.init);
  const isInitialized = useStore(state => state.isInitialized);
  const isEditMode = useStore(state => state.isEditMode);
  const isReorderMode = useStore(state => state.isReorderMode);
  const setEditMode = useStore(state => state.setEditMode);
  const setReorderMode = useStore(state => state.setReorderMode);

  useEffect(() => { init(); }, [init]);

  const pathname = useRoute(s => s.pathname);
  // 下部タブの4画面は一度作ったら破棄せず、<Activity> で表示/非表示だけを切り替える。
  // タブの色（BottomTabBar）は押した瞬間に変わり、画面の切り替えはその直後の描画で行う
  const tab = useDeferredValue(tabOf(pathname));
  // MASTERPIECE タブは、他のタブを見ている間も最後に開いていたフォルダ/ランキングを保持する
  const [homePath, setHomePath] = useState(pathname);
  if (tabOf(pathname) === 'home' && homePath !== pathname) setHomePath(pathname);

  // スクロール位置はタブごとに覚えておき、戻ってきたら復元する
  const scrollByTab = useRef({});
  const currentTab = useRef(tab);
  const prevHomePath = useRef(homePath);
  useEffect(() => {
    const onScroll = () => { scrollByTab.current[currentTab.current] = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useLayoutEffect(() => {
    if (currentTab.current !== tab) {
      currentTab.current = tab;
      window.scrollTo(0, scrollByTab.current[tab] || 0);
    }
  }, [tab]);
  // 同じタブの中で別の画面（フォルダ→ランキングなど）に移ったら先頭から表示
  useLayoutEffect(() => {
    if (prevHomePath.current !== homePath) {
      prevHomePath.current = homePath;
      if (currentTab.current === 'home') window.scrollTo(0, 0);
    }
  }, [homePath]);

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center text-muted font-fes">LOADING…</div>;
  }

  return (
    <div className="relative min-h-screen text-ink flex flex-col bg-white [overflow-x:clip]">
      <header className="sticky top-0 z-[90] bg-white border-b-[3px] border-ink pt-[env(safe-area-inset-top)]">
        <div className="max-w-4xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 max-w-[35%] sm:max-w-[50%]">
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-0.5 sm:gap-2">
            <Toggle label="並び替え" shortLabel="順序" on={isReorderMode} color="bg-coral" onClick={() => setReorderMode(!useStore.getState().isReorderMode)} />
            <Toggle label="編集" on={isEditMode} color="bg-teal" onClick={() => setEditMode(!useStore.getState().isEditMode)} />
            <HamburgerMenu />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 md:px-6 pb-28">
        <Activity mode={tab === 'home' ? 'visible' : 'hidden'}><HomeScreen pathname={homePath} /></Activity>
        <Activity mode={tab === 'all' ? 'visible' : 'hidden'}><AllRankingsView /></Activity>
        <Activity mode={tab === 'stats' ? 'visible' : 'hidden'}><StatsView /></Activity>
        <Activity mode={tab === 'settings' ? 'visible' : 'hidden'}><SettingsView /></Activity>
      </main>

      <BottomTabBar />
      <DialogHost />
    </div>
  );
}
