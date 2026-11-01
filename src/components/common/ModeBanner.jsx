// 編集モード・並び替えモード中に画面上部へ出す帯
export default function ModeBanner({ isEditMode, isReorderMode, editNote }) {
  if (!isEditMode && !isReorderMode) return null;
  return (
    <div className={`px-3 py-2 text-white ${isEditMode ? 'bg-teal' : 'bg-coral'}`}>
      <p className="text-[13px] font-black">{isEditMode ? '編集モード実行中' : '並び替えモード実行中'}</p>
      {isEditMode && editNote && <p className="text-[11px] font-bold opacity-90 mt-0.5">{editNote}</p>}
    </div>
  );
}
