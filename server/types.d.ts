import { UnitOfWork } from "./src/domain/unit-of-work";

declare global {
  namespace Express {
    interface Request {
      unitOfWork?: UnitOfWork;
    }
  }
}
