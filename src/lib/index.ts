import express from "express";
import swaggerUi from "swagger-ui-express";
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
  RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import { MediaType, RequestValidatorDefaultOptionType } from "./validations";
import { OpenAPIObjectConfig } from "@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator";
import { z } from "zod";

extendZodWithOpenApi(z);

type Method =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "trace";
type ZodPressDocType = {
  tags?: string[];
  path: string;
  method: Method;
  data: RequestValidatorDefaultOptionType;
};

function getOpenApiDocumentation(
  registry: OpenAPIRegistry,
  config: OpenAPIObjectConfig,
) {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument(config);
}
function capitalize(str: string | undefined) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function convertRoute(route: string): string {
  return route.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
}
function getMainPath(str: string) {
  const regex = /^\/([^?/]+)/;
  return str.match(regex)?.[1];
}

function _zodpress() {
  const app = express();
  const registry = new OpenAPIRegistry();

  const docs = [] as ZodPressDocType[];
  const Use: typeof app.use = function (path: unknown, ...handlers: unknown[]) {
    const tag =
      typeof path === "string" ? capitalize(getMainPath(path)) : undefined;
    if (typeof path === "string") {
      for (const handler of handlers) {
        if (
          (typeof handler === "function" || typeof handler === "object") &&
          handler &&
          "docs" in handler &&
          typeof handler.docs === "object" &&
          Array.isArray(handler.docs)
        ) {
          for (const childDoc of handler.docs) {
            docs.push({
              tags: childDoc.tags || (tag ? [tag] : undefined),
              path: path + childDoc.path,
              method: childDoc.method,
              data: childDoc.data,
            });
          }
        }
      }
    }
    return app.use(
      path as Parameters<typeof app.use>["0"],
      ...(handlers as Parameters<typeof app.use>["1"][]),
    );
  };
  const Get: typeof app.get = function (path: unknown, ...handlers: unknown[]) {
    if (typeof path === "string") {
      for (const handler of handlers) {
        if (
          (typeof handler === "function" || typeof handler === "object") &&
          handler &&
          "doc" in handler &&
          typeof handler.doc === "object" &&
          handler.doc
        ) {
          docs.push({
            path: path,
            method: "get",
            data: handler.doc,
          });
        }
      }
    }
    return app.get(
      path as Parameters<typeof app.get>["0"],
      ...(handlers as Parameters<typeof app.get>["1"][]),
    );
  };
  const Post: typeof app.post = function (
    path: unknown,
    ...handlers: unknown[]
  ) {
    if (typeof path === "string") {
      for (const handler of handlers) {
        if (
          (typeof handler === "function" || typeof handler === "object") &&
          handler &&
          "doc" in handler &&
          typeof handler.doc === "object" &&
          handler.doc
        ) {
          docs.push({
            path: path,
            method: "post",
            data: handler.doc,
          });
        }
      }
    }
    return app.post(
      path as Parameters<typeof app.post>["0"],
      ...(handlers as Parameters<typeof app.post>["1"][]),
    );
  };
  const Listen = function (
    port: number | string,
    openAPIObjectConfig: OpenAPIObjectConfig,
    ...args: unknown[]
  ) {
    // console.log("docs", docs);
    for (const doc of docs) {
      const _route: RouteConfig = {
        tags: doc.tags,
        path: convertRoute(doc.path),
        method: doc.method,
        request: {
          params: doc.data.params,
          query: doc.data.query,
          // body: doc.data.body
          //   ? {
          //       required: !!doc.data.body,
          //       content: {
          //         "application/json": { schema: doc.data.body },
          //       },
          //     }
          //   : undefined,
        },
        responses: {
          200: {
            description: "Successful response",
            content: doc.data.response
              ? {
                  "application/json": {
                    schema: doc.data.response,
                  },
                }
              : undefined,
          },
        },
      };
      if (_route.request) {
        if (doc.data.body instanceof z.ZodType) {
          _route.request.body = {
            required: !!doc.data.body,
            content: {
              "application/json": { schema: doc.data.body },
            },
          };
        } else if (doc.data.body) {
          for (const _mediaType in doc.data.body) {
            const mediaType = _mediaType as MediaType;
            const _schema = doc.data.body[mediaType];
            if (_schema) {
              _route.request.body = {
                required: !!_schema,
                content: {
                  [mediaType]: { schema: _schema },
                },
              };
            }
          }
        }
      }

      registry.registerPath(_route);
    }

    const swaggerDocument = getOpenApiDocumentation(
      registry,
      openAPIObjectConfig,
    );
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    return app.listen(port, ...(args as Parameters<typeof app.listen>["1"][]));
  };
  return Object.assign(app, { Use, Get, Post, Listen });
}

const zodpress = Object.assign(_zodpress, express);

export const Router = function Router(options?: express.RouterOptions) {
  const router = express.Router(options);
  const docs = [] as ZodPressDocType[];
  const Use: typeof router.use = function (
    path: unknown,
    ...handlers: unknown[]
  ) {
    const tag =
      typeof path === "string" ? capitalize(getMainPath(path)) : undefined;
    if (typeof path === "string") {
      for (const handler of handlers) {
        if (
          (typeof handler === "function" || typeof handler === "object") &&
          handler &&
          "docs" in handler &&
          typeof handler.docs === "object" &&
          Array.isArray(handler.docs)
        ) {
          for (const childDoc of handler.docs) {
            docs.push({
              tags: childDoc.tags || (tag ? [tag] : undefined),
              path: path + childDoc.path,
              method: childDoc.method,
              data: childDoc.data,
            });
          }
        }
      }
    }
    return router.use(
      path as Parameters<typeof router.use>["0"],
      ...(handlers as Parameters<typeof router.use>["1"][]),
    );
  };

  const Get: typeof router.get = function (
    path: unknown,
    ...handlers: unknown[]
  ) {
    if (typeof path === "string") {
      for (const handler of handlers) {
        if (
          (typeof handler === "function" || typeof handler === "object") &&
          handler &&
          "doc" in handler &&
          typeof handler.doc === "object" &&
          handler.doc
        ) {
          docs.push({
            path: path,
            method: "get",
            data: handler.doc,
          });
        }
      }
    }
    return router.get(
      path as Parameters<typeof router.get>["0"],
      ...(handlers as Parameters<typeof router.get>["1"][]),
    );
  };
  const Post: typeof router.post = function (
    path: unknown,
    ...handlers: unknown[]
  ) {
    if (typeof path === "string") {
      for (const handler of handlers) {
        if (
          (typeof handler === "function" || typeof handler === "object") &&
          handler &&
          "doc" in handler &&
          typeof handler.doc === "object" &&
          handler.doc
        ) {
          docs.push({
            path: path,
            method: "post",
            data: handler.doc,
          });
        }
      }
    }
    return router.post(
      path as Parameters<typeof router.post>["0"],
      ...(handlers as Parameters<typeof router.post>["1"][]),
    );
  };
  return Object.assign(router, {
    Use,
    Get,
    Post,
    docs,
  });
};

export default zodpress;
