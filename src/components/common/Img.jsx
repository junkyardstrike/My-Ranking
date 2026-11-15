import { useImage } from '../../lib/images';

// 画像キーから画像を表示する。thumb=true（既定）なら一覧用の縮小画像
export default function Img({ k, thumb = true, alt = '', ...rest }) {
  const src = useImage(k, { thumb });
  return <img loading="lazy" decoding="async" alt={alt} src={src} {...rest} />;
}
