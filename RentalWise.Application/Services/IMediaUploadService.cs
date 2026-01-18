using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using RentalWise.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Application.Services;

public interface IMediaUploadService
{
    Task<List<PropertyMedia>> UploadPropertyMediaAsync(List<IFormFile> images, IFormFile? video, int existingImageCount,
    bool videoAlreadyExists);
    Task DeleteMediaOneByOneAsync(IEnumerable<PropertyMedia> mediaList);
    Task DeleteMediaAsync(DeletionParams deletionParams);
}
