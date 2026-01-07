using backend.Interface;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Extensions;

namespace backend.Controllers
{
    [Authorize]
    public class NotificationController : BaseApiController
    {
        private readonly IUnitOfWork _uow;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(IUnitOfWork uow, ILogger<NotificationController> logger)
        {
            _uow = uow;
            _logger = logger;
        }

        /// <summary>
        /// Get user's notifications
        /// </summary>
        [HttpGet("get-notifications")]
        public async Task<ActionResult> GetNotifications([FromQuery] int limit = 20)
        {
            try
            {
                var userEmail = User.GetEmail();
                var user = await _uow.Accounts.GetUserByEmail(userEmail);
                
                if (user == null)
                    return Unauthorized();

                var notifications = await _uow.Notifications.GetUserNotificationsAsync(user.Id, limit);
                var unreadCount = await _uow.Notifications.GetUnreadCountAsync(user.Id);

                return Ok(new
                {
                    Notifications = notifications,
                    UnreadCount = unreadCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications");
                return BadRequest(new { Message = "Failed to get notifications" });
            }
        }

        /// <summary>
        /// Mark notification as read
        /// </summary>
        [HttpPut("mark-read/{notificationId}")]
        public async Task<ActionResult> MarkAsRead(Guid notificationId)
        {
            try
            {
                await _uow.Notifications.MarkAsReadAsync(notificationId);
                return Ok(new { Message = "Notification marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return BadRequest(new { Message = "Failed to mark as read" });
            }
        }

        /// <summary>
        /// Mark all notifications as read
        /// </summary>
        [HttpPut("mark-all-read")]
        public async Task<ActionResult> MarkAllAsRead()
        {
            try
            {
                var userEmail = User.GetEmail();
                var user = await _uow.Accounts.GetUserByEmail(userEmail);
                
                if (user == null)
                    return Unauthorized();

                await _uow.Notifications.MarkAllAsReadAsync(user.Id);
                return Ok(new { Message = "All notifications marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return BadRequest(new { Message = "Failed to mark all as read" });
            }
        }

        /// <summary>
        /// Get unread count only
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<ActionResult> GetUnreadCount()
        {
            try
            {
                var userEmail = User.GetEmail();
                var user = await _uow.Accounts.GetUserByEmail(userEmail);
                
                if (user == null)
                    return Unauthorized();

                var unreadCount = await _uow.Notifications.GetUnreadCountAsync(user.Id);
                return Ok(new { UnreadCount = unreadCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return BadRequest(new { Message = "Failed to get unread count" });
            }
        }
    }
}
