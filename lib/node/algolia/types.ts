interface AlgoliaHighlightResult {
  matchLevel: string;
  matchedWords: string[];
  value: string;
}

export interface AlgoliaConnectorHit {
  connectorSection: string;
  id: string;
  imageIcon?: string;
  section: string;
  slug: string;
  title?: string;
  type: string;
  streamlineIcon?: string;
  connectorName?: string;
  description?: string;
  excerpt?: string;
  objectID?: string;
  _highlightResult?: {
    connectorName: AlgoliaHighlightResult;
    connectorSection: AlgoliaHighlightResult;
    description: AlgoliaHighlightResult;
  };
}

export interface AlgoliaTopArticleHit {
  connectorSection: string;
  id: string;
  imageIcon?: string;
  section: string;
  slug: string;
  title?: string;
  type: string;
  streamlineIcon?: string;
  description?: string;
  excerpt?: string;
  objectID?: string;
  _highlightResult?: {
    connectorName: AlgoliaHighlightResult;
    connectorSection: AlgoliaHighlightResult;
    description: AlgoliaHighlightResult;
  };
}
