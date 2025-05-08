import { v4 as uuid } from "uuid";
import config from "../config/config";

export class EditionSession {
  readonly id: string;
  readonly expiresAt: Date;

  constructor(minutes = config.edition.expirationMinutes) {
    this.id = uuid();
    this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  }
}
