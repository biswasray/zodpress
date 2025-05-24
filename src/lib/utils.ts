import { OAuthFlowsObject, SecuritySchemeObject } from "openapi3-ts/oas30";

export function capitalize(str: string | undefined) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function convertRoute(route: string): string {
  return route.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
}
// export function getMainPath(str: string) {
//   const regex = /^\/([^?/]+)/;
//   return str.match(regex)?.[1];
// }
export function getMainPath(str: string) {
  const pathWithoutQuery = str.split("?")[0];
  const segments = pathWithoutQuery.split("/").filter(Boolean);
  return segments.at(-1); // gets the last segment
}

export function createSecuritySchemeObject(
  security?: { name?: string } & (
    | { type: "basic" }
    | { type: "bearer"; bearerFormat?: string }
    | { type: "apiKey" }
    | { type: "oauth2"; flows: OAuthFlowsObject }
    | { type: "openIdConnect"; openIdConnectUrl: string }
  ),
): SecuritySchemeObject | undefined {
  if (!security) {
    return undefined;
  }
  switch (security.type) {
    case "basic":
      return { type: "http", scheme: "basic" };
    case "bearer":
      return {
        type: "http",
        scheme: "bearer",
        bearerFormat: security.bearerFormat,
      };
    case "apiKey":
      return { type: "apiKey", name: security.name, in: "header" };
    case "oauth2":
      return { type: "oauth2", flows: security.flows };
    case "openIdConnect":
      return {
        type: "openIdConnect",
        openIdConnectUrl: security.openIdConnectUrl,
      };
    default:
      throw new Error("Unsupported security type");
  }
}
