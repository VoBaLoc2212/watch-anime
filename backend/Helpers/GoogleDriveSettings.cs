namespace backend.Helpers
{
    //public class GoogleDriveConfig
    //{
    //    public ServiceAccountConfig ServiceAccount { get; set; }
    //    public string FolderId { get; set; }
    //    public string ApplicationName { get; set; }
    //}

    //public class ServiceAccountConfig
    //{
    //    public string type { get; set; }
    //    public string project_id { get; set; }
    //    public string private_key_id { get; set; }
    //    public string private_key { get; set; }
    //    public string client_email { get; set; }
    //    public string client_id { get; set; }
    //    public string token_uri { get; set; }
    //}

    public class GoogleDriveConfig
    {
        public string ApplicationName { get; set; } = "WatchingAnimeStore";
        public string FolderId { get; set; } = "";
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
