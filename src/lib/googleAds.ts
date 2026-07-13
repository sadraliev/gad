import { GoogleAdsApi, Customer } from "google-ads-api";
import { readClientSecret, readCredentials } from "./credentials.js";
import { readConfig, type Config } from "./config.js";

export interface ResolvedClient {
  customer: Customer;
  config: Config;
}

/**
 * Constructs an authenticated google-ads-api Customer from persisted state:
 * developer_token and customer_id from config, refresh_token from credentials,
 * client_id/client_secret from client_secret.json.
 */
export async function resolveCustomer(): Promise<ResolvedClient> {
  const config = await readConfig();
  const creds = await readCredentials();
  const cs = await readClientSecret();

  if (!config.developer_token) {
    throw new Error(
      "developer_token not set. Run `gad config set developer_token <token>`.",
    );
  }
  if (!config.customer_id) {
    throw new Error(
      "customer_id not set. Run `gad config set customer_id <10-digit-id>`.",
    );
  }
  if (!creds) {
    throw new Error("Not logged in. Run `gad auth login` first.");
  }

  const api = new GoogleAdsApi({
    client_id: cs.client_id,
    client_secret: cs.client_secret,
    developer_token: config.developer_token,
  });

  const customer = api.Customer({
    customer_id: config.customer_id,
    login_customer_id: config.login_customer_id ?? config.customer_id,
    refresh_token: creds.refresh_token,
  });

  return { customer, config };
}
