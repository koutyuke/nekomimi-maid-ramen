import { env } from "cloudflare:workers";
import { createApp } from "./app";

export default createApp({ webOrigin: env.WEB_ORIGIN });
