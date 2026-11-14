import { create } from 'zustand';

// 下部タブの定義と、URL からどのタブにいるかの判定
export const tabOf = (pathname) => {
  if (pathname.startsWith('/all')) return 'all';
  if (pathname.startsWith('/stats')) return 'stats';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'home';
};

// 押されたタブ（URL の更新を待たずに、押した瞬間に画面とタブの色を切り替えるため）
// from: 押した時点の URL。URL が変わったら（＝移動が完了したら）無効になる
export const usePendingTab = create((set) => ({
  pending: null,
  setPending: (pending) => set({ pending }),
}));

export const resolveTab = (pending, pathname) => (pending && pending.from === pathname ? pending.id : tabOf(pathname));
