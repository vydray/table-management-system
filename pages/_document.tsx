import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* PWA設定 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff9800" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* Android用の追加設定 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="テーブル管理" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}