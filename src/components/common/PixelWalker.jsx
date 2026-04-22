import React, { useState, useEffect } from 'react';

const PALETTES = [
  { hat1: '#fbbf24', hat2: '#f59e0b', visor: '#38bdf8', jacket1: '#fcd34d', jacket2: '#ffffff', pants: '#6b21a8', shoes: '#a855f7' },
  { hat1: '#0ea5e9', hat2: '#0284c7', visor: '#f43f5e', jacket1: '#38bdf8', jacket2: '#ffffff', pants: '#0f172a', shoes: '#f43f5e' },
  { hat1: '#10b981', hat2: '#059669', visor: '#fbbf24', jacket1: '#34d399', jacket2: '#ffffff', pants: '#1e293b', shoes: '#fbbf24' },
  { hat1: '#ec4899', hat2: '#be185d', visor: '#38bdf8', jacket1: '#f472b6', jacket2: '#ffffff', pants: '#4c1d95', shoes: '#38bdf8' },
  { hat1: '#f43f5e', hat2: '#e11d48', visor: '#34d399', jacket1: '#fb7185', jacket2: '#ffffff', pants: '#172554', shoes: '#34d399' },
];

const QUOTES = [
  { text: "あきらめたらそこで試合終了だよ", source: "スラムダンク" },
  { text: "海賊王に、俺はなる！", source: "ONE PIECE" },
  { text: "映画って、本当にいいもんですね", source: "水野晴郎" },
  { text: "真実はいつもひとつ！", source: "名探偵コナン" },
  { text: "クリリンのことかーっ！", source: "ドラゴンボール" },
  { text: "お前はもう死んでいる", source: "北斗の拳" },
  { text: "逃げちゃダメだ、逃げちゃダメだ", source: "エヴァンゲリオン" },
  { text: "ほら、素敵な夢を見させてあげるわ", source: "パプリカ" },
  { text: "映画館で、一生に一度は。", source: "もののけ姫" },
  { text: "またつまらぬものを斬ってしまった", source: "ルパン三世" },
  { text: "心を燃やせ", source: "鬼滅の刃" },
  { text: "最高にハイ！ってやつだぁあ！", source: "ジョジョの奇妙な冒険" },
  { text: "物語はここから始まるんだ", source: "ファイナルファンタジーX" },
  { text: "バルス！", source: "天空の城ラピュタ" },
  { text: "だが断る", source: "ジョジョの奇妙な冒険" },
  { text: "安西先生…バスケがしたいです", source: "スラムダンク" },
  { text: "左手はそえるだけ", source: "スラムダンク" },
  { text: "ザクとは違うのだよ、ザクとは！", source: "機動戦士ガンダム" },
  { text: "僕は新世界の神になる", source: "DEATH NOTE" },
  { text: "計画通り", source: "DEATH NOTE" },
  { text: "駆逐してやる、一匹残らず！", source: "進撃の巨人" },
  { text: "私、気になります！", source: "氷菓" },
  { text: "倍返しだ！", source: "半沢直樹" },
  { text: "同情するなら金をくれ", source: "家なき子" },
  { text: "事件は会議室で起きてるんじゃない！", source: "踊る大捜査線" },
  { text: "生きろ。そなたは美しい", source: "もののけ姫" },
  { text: "飛べない豚はただの豚だ", source: "紅の豚" },
  { text: "40秒で支度しな！", source: "天空の城ラピュタ" },
  { text: "君の膵臓をたべたい", source: "君の膵臓をたべたい" },
  { text: "立てよドズ。お前は強い。", source: "あしたのジョー" },
  { text: "やれやれだぜ", source: "ジョジョの奇妙な冒険" },
  { text: "失われたものを数えるな", source: "ONE PIECE" },
  { text: "全集中、水の呼吸！", source: "鬼滅の刃" },
  { text: "俺の背後に立つな", source: "ゴルゴ13" },
  { text: "わが生涯に一片の悔いなし！", source: "北斗の拳" },
  { text: "考えるな、感じろ", source: "燃えよドラゴン" },
  { text: "I'll be back.", source: "ターミネーター" },
  { text: "May the Force be with you.", source: "スター・ウォーズ" },
  { text: "人生はチョコレートの箱のようなもの", source: "フォレスト・ガンプ" },
  { text: "私、失敗しないので", source: "ドクターX" },
  { text: "じっちゃんの名にかけて！", source: "金田一少年の事件簿" },
  { text: "キンキンに冷えてやがるっ…！", source: "カイジ" },
  { text: "圧倒的感謝…！", source: "カイジ" },
  { text: "領域展開", source: "呪術廻戦" },
  { text: "立て！立つんだジョー！", source: "あしたのジョー" },
  { text: "テメーの血は何色だーっ！！", source: "北斗の拳" },
  { text: "See you space cowboy.", source: "カウボーイビバップ" },
  { text: "さよなら、さよなら、さよなら", source: "淀川長治" },
  { text: "打っていいのは、打たれる覚悟がある奴だけだ", source: "コードギアス" },
  { text: "君の瞳に乾杯", source: "カサブランカ" },
  { text: "アスタ・ラ・ビスタ、ベイビー", source: "ターミネーター2" }
];

