using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Notification
    {
        public Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        public User User { get; set; }
        
        [Required]
        public string Title { get; set; }
        
        [Required]
        public string Message { get; set; }
        
        public string Type { get; set; } // "success", "error", "info", "warning"
        
        public string Link { get; set; } // Optional link to related resource
        
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
