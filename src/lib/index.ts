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
import {
  capitalize,
  convertRoute,
  createSecuritySchemeObject,
  getMainPath,
} from "./utils";

extendZodWithOpenApi(z);

export type Method =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "trace";
export type ZodPressDocType = {
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

function routeBuilder<M extends Method>(
  router: express.IRouter,
  method: M,
  docs: ZodPressDocType[],
): express.IRouter[M] {
  return function (path: unknown, ...handlers: unknown[]) {
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
            method: method,
            data: handler.doc,
          });
        }
      }
    }

    // router.get()

    return router[method](
      path as Parameters<(typeof router)[M]>[0],
      ...(handlers as Parameters<(typeof router)[M]>[1][]),
    );
  };
}

function useBuilder(
  router: express.IRouter,
  docs: ZodPressDocType[],
): express.IRouter["use"] {
  return function (path: unknown, ...handlers: unknown[]) {
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
}

function _zodpress() {
  const app = express();
  const registry = new OpenAPIRegistry();

  const docs = [] as ZodPressDocType[];
  const Use = useBuilder(app, docs);
  const Get = routeBuilder(app, "get", docs);
  const Post = routeBuilder(app, "post", docs);
  const Put = routeBuilder(app, "put", docs);
  const Patch = routeBuilder(app, "patch", docs);
  const Delete = routeBuilder(app, "delete", docs);
  const Head = routeBuilder(app, "head", docs);
  const Options = routeBuilder(app, "options", docs);
  const Trace = routeBuilder(app, "trace", docs);

  const Listen = function (
    port: number | string,
    openAPIObjectConfig: OpenAPIObjectConfig,
    ...args: unknown[]
  ) {
    // console.log("docs", docs);
    for (const doc of docs) {
      const securitySchemes = createSecuritySchemeObject(doc.data.security);

      const _route: RouteConfig = {
        tags: doc.tags,
        path: convertRoute(doc.path),
        method: doc.method,
        request: {
          params: doc.data.params,
          query: doc.data.query,
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
      if (securitySchemes) {
        const authComponent = registry.registerComponent(
          "securitySchemes",
          doc.data.security?.name ?? "SecuritySchema",
          securitySchemes,
        );
        _route.security = [{ [authComponent.name]: [] }];
      }
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
  return Object.assign(app, {
    Use,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Head,
    Options,
    Trace,
    Listen,
  });
}

// export const zodpress = Object.assign(_zodpress, express);

export const Router = function Router(options?: express.RouterOptions) {
  const router = express.Router(options);
  const docs = [] as ZodPressDocType[];

  const Use = useBuilder(router, docs);

  const Get = routeBuilder(router, "get", docs);
  const Post = routeBuilder(router, "post", docs);
  const Put = routeBuilder(router, "put", docs);
  const Patch = routeBuilder(router, "patch", docs);
  const Delete = routeBuilder(router, "delete", docs);
  const Head = routeBuilder(router, "head", docs);
  const Options = routeBuilder(router, "options", docs);
  const Trace = routeBuilder(router, "trace", docs);

  return Object.assign(router, {
    Use,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Head,
    Options,
    Trace,
    docs,
  });
};

_zodpress.Router = Router;

const { Router: _r, ...restExpress } = express;
_r;

export const zodpress = Object.assign(_zodpress, restExpress);
