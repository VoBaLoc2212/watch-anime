using backend.Models;

namespace backend.Interface
{
    public interface INotificationRepository : IBaseRepository<Notification>
    {
        Task<List<Notification>> GetUserNotificationsAsync(Guid userId, int limit = 20);
        Task<int> GetUnreadCountAsync(Guid userId);
        Task MarkAsReadAsync(Guid notificationId);
        Task MarkAllAsReadAsync(Guid userId);
    }
}
