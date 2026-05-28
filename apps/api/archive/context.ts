// import type { Request, Response } from 'express';
// import { verifyAccessToken }      from '../services/auth.service.js';
// import type { JwtPayload }        from '../services/auth.service.js';
// import { env, isProd }            from '../config/env.js';

// export interface GraphQLContext {
//   req: Request;
//   res: Response;
//   user: JwtPayload | null;
// }

// export const COOKIE_OPTIONS = {
//   httpOnly: true,
//   secure: isProd,
//   sameSite: 'lax' as const,
//   domain: env.COOKIE_DOMAIN,
//   maxAge: 15 * 60 * 1000,
//   path: '/',
// };

// export const REFRESH_COOKIE_OPTIONS = {
//   httpOnly: true,
//   secure: isProd,
//   sameSite: 'lax' as const,
//   domain: env.COOKIE_DOMAIN,
//   maxAge: 7 * 24 * 60 * 60 * 1000,
//   path: '/',
// };

// export async function createContext({
//   req,
//   res,
// }: {
//   req: Request;
//   res: Response;
// }): Promise<GraphQLContext> {
//   let user: JwtPayload | null = null;

//   try {
//     let token: string | undefined;

//     const authHeader = req.headers.authorization;
//     if (authHeader?.startsWith('Bearer ')) {
//       token = authHeader.slice(7);
//     }

//     if (!token && req.cookies?.access_token) {
//       token = req.cookies.access_token as string;
//     }

//     if (token) {
//       user = verifyAccessToken(token);
//     }
//   } catch {
//     user = null;
//   }

//   return { req, res, user };
// }