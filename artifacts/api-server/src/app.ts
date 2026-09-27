import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { bindRequestContext } from "./server/request";
import { getStorage, MEDIA_KEY } from "./server/storage";
import { contentTypeFor } from "./server/media";

const app: Express = express();

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bindRequestContext);

app.get("/media/*key", async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key.join("/") : String(req.params.key ?? "");
  if (!MEDIA_KEY.test(key)) {
    res.sendStatus(404);
    return;
  }
  const body = await getStorage().get(key);
  if (!body) {
    res.sendStatus(404);
    return;
  }
  res.set({
    "Content-Type": contentTypeFor(key),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Security-Policy": "default-src 'none'",
  });
  res.send(body);
});

app.use("/api", router);

export default app;
