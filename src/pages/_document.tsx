import { DocumentProps, Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';

import i18nextConfig from '../../next-i18next.config';

type Props = DocumentProps & {
  //
};

export default function Document(props: Props) {
  const currentLocale =
    props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale;
  return (
    <Html lang={currentLocale}>
      <Head>
        {!!process.env.APP_BASE_ORIGIN && !!process.env.APP_BASE_PATH && (
          <base
            href={`${process.env.APP_BASE_ORIGIN}${process.env.APP_BASE_PATH}/`}
          ></base>
        )}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-title"
          content={process.env.NEXT_PUBLIC_APP_NAME || 'AI Dial'}
        ></meta>
        {!!process.env.THEMES_CONFIG_HOST && (
          <link rel="stylesheet" href={`api/themes-config`} />
        )}
        <link
          rel="icon"
          href={`api/themes-image?name=favicon`}
          sizes="any"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href={`api/themes-image?name=favicon`}
          type="image/png"
        />
      </Head>
      <body>
        <Script id="theme-script" strategy="beforeInteractive">
          {`{try {
            (document.documentElement.className =
              JSON.parse(localStorage.getItem('settings') || '{}').theme || '');
            } catch(e) { console.error(e); }}`}
        </Script>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
