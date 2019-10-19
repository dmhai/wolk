using System.Collections.Generic;
using System.Threading.Tasks;
using Ducode.Wolk.Application.Notebooks.Commands.CreateNotebook;
using Ducode.Wolk.Application.Notebooks.Commands.DeleteNotebook;
using Ducode.Wolk.Application.Notebooks.Commands.UpdateNotebook;
using Ducode.Wolk.Application.Notebooks.Models;
using Ducode.Wolk.Application.Notebooks.Queries.GetAllNotebooks;
using Ducode.Wolk.Application.Notebooks.Queries.GetNotebook;
using Ducode.Wolk.Application.Notes.Models;
using Ducode.Wolk.Application.Notes.Queries.GetNotes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Ducode.Wolk.Api.Controllers
{
    public class NotebookController : BaseApiController
    {

        /// <summary>
        /// Returns a list of all notebooks.
        /// </summary>
        /// <returns>A list of all notebooks</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<NotebookDto>>> GetAll() =>
            Ok(await Mediator.Send(new GetAllNotebooksQuery()));

        /// <summary>
        /// Returns a specific notebook.
        /// </summary>
        /// <param name="id">The notebook ID.</param>
        /// <returns>The notebook.</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<NotebookDto>> Get([FromRoute]long id) =>
            Ok(await Mediator.Send(new GetNotebookQuery(id)));

        /// <summary>
        /// Creates a new notebook
        /// </summary>
        /// <param name="command">The notebook.</param>
        /// <returns>The added notebook.</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<NotebookDto>> Create([FromBody] CreateNotebookCommand command)
        {
            var notebook = await Mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id = notebook.Id}, notebook);
        }

        /// <summary>
        /// Updates an existing notebook.
        /// </summary>
        /// <param name="command">The notebook.</param>
        /// <param name="id">The notebook ID.</param>
        /// <returns>No content.</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> Update([FromBody] UpdateNotebookCommand command, [FromRoute]long id)
        {
            command.Id = id;
            await Mediator.Send(command);
            return NoContent();
        }

        /// <summary>
        /// Deletes a specific notebook.
        /// </summary>
        /// <param name="id">The notebook ID.</param>
        /// <returns>No content.</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> Delete([FromRoute] long id)
        {
            await Mediator.Send(new DeleteNotebookCommand(id));
            return NoContent();
        }
    }
}
