import { SearchOptions, Settings } from '@algolia/client-search';
import { NodeData } from '../mdx-meta/recursive-parse-mdx';

export type SearchHit = { [key: string]: string };

interface DateFilter {
  key: keyof NodeData;
  value: string;
}

export type TransformedObject = {
  [key: string]: string | undefined;
};

export interface IndexQuery {
  transformer: (args: NodeData[]) => TransformedObject[];
  filters?: DateFilter[];
  indexName?: string;
  settings?: Settings;
  matchFields?: SearchOptions['attributesToRetrieve'];
}

export interface UpdateIndexOptions {
  allNodesData: NodeData[];
  enablePartialUpdates?: boolean;
  chunkSize?: number;
  indexQueries: IndexQuery[];
  contentRoot: string;
}
