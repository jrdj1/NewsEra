import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Paginated, type NotificationEntry } from "@/lib/api";

export function useNotifications(address: string | undefined) {
  return useQuery({
    queryKey: ["notifications", address],
    queryFn: () =>
      api.get<Paginated<NotificationEntry>>(`/api/v1/profile/${address}/notifications?limit=50`),
    enabled: !!address,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead(address: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/api/v1/notifications/${id}/read`),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", address] });
      const previous = queryClient.getQueryData<Paginated<NotificationEntry>>([
        "notifications",
        address,
      ]);
      queryClient.setQueryData<Paginated<NotificationEntry>>(["notifications", address], (old) =>
        old
          ? { ...old, items: old.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }
          : old,
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications", address], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", address] });
    },
  });
}

const NOTIFICATION_MESSAGES: Record<NotificationEntry["type"], (hash: string) => string> = {
  REOPENED: () => "Se ha reabierto la votación de un artículo que sigues.",
  CONSENSUS_REACHED: () => "Se alcanzó consenso en un artículo que sigues o votaste.",
  RETROACTIVE_APPLIED: () => "Se aplicó un ajuste retroactivo de reputación en un artículo que votaste.",
  DEMO_INFO: () =>
    "🧪 Esto es una demo de prueba: las noticias, las personas y los votos que ves son inventados, no reales. Puedes probar de todo (publicar, votar, guardar favoritos...) sin ningún problema — solo se guarda en tu propio ordenador, no en ningún servidor, y no se comparte con nadie.",
};

export function describeNotification(notification: NotificationEntry): string {
  return NOTIFICATION_MESSAGES[notification.type](notification.contentHash);
}
