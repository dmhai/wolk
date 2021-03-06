using System;
using System.Collections.Generic;
using System.Linq;
using FluentValidation.Results;

namespace Ducode.Wolk.Application.Exceptions
{
    public class ValidationException : Exception
    {
        public ValidationException(string failure)
        {
            Failures = new[] {failure};
        }

        public ValidationException(IEnumerable<string> failures)
        {
            Failures = failures;
        }

        public ValidationException(List<ValidationFailure> failures)
        {
            Failures = failures
                .Select(f => f.ErrorMessage)
                .ToArray();
        }

        public IEnumerable<string> Failures { get; }
    }
}
