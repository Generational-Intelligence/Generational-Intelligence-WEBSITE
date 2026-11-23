import { ReplitConnectors } from "@replit/connectors-sdk";

/**
 * Outbound notification transport. Kept behind a small object so automated
 * tests can replace `send` and never deliver real email.
 */
export const mailer = {
  async send(rawMessage: string): Promise<void> {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: rawMessage }),
      },
    );
    if (!response.ok) {
      throw new Error(`Gmail delivery failed with status ${response.status}`);
    }
  },
};