const PixelWalker = ({ className = "" }) => {
  const [frame, setFrame] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [quote, setQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const randomActionTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        handleJump();
      }
    }, 5000);
    return () => clearInterval(randomActionTimer);
  }, [isJumping]);

  const handleJump = () => {
    if (isJumping) return;
    setIsJumping(true);
    
    const nextQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(nextQuote);

    setPaletteIndex((prev) => {
      let next = Math.floor(Math.random() * PALETTES.length);
      if (next === prev) next = (next + 1) % PALETTES.length;
      return next;
    });

    setTimeout(() => {
      setIsJumping(false);
    }, 600);
  };

  const colors = PALETTES[paletteIndex];

  return (
    <div 
      className={`relative ${className} w-24 h-24 cursor-pointer`}
      onClick={handleJump}
    >
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in duration-300">
        <div className="relative bg-white text-black text-[10px] font-black px-3 py-2 border-2 border-black whitespace-nowrap shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
           {quote.text}
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r-2 border-b-2 border-black rotate-45" />
        </div>
      </div>

      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-[2px]">
          〜{quote.source}より〜
        </span>
      </div>

      <div className="absolute inset-0 opacity-20 overflow-hidden rounded-xl">
         <div className="absolute top-4 left-0 w-8 h-[2px] bg-white animate-[slide_1s_infinite_linear]" style={{ animationDelay: '0s' }} />
         <div className="absolute top-12 left-4 w-12 h-[2px] bg-accent animate-[slide_1.5s_infinite_linear]" style={{ animationDelay: '0.5s' }} />
         <div className="absolute top-20 left-2 w-6 h-[2px] bg-white animate-[slide_0.8s_infinite_linear]" style={{ animationDelay: '0.2s' }} />
      </div>

      <svg
        viewBox="0 0 16 16"
        className={`w-full h-full transition-transform duration-300 ${isJumping ? '-translate-y-4' : (frame === 1 ? '-translate-y-1' : '')}`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect x="5" y="1" width="6" height="2" fill={colors.hat1} />
        <rect x="4" y="2" width="1" height="2" fill={colors.hat1} />
        <rect x="11" y="2" width="1" height="2" fill={colors.hat1} />
        <rect x="5" y="0" width="2" height="1" fill={colors.hat2} />
        <rect x="9" y="0" width="2" height="1" fill={colors.hat2} />
        <rect x="5" y="3" width="6" height="4" fill="#fef3c7" />
        <rect x="5" y="4" width="7" height="2" fill="#1e293b" />
        <rect x="6" y="4" width="5" height="1" fill={colors.visor} />
        <rect x="5" y="7" width="6" height="5" fill={colors.jacket1} />
        <rect x="7" y="8" width="2" height="4" fill={colors.jacket2} />
        <rect x="4" y="7" width="1" height="4" fill={colors.jacket1} />
        {frame === 0 && !isJumping ? (
          <rect x="4" y="11" width="1" height="1" fill="#fef3c7" />
        ) : (
          <rect x="3" y="10" width="1" height="1" fill="#fef3c7" />
        )}
        <rect x="11" y="7" width="1" height="4" fill={colors.jacket1} />
        {frame === 0 && !isJumping ? (
          <rect x="11" y="11" width="1" height="1" fill="#fef3c7" />
        ) : (
          <rect x="12" y="10" width="1" height="1" fill="#fef3c7" />
        )}
        {frame === 0 && !isJumping ? (
          <>
            <rect x="5" y="12" width="2" height="3" fill={colors.pants} />
            <rect x="4" y="14" width="2" height="1" fill={colors.shoes} />
          </>
        ) : (
          <>
            <rect x="6" y="12" width="2" height="2" fill={colors.pants} />
            <rect x="7" y="13" width="2" height="1" fill={colors.shoes} />
          </>
        )}
        {frame === 0 && !isJumping ? (
          <>
            <rect x="9" y="12" width="2" height="2" fill={colors.pants} />
            <rect x="8" y="13" width="2" height="1" fill={colors.shoes} />
          </>
        ) : (
          <>
            <rect x="9" y="12" width="2" height="3" fill={colors.pants} />
            <rect x="9" y="14" width="2" height="1" fill={colors.shoes} />
          </>
        )}
      </svg>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide {
          from { transform: translateX(100px); }
          to { transform: translateX(-100px); }
        }
      `}} />
    </div>
  );
};

export default PixelWalker;
