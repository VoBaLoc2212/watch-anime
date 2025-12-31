namespace backend.Helpers
{

    public class GoogleDriveConfig
    {
        public string ApplicationName { get; set; } = "WatchingAnimeStore";
        public string FolderId { get; set; } = "";
        public string CloudflareWorker { get; set; }
        public OAuth2Config OAuth2 { get; set; } = new OAuth2Config();
    }

    public class OAuth2Config
    {
        public string ClientId { get; set; } = "";
        public string ClientSecret { get; set; } = "";
        public string RedirectUri { get; set; } = "";
        public string RefreshToken { get; set; } = "";
    }
}
