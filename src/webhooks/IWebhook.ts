import { Axios } from "axios";

export interface IWebhook {
  url: string;
  type: string;
  send(message: string): Promise<void>;
}

export interface IWebhookConstructor {
  url: string;
  axios: Axios;
}
