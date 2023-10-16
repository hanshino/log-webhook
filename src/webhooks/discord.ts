import { IWebhook, IWebhookConstructor } from "./IWebhook";

export class Discord implements IWebhook {
  public readonly type = "discord";
  public readonly url;
  private readonly axios;

  constructor(options: IWebhookConstructor) {
    this.url = options.url;
    this.axios = options.axios;
  }

  async send(message: string): Promise<void> {
    try {
      await this.axios.post(this.url, { content: message });
    } catch (e) {
      console.error(e);
    }
  }
}
