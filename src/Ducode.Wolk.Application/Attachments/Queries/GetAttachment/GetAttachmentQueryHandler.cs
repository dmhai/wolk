using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Ducode.Wolk.Application.Attachments.Models;
using Ducode.Wolk.Application.Exceptions;
using Ducode.Wolk.Application.Interfaces;
using Ducode.Wolk.Common;
using Ducode.Wolk.Configuration;
using Ducode.Wolk.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Ducode.Wolk.Application.Attachments.Queries.GetAttachmentBinary
{
    public class GetAttachmentQueryHandler : IRequestHandler<GetAttachmentQuery, FullAttachmentDto>
    {
        private readonly IFileService _fileService;
        private readonly IMapper _mapper;
        private readonly IWolkDbContext _wolkDbContext;
        private readonly WolkConfiguration _wolkConfiguration;

        public GetAttachmentQueryHandler(
            IFileService fileService,
            IMapper mapper,
            IWolkDbContext wolkDbContext,
            IOptions<WolkConfiguration> options)
        {
            _fileService = fileService;
            _mapper = mapper;
            _wolkDbContext = wolkDbContext;
            _wolkConfiguration = options.Value;
        }

        public async Task<FullAttachmentDto> Handle(GetAttachmentQuery request, CancellationToken cancellationToken)
        {
            var attachment = await _wolkDbContext.Attachments
                .FirstOrDefaultAsync(a => a.Id == request.AttachmentId, cancellationToken);
            if (attachment == null)
            {
                throw new NotFoundException(nameof(Attachment), request.AttachmentId);
            }

            var path = Path.Combine(_wolkConfiguration.UploadsPath, attachment.InternalFilename);
            if (!_fileService.FileExists(path))
            {
                throw new InvalidOperationException($"File '{path}' unexpectedly not found.");
            }

            var contents = _fileService.ReadAllBytes(path);
            var dto = _mapper.Map<FullAttachmentDto>(attachment);
            dto.Contents = contents;
            return dto;
        }
    }
}
