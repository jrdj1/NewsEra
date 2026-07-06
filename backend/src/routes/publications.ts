import { Hono } from "hono";
import { publicationService } from "../services/publication.service.js";
import { followService } from "../services/follow.service.js";
import type { PublicationSort } from "../repositories/publication.repository.js";
import type {
  CreatePublicationBody,
  ReopenRequestBody,
  ClaimRetroactiveBody,
  FollowBody,
} from "../types/api.js";

export const publicationsRouter = new Hono();

publicationsRouter.get("/", async (c) => {
  const { page, limit, state, result, tags, author, sort } = c.req.query();
  const list = await publicationService.list({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    state,
    result,
    tags,
    author,
    sort: sort as PublicationSort | undefined,
  });
  return c.json(list);
});

publicationsRouter.get("/:hash", async (c) => {
  const publication = await publicationService.getByHash(c.req.param("hash"));
  return c.json(publication);
});

publicationsRouter.post("/", async (c) => {
  const body = await c.req.json<CreatePublicationBody>();
  const publication = await publicationService.create(body);
  return c.json(publication, 201);
});

publicationsRouter.post("/:hash/reopen-request", async (c) => {
  const body = await c.req.json<ReopenRequestBody>();
  const request = await publicationService.requestReopen(c.req.param("hash"), body);
  return c.json(request, 201);
});

publicationsRouter.post("/:hash/claim-retroactive", async (c) => {
  const body = await c.req.json<ClaimRetroactiveBody>();
  const claim = await publicationService.claimRetroactive(c.req.param("hash"), body);
  return c.json(claim, 201);
});

publicationsRouter.post("/:hash/follow", async (c) => {
  const { userAddress } = await c.req.json<FollowBody>();
  await followService.add(c.req.param("hash"), userAddress);
  return c.body(null, 204);
});

publicationsRouter.delete("/:hash/follow", async (c) => {
  const { userAddress } = await c.req.json<FollowBody>();
  await followService.remove(c.req.param("hash"), userAddress);
  return c.body(null, 204);
});
