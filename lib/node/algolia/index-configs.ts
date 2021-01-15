import { NodeData } from '../mdx-meta/create-mdx-node-data-model';

const algoliaIndexConfigs = [
  {
    transformer: (nodeDatas: NodeData[]) =>
      nodeDatas.map((nodeData) => ({
        id: nodeData.id,
        title: nodeData.title,
        description: (nodeData.description ?? '').substring(0, 5000),
        tags: nodeData.tags,
        content: nodeData.content.substring(0, 10000),
        excerpt: nodeData.excerpt,
        section: nodeData.section,
        slug: nodeData.slug,
        type: nodeData.type,
        connectorSection: nodeData.connectorSection,
        imageIcon: nodeData.imageIcon,
        streamlineIcon: nodeData.streamlineIcon,
      })),
    indexName: process.env.ALGOLIA_INDEX_NAME,
    settings: {
      attributesForFaceting: ['type', 'slug', 'filterOnly(section)'],
      searchableAttributes: [
        'title',
        'content',
        'description',
        'tags',
        'section',
      ],
    },
  },
  {
    transformer: (nodeDatas: NodeData[]) =>
      nodeDatas
        .filter((nodeData) => nodeData.type === 'connector')
        .map((nodeData) => ({
          id: nodeData.id,
          title: nodeData.title,
          description: nodeData.description,
          excerpt: nodeData.excerpt,
          section: nodeData.section,
          slug: nodeData.slug,
          type: nodeData.type,
          connectorSection: nodeData.connectorSection,
          imageIcon: nodeData.imageIcon,
          streamlineIcon: nodeData.streamlineIcon,
          connectorName: nodeData.connector,
        })),
    indexName: process.env.ALGOLIA_CONNECTORS_INDEX_NAME,
    settings: {
      attributesForFaceting: ['type', 'filterOnly(connectorName)'],
      ranking: ['asc(title)'],
    },
  },
];

export default algoliaIndexConfigs;
