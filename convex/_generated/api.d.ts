/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as booking from "../booking.js";
import type * as categories from "../categories.js";
import type * as galleries from "../galleries.js";
import type * as http from "../http.js";
import type * as media from "../media.js";
import type * as migrations from "../migrations.js";
import type * as model_booking from "../model/booking.js";
import type * as model_users from "../model/users.js";
import type * as seed from "../seed.js";
import type * as site from "../site.js";
import type * as uploads from "../uploads.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  booking: typeof booking;
  categories: typeof categories;
  galleries: typeof galleries;
  http: typeof http;
  media: typeof media;
  migrations: typeof migrations;
  "model/booking": typeof model_booking;
  "model/users": typeof model_users;
  seed: typeof seed;
  site: typeof site;
  uploads: typeof uploads;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
