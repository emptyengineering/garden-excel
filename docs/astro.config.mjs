import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Excelwind',
      description: 'JSX-based Excel generator for Node.js.',
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
            { label: 'Components', link: '/components/' },
            { label: 'Styling', link: '/styling/' },
            { label: 'Properties', link: '/properties/' },
            { label: 'Format', link: '/format/' },
            { label: 'Formula', link: '/formula/' },
            { label: 'Processors', link: '/processors/' },
            { label: 'Templates', link: '/templates/' },
            { label: 'Images', link: '/images/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API', link: '/api/' },
            { label: 'Examples', link: '/examples/' },
            { label: 'Kitchen Sink', link: '/kitchen-sink/' },
          ],
        },
      ],
    }),
  ],
});
