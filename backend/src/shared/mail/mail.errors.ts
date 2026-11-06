/** The mail server did not accept the message (wrong app password, unreachable, refused). Carries no address or message text. */
export class MailUnavailableError extends Error {
  constructor() {
    super("The mail server could not send the message");
    this.name = "MailUnavailableError";
  }
}
