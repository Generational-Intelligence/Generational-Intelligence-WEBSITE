import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (isProduction) {
  app.use("/api/studio", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
} else {
  app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
  app.use(clerkMiddleware());
}

app.use("/api", router);

export default app;
