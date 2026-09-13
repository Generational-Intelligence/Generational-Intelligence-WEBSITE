import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { and, asc, count, desc, eq } from "drizzle-orm";
import {
  CreateStudioProjectBody,
  CreateStudioProjectResponse,
  DeleteStudioProjectParams,
  GetPublicSiteResponse,
  GetStudioBootstrapResponse,
  GetStudioSummaryResponse,
  ListStudioProjectsResponse,
  ListStudioSnapshotsResponse,
  PublishStudioProjectParams,
  PublishStudioProjectResponse,
  ReorderStudioProjectsBody,
  RequestStudioUploadBody,
  RequestStudioUploadResponse,
  RollbackStudioSnapshotParams,
  RollbackStudioSnapshotResponse,
  SubmitQueryBody,
  SubmitQueryResponse,
  UpdateStudioProjectBody,
  UpdateStudioProjectParams,
  UpdateStudioProjectResponse,
} from "@workspace/api-zod";
import {
  db,
  projects,
  publishedSnapshots,
  querySubmissions,
  studioOwners,
} from "@workspace/db";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

type OwnerRequest = Request & { ownerUserId?: string };

const companyCopy = {
  companyName: "Generational Intelligence",
  tagline: "Practical software for complex, real-world work.",
  description:
    "We turn operational knowledge into clear digital tools—designed around how people actually work, decide and collaborate.",
};

function projectPayload(project: typeof projects.$inferSelect) {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    category: project.category,
    publicStatus: project.publicStatus,
    status: project.status,
    visibility: project.visibility,
    displayOrder: project.displayOrder,
    logoPath: project.logoPath,
    imagePath: project.imagePath,
    privateNotes: project.privateNotes,
    privateFiles: project.privateFiles,
    updatedAt: project.updatedAt,
  };
}

async function buildPublicSite() {
  const visible = await db
    .select()
    .from(projects)
    .where(and(eq(projects.visibility, "public"), eq(projects.status, "Published")))
    .orderBy(asc(projects.displayOrder));

  return {
    ...companyCopy,
    projects: visible.map((project) => ({
      name: project.name,
      slug: project.slug,
      description: project.description,
      category: project.category,
      status: project.publicStatus,
      logoPath: project.logoPath,
      imagePath: project.imagePath,
    })),
  };
}

async function createSnapshot() {
  const payload = await buildPublicSite();
  const [snapshot] = await db
    .insert(publishedSnapshots)
    .values({ payload })
    .returning();
  if (!snapshot) throw new Error("Snapshot creation failed");
  return snapshot;
}

async function requireOwner(req: OwnerRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth.userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const owners = await db.select().from(studioOwners).limit(1);
  if (!owners[0] || owners[0].clerkUserId !== userId) {
    res.status(403).json({ error: "Owner access required" });
    return;
  }
  req.ownerUserId = userId;
  next();
}

router.get("/public/site", async (req, res) => {
  try {
    const [snapshot] = await db
      .select()
      .from(publishedSnapshots)
      .orderBy(desc(publishedSnapshots.createdAt));
    const payload = snapshot?.payload ?? (await buildPublicSite());
    res.json(GetPublicSiteResponse.parse(payload));
  } catch (error) {
    req.log.error({ err: error }, "Unable to load public site");
    res.status(500).json({ error: "Unable to load public site" });
  }
});

router.get("/objects/*path", async (req, res) => {
  try {
    const requestedPath = `/objects/${
      Array.isArray(req.params.path) ? req.params.path.join("/") : req.params.path
    }`;
    const [snapshot] = await db
      .select()
      .from(publishedSnapshots)
      .orderBy(desc(publishedSnapshots.createdAt));
    const publicProjects =
      (snapshot?.payload as { projects?: Array<{ logoPath?: string | null; imagePath?: string | null }> })
        ?.projects ?? [];
    const isPublishedAsset = publicProjects.some(
      (project) =>
        project.logoPath === requestedPath || project.imagePath === requestedPath,
    );
    if (!isPublishedAsset) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const file = await storage.getObjectEntityFile(requestedPath);
    const response = await storage.downloadObject(file, 300);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (!response.body) {
      res.end();
      return;
    }
    const { Readable } = await import("stream");
    Readable.fromWeb(response.body as never).pipe(res);
  } catch (error) {
    req.log.warn({ err: error }, "Published asset not found");
    res.status(404).json({ error: "File not found" });
  }
});

