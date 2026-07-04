import { Link } from "react-router-dom";
import { useNotifications, useMarkNotificationRead, describeNotification } from "@/hooks/useNotifications";
import { EmptyState } from "@/components/ui/states";

export function NotificationPanel({ address, onClose }: { address: string; onClose: () => void }) {
  const { data } = useNotifications(address);
  const markRead = useMarkNotificationRead(address);
  const items = data?.items ?? [];

  return (
    <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold dark:border-zinc-900">
        Notificaciones
      </div>
      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4">
            <EmptyState message="No tienes notificaciones nuevas." />
          </div>
        ) : (
          items.map((n) => (
            <Link
              key={n.id}
              to={`/article/${n.contentHash}`}
              onClick={() => {
                if (!n.read) markRead.mutate(n.id);
                onClose();
              }}
              className={`block border-b border-zinc-50 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900 ${
                n.read ? "text-zinc-400" : "font-medium text-zinc-900 dark:text-white"
              }`}
            >
              {describeNotification(n)}
              <span className="mt-1 block text-xs text-zinc-400">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
