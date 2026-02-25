import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko" suppressHydrationWarning>
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="DolPick - 암호화폐 대시보드 및 추천 플랫폼" />
        <meta name="theme-color" content="#1a1a1a" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/logos/imdol-logo.png" />
        <link rel="apple-touch-icon" href="/logos/imdol-logo.png" />
        <link rel="shortcut icon" href="/logos/imdol-logo.png" />
        
        {/* 폰트 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
