using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace backend.Helpers
{
    public class CommaSeparatedModelBinder : IModelBinder
    {
        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);

            if (valueProviderResult == ValueProviderResult.None)
            {
                return Task.CompletedTask;
            }

            bindingContext.ModelState.SetModelValue(bindingContext.ModelName, valueProviderResult);

            var value = valueProviderResult.FirstValue;

            if (string.IsNullOrEmpty(value))
            {
                return Task.CompletedTask;
            }

            var list = value.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                            .Select(x => x.Trim())
                            .ToList();

            bindingContext.Result = ModelBindingResult.Success(list);

            return Task.CompletedTask;
        }

    }

    public class TimeOnlyModelBinder : IModelBinder
    {
        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            // 1. Lấy giá trị gửi lên từ form (theo tên biến)
            var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);

            if (valueProviderResult == ValueProviderResult.None)
            {
                return Task.CompletedTask;
            }

            bindingContext.ModelState.SetModelValue(bindingContext.ModelName, valueProviderResult);

            var valueAsString = valueProviderResult.FirstValue;

            // 2. Kiểm tra null hoặc rỗng
            if (string.IsNullOrEmpty(valueAsString))
            {
                return Task.CompletedTask;
            }

            // 3. Parse chuỗi "HH:mm:ss" sang TimeOnly
            // TimeOnly.TryParse đủ thông minh để hiểu định dạng "01:30:00"
            if (TimeOnly.TryParse(valueAsString, out var result))
            {
                bindingContext.Result = ModelBindingResult.Success(result);
            }
            else
            {
                bindingContext.ModelState.TryAddModelError(
                    bindingContext.ModelName,
                    "Dữ liệu thời gian không đúng định dạng HH:mm:ss"
                );
            }

            return Task.CompletedTask;
        }
    }
}
