export interface MotivoFile {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly source: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastOpenedAt: Date | null;
}

export interface FileDto {
  readonly id: string;
  readonly name: string;
  readonly source?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastOpenedAt: string | null;
}

export interface CreateFileInput {
  readonly name: string;
  readonly source: string;
}

export interface UpdateFileInput {
  readonly name?: string;
  readonly source?: string;
}
