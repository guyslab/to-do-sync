import { v4 as uuid } from "uuid";

export class EditionSession {
  readonly id: string;
  readonly expiresAt: Date;

  constructor(minutes = 3) {
    this.id = uuid();
    this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  }
}
