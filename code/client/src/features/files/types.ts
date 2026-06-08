export interface UserFileSummary {
  kind: 'user';
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
  readOnly: false;
}

export interface UserFile extends UserFileSummary {
  source: string;
}

export interface ExampleFileSummary {
  kind: 'example';
  id: string;
  name: string;
  order: number;
  readOnly: true;
}

export interface ExampleFile extends ExampleFileSummary {
  source: string;
}

export interface ScratchDocument {
  kind: 'scratch';
  id: 'scratch';
  name: string;
  source: string;
  readOnly: false;
  persisted: false;
}

export interface UserDocument extends UserFile {
  persisted: true;
}

export interface ExampleDocument extends ExampleFile {
  persisted: false;
}

export type ActiveDocument = ScratchDocument | UserDocument | ExampleDocument;

export type TabSyncState = 'readonly' | 'out-of-sync' | 'saving' | 'synced';

export interface OpenDocumentTab {
  key: string;
  kind: ActiveDocument['kind'];
  id: string;
  name: string;
  readOnly: boolean;
  closable: boolean;
  syncState: TabSyncState;
}