router.post("/queries", async (req, res) => {
  const parsed = SubmitQueryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the form and try again" });
    return;
  }

  const destination = process.env.QUERY_DESTINATION_EMAIL;
  if (!destination) {
    req.log.error("QUERY_DESTINATION_EMAIL is not configured");
    res.status(503).json({ error: "Query delivery is temporarily unavailable" });
    return;
  }

  try {
    const submission = parsed.data;
    await db.insert(querySubmissions).values(submission);

    const subject = `Website query from ${submission.name}`;
    const text = [
      `Name: ${submission.name}`,
      `Email: ${submission.email}`,
      `Company: ${submission.company || "Not provided"}`,
      "",
      submission.message,
    ].join("\n");
    const raw = Buffer.from(
      [
        `To: ${destination}`,
        `Reply-To: ${submission.email}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        text,
      ].join("\r\n"),
    ).toString("base64url");

    const connectors = new ReplitConnectors();
    const response = await connectors.proxy(
      "google-mail",
      "/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      },
    );
    if (!response.ok) {
      throw new Error(`Gmail delivery failed with ${response.status}`);
    }

    res.status(201).json(SubmitQueryResponse.parse({ accepted: true }));
  } catch (error) {
    req.log.error({ err: error }, "Unable to deliver public query");
    res.status(502).json({ error: "Unable to send your query right now" });
  }
});

router.get("/studio/bootstrap", async (req, res) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const owners = await db.select().from(studioOwners).limit(1);
  if (!owners[0]) {
    const [claimed] = await db
      .insert(studioOwners)
      .values({ clerkUserId: userId })
      .onConflictDoNothing()
      .returning();
    if (claimed) {
      res.json(GetStudioBootstrapResponse.parse({ isOwner: true, ownerClaimed: true }));
      return;
    }
  }

  const [owner] = await db.select().from(studioOwners).limit(1);
  res.json(
    GetStudioBootstrapResponse.parse({
      isOwner: owner?.clerkUserId === userId,
      ownerClaimed: false,
    }),
  );
});

router.use("/studio", requireOwner);

router.get("/studio/summary", async (_req, res) => {
  const rows = await db
    .select({ status: projects.status, value: count() })
    .from(projects)
    .groupBy(projects.status);
  const totals: Record<string, number> = Object.fromEntries(
    rows.map((row) => [row.status, Number(row.value)]),
  );
  res.json(
    GetStudioSummaryResponse.parse({
      total: Object.values(totals).reduce((sum, value) => sum + value, 0),
      drafts: totals["Draft"] ?? 0,
      review: totals["Ready for review"] ?? 0,
      published: totals["Published"] ?? 0,
      archived: totals["Archived"] ?? 0,
    }),
  );
});

router.get("/studio/projects", async (_req, res) => {
  const rows = await db.select().from(projects).orderBy(asc(projects.displayOrder));
  res.json(ListStudioProjectsResponse.parse(rows.map(projectPayload)));
});

router.post("/studio/projects", async (req, res) => {
  const parsed = CreateStudioProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project details" });
    return;
  }
  const [project] = await db.insert(projects).values(parsed.data).returning();
  res.status(201).json(CreateStudioProjectResponse.parse(projectPayload(project!)));
});

router.patch("/studio/projects/:projectId", async (req, res) => {
  const params = UpdateStudioProjectParams.safeParse(req.params);
  const body = UpdateStudioProjectBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid project details" });
    return;
  }
  const [project] = await db
    .update(projects)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(projects.id, params.data.projectId))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(UpdateStudioProjectResponse.parse(projectPayload(project)));
});

router.delete("/studio/projects/:projectId", async (req, res) => {
  const params = DeleteStudioProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project" });
    return;
  }
  await db.delete(projects).where(eq(projects.id, params.data.projectId));
  res.status(204).end();
});

router.post("/studio/projects/reorder", async (req, res) => {
  const parsed = ReorderStudioProjectsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid order" });
    return;
  }
  await db.transaction(async (tx) => {
    for (const [displayOrder, id] of parsed.data.projectIds.entries()) {
      await tx.update(projects).set({ displayOrder }).where(eq(projects.id, id));
    }
  });
  res.json({ reordered: true });
});

router.post("/studio/uploads/request-url", async (req: OwnerRequest, res) => {
  const parsed = RequestStudioUploadBody.safeParse(req.body);
  if (!parsed.success || !req.ownerUserId) {
    res.status(400).json({ error: "Invalid upload request" });
    return;
  }
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    const objectPath = storage.normalizeObjectEntityPath(uploadURL);
    res.json(RequestStudioUploadResponse.parse({ uploadURL, objectPath }));
  } catch (error) {
    req.log.error({ err: error }, "Unable to create upload URL");
    res.status(500).json({ error: "Unable to create upload URL" });
  }
});

router.get("/studio/files/*path", async (req: OwnerRequest, res) => {
  try {
    const path = Array.isArray(req.params.path)
      ? req.params.path.join("/")
      : req.params.path;
    const file = await storage.getObjectEntityFile(`/objects/${path}`);
    const response = await storage.downloadObject(file, 60);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (!response.body) {
      res.end();
      return;
    }
    const { Readable } = await import("stream");
    Readable.fromWeb(response.body as never).pipe(res);
  } catch (error) {
    req.log.warn({ err: error }, "Private file not found");
    res.status(404).json({ error: "File not found" });
  }
});

router.post("/studio/projects/:projectId/publish", async (req, res) => {
  const params = PublishStudioProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project" });
    return;
  }
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, params.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (!["Ready for review", "Published"].includes(project.status)) {
    res.status(409).json({ error: "Move the project to Ready for review before publishing" });
    return;
  }
  await db
    .update(projects)
    .set({ status: "Published", visibility: "public", updatedAt: new Date() })
    .where(eq(projects.id, project.id));
  const snapshot = await createSnapshot();
  res.json(
    PublishStudioProjectResponse.parse({
      publishedAt: snapshot.createdAt,
      snapshotId: snapshot.id,
    }),
  );
});

router.get("/studio/snapshots", async (_req, res) => {
  const rows = await db
    .select()
    .from(publishedSnapshots)
    .orderBy(desc(publishedSnapshots.createdAt));
  res.json(
    ListStudioSnapshotsResponse.parse(
      rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        projectCount: Array.isArray((row.payload as { projects?: unknown[] }).projects)
          ? (row.payload as { projects: unknown[] }).projects.length
          : 0,
      })),
    ),
  );
});

router.post("/studio/snapshots/:snapshotId/rollback", async (req, res) => {
  const params = RollbackStudioSnapshotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid snapshot" });
    return;
  }
  const [target] = await db
    .select()
    .from(publishedSnapshots)
    .where(eq(publishedSnapshots.id, params.data.snapshotId));
  if (!target) {
    res.status(404).json({ error: "Snapshot not found" });
    return;
  }
  const [restored] = await db
    .insert(publishedSnapshots)
    .values({ payload: target.payload })
    .returning();
  res.json(
    RollbackStudioSnapshotResponse.parse({
      publishedAt: restored!.createdAt,
      snapshotId: restored!.id,
    }),
  );
});

export default router;