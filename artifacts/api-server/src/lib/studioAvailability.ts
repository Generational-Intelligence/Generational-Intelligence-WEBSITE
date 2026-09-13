import type { RequestHandler } from "express";

/**
 * The Studio is a development-only surface. Keep this prefix centralized so
 * production blocking cannot drift when Studio endpoints are added.
 */
export const STUDIO_API_PREFIX = "/api/studio";

/**
 * This middleware must remain mounted before Clerk and the API router.
 * Returning 404 instead of 401 intentionally reveals nothing about Studio
 * routes or authentication on a published deployment.
 */
export const blockStudioInProduction: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};