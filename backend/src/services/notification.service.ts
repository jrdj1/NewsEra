import { AppError } from "../errors/AppError.js";
import { notificationRepository } from "../repositories/notification.repository.js";

export const notificationService = {
  async markRead(id: number) {
    try {
      return await notificationRepository.markRead(id);
    } catch {
      throw new AppError("NOT_FOUND", `Notificación no encontrada: ${id}`);
    }
  },
};
