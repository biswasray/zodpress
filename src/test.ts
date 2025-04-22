/* eslint-disable no-console */
import { z } from "zod";
import fileUpload from "express-fileupload";
import zodpress, { Router } from "./lib";
import { requestValidator } from "./lib/validations";

const app = zodpress();

app.use(zodpress.json());
app.use(zodpress.urlencoded({ extended: true }));
app.use(fileUpload());

const userRouter = Router();

userRouter.Post(
  "/",
  requestValidator({
    body: {
      "multipart/form-data": z.object({
        text: z.string(),
        image: z.custom<fileUpload.UploadedFile>().openapi({
          type: "string",
          description: "The image to classify",
          format: "binary",
        }),
      }),
    },
  }),
  (req, res) => {
    res.json({ message: `User, ${JSON.stringify(req.body)}!` });
  },
);
userRouter.Get(
  "/:id",
  requestValidator({
    params: z.object({
      id: z.string(),
    }),
  }),
  (req, res) => {
    res.json({ message: `User , ${JSON.stringify(req.query)}!` });
  },
);

const postRouter = Router();

postRouter.Post(
  "/",
  requestValidator({
    body: {
      "multipart/form-data": z.object({
        text: z.string(),
        image: z.custom<fileUpload.UploadedFile>().openapi({
          type: "string",
          description: "The image to classify",
          format: "binary",
        }),
      }),
    },
  }),
  (req, res) => {
    res.json({ message: `Post, ${JSON.stringify(req.body)}!` });
  },
);
postRouter.Get(
  "/:id",
  requestValidator({
    params: z.object({
      id: z.string(),
    }),
  }),
  (req, res) => {
    res.json({ message: `Post, ${JSON.stringify(req.query)}!` });
  },
);

userRouter.Use("/post", postRouter);

app.Use("/user", userRouter);

app.Get(
  "/test",
  requestValidator({
    query: z.object({
      name: z.string(),
    }),
    response: z.object({
      status: z.boolean(),
      message: z.string(),
      content: z.object({}).nullish(),
    }),
  }),
  (req, res) => {
    res.json({
      message: `Hello, ${req.query.name}!`,
      status: true,
    });
  },
);

app.Listen(
  9888,
  {
    openapi: "3.0.0",
    info: {
      title: "Test API",
      version: "1.0.0",
      description: "Testing Zodpress library",
    },
  },
  () => {
    console.log("Server is running on port 9888");
  },
);
