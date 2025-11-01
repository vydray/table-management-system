import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* PWA設定 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff9800" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* ArtPad PRO固定解像度 */}
        <meta name="viewport" content="width=2176, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        {/* Android用の追加設定 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="POS System" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}