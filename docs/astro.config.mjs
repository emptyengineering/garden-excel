import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

const disableStarlightSitemap = {
  name: '@astrojs/sitemap',
  hooks: {},
};

export default defineConfig({
  site: 'https://gavin-lynch.github.io',
  base: '/excelwind',
  integrations: [
    disableStarlightSitemap,
    starlight({
      title: 'Excelwind',
      description: 'JSX-based Excel generator for Node.js.',
      logo: {
        dark: './public/branding/logo-dark.png',
        light: './public/branding/logo-light.png',
        alt: 'Excelwind logo',
        replacesTitle: false,
      },
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://gavin-lynch.github.io/excelwind/branding/logo-dark.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://gavin-lynch.github.io/excelwind/branding/logo-dark.png',
          },
        },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Overview', link: '/' },
            { label: 'Quick Start', link: '/quick-start/' },
          ],
        },
        {
          label: 'Core',
          items: [
            { label: 'Styling', link: '/styling/' },
            { label: 'Properties', link: '/properties/' },
            { label: 'Format', link: '/format/' },
            { label: 'Formula', link: '/formula/' },
            { label: 'Merges', link: '/merges/' },
            { label: 'Processors', link: '/processors/' },
            { label: 'Templates', link: '/templates/' },
            { label: 'Images', link: '/images/' },
          ],
        },
        {
          label: 'Components',
          items: [
            { label: 'Overview', link: '/components/' },
            { label: 'Workbook', link: '/components/workbook/' },
            { label: 'Worksheet', link: '/components/worksheet/' },
            { label: 'Column', link: '/components/column/' },
            { label: 'Row', link: '/components/row/' },
            { label: 'Cell', link: '/components/cell/' },
            { label: 'Group', link: '/components/group/' },
            { label: 'Image', link: '/components/image/' },
            { label: 'Template', link: '/components/template/' },
          ],
        },
        {
          label: 'Examples',
          items: [
            { label: 'Examples', link: '/examples/' },
            { label: 'Basic Example', link: '/examples/basic/' },
            { label: 'Styling Example', link: '/examples/styling/' },
            { label: 'Dynamic Data Example', link: '/examples/dynamic-data/' },
            { label: 'Processors Example', link: '/examples/processors/' },
            { label: 'Merged Cells Example', link: '/examples/merged-cells/' },
            { label: 'Templates Example', link: '/examples/templates/' },
            { label: 'Images Example', link: '/examples/images/' },
            { label: 'Complex Merge Example', link: '/examples/complex-merge/' },
            { label: 'Kitchen Sink', link: '/kitchen-sink/' },
          ],
        },
        {
          label: 'Reference',
          items: [{ label: 'API', link: '/api/' }],
        },
      ],
    }),
  ],
});
