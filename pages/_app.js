// pages/_app.js
import Head from 'next/head';
import '@/styles/globals.css';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>DolPick - 암호화폐 대시보드</title>
        <meta name="description" content="DolPick: Upbit 암호화폐 추천 및 대시보드 플랫폼. 실시간 시세, 포트폴리오 관리, 추천 코인" />
        <meta name="keywords" content="암호화폐, 비트코인, 이더리움, Upbit, 투자, 대시보드" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="DolPick - 암호화폐 대시보드" />
        <meta property="og:description" content="Upbit 암호화폐 추천 및 거래 대시보드" />
        <meta property="og:image" content="/favicon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DolPick" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
