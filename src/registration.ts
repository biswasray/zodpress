import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  ResponseConfig,
  ZodRequestBody,
  RouteConfig,
  ZodMediaTypeObject,
  extendZodWithOpenApi,
  ZodContentObject,
} from "@asteasolutions/zod-to-openapi";
import { RouteParameter } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import { OpenAPIObjectConfig } from "@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator";
import { z, ZodType } from "zod";
interface SecurityRequirementObject {
  [name: string]: string[];
}
// class ZodPressRouteConfig {
//   config: Omit<RouteConfig, "method" | "path">;
//   constructor(options: {
//     tags: string[];
//     description?: string;
//     summary?: string;
//     security?:
//       | SecurityRequirementObject[]
//       | SecurityRequirementObject[]
//       | undefined;
//     request: {
//       body?: ZodContentObject;
//       params?: RouteParameter;
//       query?: RouteParameter;
//       cookies?: RouteParameter;
//       headers?: RouteParameter | ZodType<unknown>[];
//     };
//     responses: {
//       [statusCode: number]: ZodContentObject;
//     };
//   }) {
//     const {
//       tags = undefined,
//       description = "TODO",
//       summary = "TODO",
//       security = undefined,
//     } = options;
//     this.config = {
//       tags,
//       description,
//       summary,
//       security
//     };
//   }
// }

// class ZodPressRouteConfig {
//     config: Omit<RouteConfig, "method" | "path">;
//   constructor(options) {

//   }
// }
const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// registry.registerPath({
//   method: "get",
//   path: "/users/{id}",
//   tags: ["User"],
//   description: "Get user data by its id",
//   summary: "Get a single user",
//   security: [{ [bearerAuth.name]: [] }],
//   request: {
//     params: z.object({ id: UserIdSchema }),
//   },
//   responses: {
//     200: {
//       description: "Object with user data.",
//       content: {
//         "application/json": {
//           schema: UserSchema,
//         },
//       },
//     },
//     204: {
//       description: "No content - successful operation",
//     },
//   },
// });
