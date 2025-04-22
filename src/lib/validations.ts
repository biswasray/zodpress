/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodMediaType } from "@asteasolutions/zod-to-openapi/dist/openapi-registry";
import express from "express";
import { z, AnyZodObject, ZodObject, ZodError, ZodUnion } from "zod";
export type RequestValidatorDefaultOptionType = {
  params?: AnyZodObject;
  body?: AnyZodObject | Partial<Record<ZodMediaType, AnyZodObject>>;
  query?: AnyZodObject;
  response?: AnyZodObject;
};

export type MediaType =
  | ZodMediaType
  | "multipart/form-data"
  | "application/x-www-form-urlencoded";
export function requestValidator<
  P extends ZodObject<any, any, any, any, any> = AnyZodObject,
  Q extends
    | ZodObject<any, any, any, any, any>
    | ZodUnion<
        readonly [ZodObject<any>, ZodObject<any>, ...ZodObject<any>[]]
      > = AnyZodObject,
  B extends
    | ZodObject<any, any, any, any, any>
    | ZodUnion<
        readonly [ZodObject<any>, ZodObject<any>, ...ZodObject<any>[]]
      > = AnyZodObject,
  ResBody extends ZodObject<any, any, any, any, any> = AnyZodObject,
>(option: {
  params?: P;
  body?: B | Partial<Record<MediaType, B>>;
  query?: Q;
  response?: ResBody;
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
