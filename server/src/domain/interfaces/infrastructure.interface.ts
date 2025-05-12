export interface IdGenerator {
  create(): string;
}

export interface DataTransaction {
  register(typeName: string, id: string, data: any): void;
  commit(): Promise<void>;
}

export interface DataCollectionModifier {
  upsert<TData>(collection: string, id: string, data: TData): Promise<void>;
}

export interface DataCollectionQuerier {
  queryByLiteral<TData>(collection: string, literal: any): Promise<TData[]>;
}

export interface MessagesOutbox {
  register<TMsg>(msgType: string, msgPayload: TMsg): void;
  commit(): Promise<void>;
}

export interface MessagesPublisher {
  publish<TMsg>(msgType: string, msgPayload: TMsg): Promise<void>;
}

export interface UnitOfWork {
  commit(): Promise<void>;
}
