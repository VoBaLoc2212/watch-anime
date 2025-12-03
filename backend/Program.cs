using API.Middlewares;
using backend.Data;
using backend.Extensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();
builder.Services.AddApplicationService(builder.Configuration);
builder.Services.IdentityServiceExtensions(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

//Allow Origins
app.UseCors(cors => cors
    .AllowAnyHeader()
    .AllowAnyMethod()
    .WithOrigins(builder.Configuration.GetSection("CORS").Get<string[]>())
);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
