import { ZodMediaType } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import express from "express";
import {
  z,
  AnyZodObject,
  ZodObject,
  ZodError,
  ZodUnion,
  ZodRawShape,
  UnknownKeysParam,
  ZodTypeAny,
  objectOutputType,
  objectInputType,
} from "zod";
import type { OAuthFlowsObject } from "openapi3-ts/oas30";

// "apiKey" | "http" | "oauth2" | "openIdConnect"
export type RequestValidatorDefaultOptionType = {
  params?: AnyZodObject;
  body?: AnyZodObject | Partial<Record<ZodMediaType, AnyZodObject>>;
  query?: AnyZodObject;
  response?: AnyZodObject;
  security?: { name?: string } & (
    | { type: "basic" }
    | { type: "bearer"; bearerFormat?: string }
    | { type: "apiKey" }
    | { type: "oauth2"; flows: OAuthFlowsObject }
    | { type: "openIdConnect"; openIdConnectUrl: string }
  );
};

export type MediaType =
  | ZodMediaType
  | "multipart/form-data"
  | "application/x-www-form-urlencoded";

export type GenericZodObject = ZodObject<
  ZodRawShape,
  UnknownKeysParam,
  ZodTypeAny,
  objectOutputType<ZodRawShape, ZodTypeAny, UnknownKeysParam>,
  objectInputType<ZodRawShape, ZodTypeAny, UnknownKeysParam>
>;
export function requestValidator<
  P extends GenericZodObject = AnyZodObject,
  Q extends
    | GenericZodObject
    | ZodUnion<
        readonly [GenericZodObject, GenericZodObject, ...GenericZodObject[]]
      > = AnyZodObject,
  B extends
    | GenericZodObject
    | ZodUnion<
        readonly [GenericZodObject, GenericZodObject, ...GenericZodObject[]]
      > = AnyZodObject,
  ResBody extends GenericZodObject = AnyZodObject,
>(option: {
  params?: P;
  body?: B | Partial<Record<MediaType, B>>;
  query?: Q;
  response?: ResBody;
  security?: { name?: string } & (
    | { type: "basic" }
    | { type: "bearer"; bearerFormat?: string }
    | { type: "apiKey" }
    | { type: "oauth2"; flows: OAuthFlowsObject }
    | { type: "openIdConnect"; openIdConnectUrl: string }
  );
}) {
  const _handler = function (
    request: express.Request<
      z.infer<P>,
      z.infer<ResBody>,
      z.infer<B>,
      z.infer<Q>
    >,
    response: express.Response<z.infer<ResBody>>,
    next: express.NextFunction,
  ) {
    const { params, body, query } = option;
    try {
      params && params.parse(request.params);
      if (body instanceof z.ZodType) {
        body.parse(request.body);
      } else if (typeof body === "object") {
        Object.keys(body).forEach((key) => body?.[key]?.parse(request.body));
      }
      query && query.parse(request.query);
    } catch (err) {
      if (err instanceof ZodError) {
        throw err;
      }
      throw new Error("Bad Request");
    }
    next();
  };
  _handler.doc = option;
  return _handler;
}
