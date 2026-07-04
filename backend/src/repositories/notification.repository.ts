import { prisma } from "../lib/prisma.js";

export const notificationRepository = {
  async createMany(
    userAddresses: string[],
    contentHash: string,
    type: "REOPENED" | "CONSENSUS_REACHED" | "RETROACTIVE_APPLIED",
  ) {
    if (userAddresses.length === 0) return;

    // Red de seguridad: el modelo no distingue de qué ronda proviene una
    // notificación (RD-20), así que una unread ya existente para el mismo
    // (usuario, artículo, tipo) se trata como duplicado — protege contra
    // reprocesados solapados del indexador (reinicio, POST /sync/events).
    const existing = await prisma.notification.findMany({
      where: { userAddress: { in: userAddresses }, contentHash, type, read: false },
      select: { userAddress: true },
    });
    const already = new Set(existing.map((n) => n.userAddress));
    const toCreate = userAddresses.filter((a) => !already.has(a));
    if (toCreate.length === 0) return;

    await prisma.notification.createMany({
      data: toCreate.map((userAddress) => ({ userAddress, contentHash, type })),
    });
  },

  async listByUser(userAddress: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userAddress },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userAddress } }),
    ]);
    return { items, total };
  },

  async markRead(id: number) {
    return prisma.notification.update({ where: { id }, data: { read: true } });
  },
};
