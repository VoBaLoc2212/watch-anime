namespace backend.Interface
{
    public interface IUnitOfWork
    {
        IAccountRepository Accounts { get; }
        IAnimeRepository Animes { get; }
        IEpisodeRepository Episodes { get; }


        Task<bool> Complete();
    }
}
