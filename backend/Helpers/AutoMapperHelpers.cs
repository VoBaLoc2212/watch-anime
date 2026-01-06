using AutoMapper;
using backend.DTOs;
using backend.Models;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace backend.Helpers
{
    public class AutoMapperProfiles: Profile
    {
        public AutoMapperProfiles()
        {
            //Sử dụng để validation properties của DTO dựa trên Model trước khi Mapping
            CreateMap<UserAuthDTO, User>()
                .BeforeMap<ValidateBeforeMapAction<UserAuthDTO, User>>();
            CreateMap<UserAuthUpdateDTO, User>()
                .BeforeMap<ValidateBeforeMapAction<UserAuthUpdateDTO, User>>();


            CreateMap<AnimeCreateDTO, Anime>()
                .BeforeMap<ValidateBeforeMapAction<AnimeCreateDTO, Anime>>();
            CreateMap<AnimeUpdateDTO, Anime>()
                .BeforeMap<ValidateBeforeMapAction<AnimeUpdateDTO, Anime>>();

            CreateMap<EpisodeUploadDTO, Episode>()
                .BeforeMap<ValidateBeforeMapAction<EpisodeUploadDTO, Episode>>();
        }
    }

    //Hàm sử dụng để validate DTO dựa trên Model trước khi mapping sang Model
    public class ValidateBeforeMapAction<TSource, TDestination> : IMappingAction<TSource, TDestination>
    {
        public void Process(TSource source, TDestination destination, ResolutionContext context)
        {
            var validationResults = new List<ValidationResult>();

            // Create a temporary destination instance and copy matching properties from the source (DTO)
            var destInstance = Activator.CreateInstance<TDestination>();
            var sourceProps = typeof(TSource).GetProperties(BindingFlags.Public | BindingFlags.Instance);
            var destProps = typeof(TDestination).GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.SetProperty);

            // Lưu lại các property names có trong source DTO
            var sourcePropertyNames = new HashSet<string>(sourceProps.Select(p => p.Name));

            foreach (var dprop in destProps)
            {
                var sprop = sourceProps.FirstOrDefault(p => p.Name == dprop.Name && dprop.PropertyType.IsAssignableFrom(p.PropertyType));
                if (sprop != null)
                {
                    var value = sprop.GetValue(source);
                    dprop.SetValue(destInstance, value);
                }
            }

            // Validate chỉ những property có trong DTO
            var validationContext = new ValidationContext(destInstance);
            foreach (var dprop in destProps.Where(p => sourcePropertyNames.Contains(p.Name)))
            {
                var value = dprop.GetValue(destInstance);
                var propValidationResults = new List<ValidationResult>();
                
                Validator.TryValidateProperty(value, 
                    new ValidationContext(destInstance) { MemberName = dprop.Name }, 
                    propValidationResults);
                
                validationResults.AddRange(propValidationResults);
            }

            if (validationResults.Any())
            {
                throw new ValidationException(
                    $"Validation failed for {typeof(TSource).Name}: " +
                    string.Join("; ", validationResults.Select(r => r.ErrorMessage))
                );
            }
        }
    }
}
