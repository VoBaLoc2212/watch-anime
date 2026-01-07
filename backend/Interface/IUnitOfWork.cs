namespace backend.Interface
{
    public interface IUnitOfWork
    {
        IAccountRepository Accounts { get; }
        IAnimeRepository Animes { get; }
        IEpisodeRepository Episodes { get; }

        IRatingRepository Ratings { get; }

        INotificationRepository Notifications { get; }

        Task<bool> Complete();
    }
}
