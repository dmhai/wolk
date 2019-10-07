using System;

namespace Ducode.Wolk.Application.Exceptions
{
    public class ConflictException : Exception
    {
        public ConflictException(string name, object key)
            : base($"Entity {name} ({key}) already exists.")
        {
        }
    }
}
