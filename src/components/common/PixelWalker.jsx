import React, { useState, useEffect } from 'react';

const PALETTES = [
  { p1: '#fbbf24', p2: '#f59e0b', p3: '#38bdf8', p4: '#fcd34d', p5: '#ffffff' },
  { p1: '#0ea5e9', p2: '#0284c7', p3: '#f43f5e', p4: '#38bdf8', p5: '#ffffff' },
  { p1: '#10b981', p2: '#059669', p3: '#fbbf24', p4: '#34d399', p5: '#ffffff' },
  { p1: '#ec4899', p2: '#be185d', p3: '#38bdf8', p4: '#f472b6', p5: '#ffffff' },
  { p1: '#f43f5e', p2: '#e11d48', p3: '#34d399', p4: '#fb7185', p5: '#ffffff' },
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

const PixelWalker = ({ className = "", stats = { totalCount: 0, hallOfFameCount: 0, totalHours: 0 } }) => {
  const [frame, setFrame] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [quote, setQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    const frameTimer = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 250);

    const quoteTimer = setInterval(() => {
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
      setPaletteIndex((prev) => (prev + 1) % PALETTES.length);
    }, 15000);

    return () => {
      clearInterval(frameTimer);
      clearInterval(quoteTimer);
    };
  }, []);

  const handleJump = () => {
    if (isJumping) return;
    setIsJumping(true);
    
    const nextQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(nextQuote);
    setPaletteIndex((prev) => (prev + 1) % PALETTES.length);

    setTimeout(() => {
      setIsJumping(false);
    }, 600);
  };

  const c = PALETTES[paletteIndex];

  // Equipment logic based on stats
  const hasSword = stats.totalCount >= 30;
  const hasMantle = stats.hallOfFameCount >= 3;
  const hasStaff = stats.totalHours >= 50;

  // Base look variation based on totalCount
  const baseLook = stats.totalCount < 20 ? 0 : stats.totalCount < 50 ? 1 : 2;

  const renderCharacter = () => {
    return (
      <>
        {/* Mantle (Back) */}
        {hasMantle && (
          <>
            <rect x="4" y="6" width="8" height="7" fill="#be185d" />
            <rect x="3" y="7" width="10" height="5" fill="#9d174d" />
          </>
        )}

        {/* Hair - Variation */}
        {baseLook === 0 && (
          <>
            <rect x="5" y="1" width="6" height="2" fill={c.p1} />
            <rect x="4" y="2" width="1" height="2" fill={c.p1} />
            <rect x="11" y="2" width="1" height="2" fill={c.p1} />
          </>
        )}
        {baseLook === 1 && (
          <>
            <rect x="4" y="1" width="8" height="2" fill="#4a3728" />
            <rect x="3" y="2" width="1" height="5" fill="#4a3728" />
            <rect x="12" y="2" width="1" height="5" fill="#4a3728" />
            <rect x="4" y="3" width="8" height="1" fill="#4a3728" />
          </>
        )}
        {baseLook === 2 && (
          <>
            <rect x="5" y="0" width="1" height="2" fill="#fbbf24" />
            <rect x="7" y="0" width="1" height="2" fill="#fbbf24" />
            <rect x="9" y="0" width="1" height="2" fill="#fbbf24" />
            <rect x="5" y="1" width="6" height="2" fill="#d97706" />
            <rect x="4" y="2" width="8" height="1" fill="#d97706" />
          </>
        )}

        {/* Face */}
        <rect x="5" y="3" width="6" height="4" fill="#fef3c7" />
        <rect x="5" y="4" width="7" height="2" fill="#1e293b" />
        <rect x="6" y="4" width="5" height="1" fill={c.p3} />
        
        {/* Body - Variation */}
        {baseLook === 0 && (
           <rect x="5" y="7" width="6" height="5" fill={c.p1} />
        )}
        {baseLook === 1 && (
           <>
             <rect x="5" y="7" width="6" height="5" fill="#1e40af" />
             <rect x="7" y="7" width="2" height="5" fill="#ffffff" opacity="0.3" />
           </>
        )}
        {baseLook === 2 && (
           <>
             <rect x="5" y="7" width="6" height="5" fill="#1e293b" />
             <rect x="5" y="7" width="1" height="5" fill="#fbbf24" />
             <rect x="10" y="7" width="1" height="5" fill="#fbbf24" />
             <rect x="7" y="9" width="2" height="1" fill="#fbbf24" />
           </>
        )}

        <rect x="7" y="8" width="2" height="4" fill={c.p5} />
        <rect x="4" y="7" width="1" height="4" fill={c.p1} />
        <rect x={frame === 0 ? 4 : 3} y={frame === 0 ? 11 : 10} width="1" height="1" fill="#fef3c7" />
        <rect x="11" y="7" width="1" height="4" fill={c.p1} />
        <rect x={frame === 0 ? 11 : 12} y={frame === 0 ? 11 : 10} width="1" height="1" fill="#fef3c7" />
        <rect x={frame === 0 ? 5 : 6} y="12" width="2" height={frame === 0 ? 3 : 2} fill="#312e81" />
        <rect x={frame === 0 ? 4 : 7} y={frame === 0 ? 14 : 13} width="2" height="1" fill="#000" />
        <rect x={frame === 0 ? 9 : 9} y="12" width="2" height={frame === 0 ? 2 : 3} fill="#312e81" />
        <rect x={frame === 0 ? 8 : 9} y={frame === 0 ? 13 : 14} width="2" height="1" fill="#000" />

        {/* Sword (Lv 2) */}
        {hasSword && (
          <g transform={`translate(${frame === 0 ? -1 : -2}, ${frame === 0 ? 0 : -1})`}>
            <rect x="2" y="5" width="1" height="6" fill="#94a3b8" />
            <rect x="1" y="10" width="3" height="1" fill="#475569" />
            <rect x="2" y="11" width="1" height="1" fill="#94a3b8" />
          </g>
        )}

        {/* Staff (Lv 4) */}
        {hasStaff && (
          <g transform={`translate(${frame === 0 ? 2 : 3}, ${frame === 0 ? 0 : -1})`}>
            <rect x="12" y="4" width="1" height="8" fill="#78350f" />
            <rect x="11" y="2" width="3" height="2" fill="#fbbf24">
              <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
            </rect>
          </g>
        )}
      </>
    );
  };

  return (
    <div className={`relative ${className} w-24 h-24 cursor-pointer`} onClick={handleJump}>
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
      <svg viewBox="0 0 16 16" className={`w-full h-full transition-all duration-300 ${isJumping ? '-translate-y-4 scale-110' : (frame === 1 ? '-translate-y-1' : '')}`} style={{ shapeRendering: 'crispEdges' }}>
        {renderCharacter()}
      </svg>
    </div>
  );
};

export default PixelWalker;
