import { AppError } from "../errors/app-error";

/** The object store failed or could not be reached. The message never carries bucket names, keys or provider details. */
export class StorageUnavailableError extends AppError {
  constructor(message = "File storage is not available right now") {
    super("unavailable", "STORAGE_UNAVAILABLE", message);
  }
}
