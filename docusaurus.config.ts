import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
const remarkMath = require('remark-math');
const rehypeKatex = require('rehype-katex');

const isProd = process.env.NODE_ENV === 'production';

const config: Config = {
  title: 'Prof',
  tagline: 'Prof by Lex AI – community-driven platform for Machine Learning, Deep Learning, and Language Models',
  favicon: 'img/lexailogo.svg',

  url: process.env.SITE_URL || (isProd ? 'https://prof-lexai.vercel.app' : 'http://localhost:3001'),
  baseUrl: '/',

  organizationName: 'rachit-k12',
  projectName: 'docusaurus-lexailabs',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  customFields: {
    apiUrl: process.env.API_URL || 'https://lexai-auth-service-747134511273.asia-south2.run.app',
    mainPlatformUrl: process.env.MAIN_PLATFORM_URL || 'https://prof-lexai.vercel.app',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'courses',
          path: './docs',
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    navbar: {
      title: 'Prof',
      logo: {
        alt: 'Prof by Lex AI',
        src: 'img/lexailogo.svg',
        href: isProd ? 'https://prof-lexai.vercel.app/' : '/',
        target: '_self',
      },
      items: [],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} Lex AI Technologies Pvt Ltd.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'r', 'julia'],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    stylesheets: [
      {
        href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
        type: 'text/css',
        crossorigin: 'anonymous',
      },
      {
        href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Lora:wght@400;500;600;700&display=swap',
        type: 'text/css',
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;
