import { create } from 'zustand';
import { createElement } from 'react';

// 画面の切り替え（URL と履歴の管理）。
// react-router は機能が多いぶん処理も重いので、このアプリに必要な分だけを自前で持つ。
// URL はこれまでと同じ（/ /folder/:id /ranking/:id /all /stats /settings）。

const current = () => ({
  pathname: window.location.pathname || '/',
  state: window.history.state?.usr ?? null,
  key: window.history.state?.key ?? 'init',
});

let keySeq = 0;
const nextKey = () => `k${Date.now().toString(36)}${(keySeq++).toString(36)}`;

export const useRoute = create(() => current());

window.addEventListener('popstate', () => useRoute.setState(current()));

export function navigate(path, { state = null, replace = false } = {}) {
  const entry = { usr: state, key: nextKey() };
  if (replace) window.history.replaceState(entry, '', path);
  else window.history.pushState(entry, '', path);
  useRoute.setState({ pathname: path, state, key: entry.key });
}

// 今の URL に残っている「画面に渡した状態」（レコードから追加の対象など）を消す
export function clearRouteState() {
  window.history.replaceState({ usr: null, key: window.history.state?.key }, '');
  useRoute.setState({ state: null });
}

// '/folder/:folderId' のような形と一致すれば { folderId } を返す
export function matchPath(pattern, pathname) {
  const p = pattern.split('/').filter(Boolean);
  const s = pathname.split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

export const tabOf = (pathname) => {
  if (pathname.startsWith('/all')) return 'all';
  if (pathname.startsWith('/stats')) return 'stats';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'home';
};

// <a> のまま（長押しメニューなどは従来どおり）、タップでは画面だけを切り替えるリンク
export function Link({ to, onClick, ...rest }) {
  return createElement('a', {
    ...rest,
    href: to,
    onClick: (e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (to !== window.location.pathname) navigate(to);
    },
  });
}
