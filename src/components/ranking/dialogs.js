import { create } from 'zustand';

// 作品の詳細・ランキングに追加のダイアログは、アプリ全体で 1 つだけ表示する。
// （カードの中に持つと、編集モードの切り替えで一覧が作り直された時に閉じてしまうため）
export const useDialogs = create(() => ({ detailId: null, addId: null }));
export const openDetail = (id) => useDialogs.setState({ detailId: id });
export const closeDetail = () => useDialogs.setState({ detailId: null });
export const openAdd = (id) => useDialogs.setState({ addId: id });
export const closeAdd = () => useDialogs.setState({ addId: null });
