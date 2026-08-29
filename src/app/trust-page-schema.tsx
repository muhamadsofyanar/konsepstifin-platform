import JsonLd from './json-ld';

export default function TrustPageSchema({
  path,
  name,
  description,
  type = 'WebPage',
}: {
  path: string;
  name: string;
  description: string;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage';
}) {
  const url = `https://konsepstifin.com${path}`;
  return <JsonLd data={{
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://konsepstifin.com/' }, { '@type': 'ListItem', position: 2, name, item: url }] },
      { '@type': type, name, description, url, inLanguage: 'id-ID', isPartOf: { '@id': 'https://konsepstifin.com/#website' } },
    ],
  }} />;
}
