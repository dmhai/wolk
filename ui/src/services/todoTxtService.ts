import {TodoTxtModel} from "@/models/todoTxtModel";
import {firstBy} from "thenby";
import moment from 'moment'
import {timeUnitsInSeconds} from "@/resources";
import Note from "@/models/api/note";
import {DueStatusType} from "@/models/enums/dueStatusType";

export function singleTodoTxtToModel(line: string, noteId?: number): TodoTxtModel {
    let model: TodoTxtModel = {
        noteId: noteId,
        completed: false,
        priority: "",
        completionDate: undefined,
        creationDate: undefined,
        dueDate: undefined,
        dueStatus: DueStatusType.NOT_SET,
        contextTags: [],
        description: "",
        fullText: line,
        projectTags: [],
        hashCode: line.hashCode()
    };

    let parts = line.trim().split(" ");

    // Check completed...
    if (parts[0] === "x") {
        model.completed = true;
        parts.shift();
    }

    // Check priority...
    if (parts[0].indexOf("(") === 0) {
        model.priority = parts[0].substring(1, 2);
        parts.shift();
    }

    // Check dates...
    let dateReg = /^\d{4}[./-]\d{2}[./-]\d{2}$/;
    if (parts[0].match(dateReg) && parts[1].match(dateReg)) {
        // Both created and completed are set.
        model.completionDate = parts[0];
        model.creationDate = parts[1];
        parts.shift();
        parts.shift();
    } else if (parts[0].match(dateReg)) {
        // Only created is set.
        model.creationDate = parts[0];
        parts.shift();
    }

    let duePart = parts.find(p => p.indexOf("due:") === 0);
    if (duePart) {
        let dueDateText = duePart.replace("due:", "");
        if (dueDateText.match(dateReg)) {
            model.dueDate = dueDateText;

            // Set due status
            let dueDate = new Date(dueDateText);
            let actualDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59);
            let now = new Date();
            let diff = Math.round((actualDue.getTime() - now.getTime()) / 1000);
            model.secondsToDue = diff;
            if (diff < 0) {
                model.dueStatus = DueStatusType.OVERDUE;
            } else if (diff <= timeUnitsInSeconds.day) {
                model.dueStatus = DueStatusType.DUE_TODAY;
            } else if (diff > timeUnitsInSeconds.day && diff <= timeUnitsInSeconds.day * 2) {
                model.dueStatus = DueStatusType.DUE_IN_A_DAY;
            } else if (diff > timeUnitsInSeconds.day * 2 && diff <= timeUnitsInSeconds.week) {
                model.dueStatus = DueStatusType.DUE_IN_A_WEEK;
            } else if (diff > timeUnitsInSeconds.week && diff <= timeUnitsInSeconds.month) {
                model.dueStatus = DueStatusType.DUE_IN_A_MONTH;
            } else {
                model.dueStatus = DueStatusType.NOT_DUE_YET;
            }
        }
    }

    for (let part of parts) {
        if (part.indexOf("+") === 0) {
            model.projectTags.push(part);
        }

        if (part.indexOf("@") === 0) {
            model.contextTags.push(part);
        }
    }

    model.description = parts.filter(p => !duePart || p.indexOf(duePart) === -1).join(" ");
    return model;
}

function sortTodoItems(subResult: TodoTxtModel[]): TodoTxtModel[] {
    let result: TodoTxtModel[] = [];

    // Retrieve all overdue items
    result = result.concat(subResult.filter(r => !r.completed && r.dueStatus === DueStatusType.OVERDUE && result.indexOf(r) === -1));

    // Retrieve all items which are due today
    result = result.concat(subResult.filter(r => !r.completed && r.dueStatus === DueStatusType.DUE_TODAY && result.indexOf(r) === -1));

    // Retrieve all items which are due in a day
    result = result.concat(subResult.filter(r => !r.completed && r.dueStatus === DueStatusType.DUE_IN_A_DAY && result.indexOf(r) === -1));

    // Retrieve all not-done models with priority
    let prioResults = subResult.filter(r => !r.completed && !!r.priority && result.indexOf(r) === -1);
    prioResults.sort(firstBy("priority"));
    result = result.concat(prioResults);

    // Retrieve all not-done models without priority
    result = result.concat(subResult.filter(r => !r.completed && !r.priority && result.indexOf(r) === -1));

    // Retrieve all done models
    let doneResults = subResult.filter(r => r.completed && result.indexOf(r) === -1);
    doneResults.sort(firstBy("completionDate", -1));
    result = result.concat(doneResults);

    return result;
}

export function todoTxtNotesToModels(notes: Note[]): TodoTxtModel[] {
    let subResult: TodoTxtModel[] = [];
    for (let note of notes) {
        if (!note.content) {
            continue;
        }

        try {
            subResult = subResult.concat(todoTxtToModels(note.content, note.id));
        } catch (e) {
            console.error(e);
        }
    }

    return sortTodoItems(subResult);
}

export function todoTxtToModels(input: string, noteId?: number): TodoTxtModel[] {
    let subResult: TodoTxtModel[] = [];
    let lines = input.lines();
    for (let line of lines) {
        if (!line) {
            continue;
        }

        subResult.push(singleTodoTxtToModel(line, noteId));
    }

    return sortTodoItems(subResult);
}

export function singleTodoTxtToString(model: TodoTxtModel) {
    let result = "";
    if (model.completed) {
        result += "x ";
    }

    if (model.priority) {
        result += `(${model.priority}) `;
    }

    if (model.creationDate) {
        if (model.completionDate) {
            result += `${moment(model.completionDate).format('YYYY-MM-DD')} `;
        }

        result += `${moment(model.creationDate).format('YYYY-MM-DD')} `;
    }

    result += `${model.description} `;
    if (model.dueDate) {
        result += `due:${moment(model.dueDate).format('YYYY-MM-DD')}`;
    }

    return result;
}

export function todoTxtToString(models: TodoTxtModel[]) {
    let result = [];
    for (let model of models) {
        result.push(singleTodoTxtToString(model));
    }

    return result.join('\n');
}

export function extractProjectTags(models: TodoTxtModel[]): string[] {
    let result: string[] = [];
    models = models.filter(m => !m.completed);
    for (let model of models) {
        for (let tag of model.projectTags) {
            if (result.indexOf(tag) === -1 && tag !== "+") {
                result.push(tag);
            }
        }
    }

    return result;
}

export function extractContextTags(models: TodoTxtModel[]): string[] {
    let result: string[] = [];
    models = models.filter(m => !m.completed);
    for (let model of models) {
        for (let tag of model.contextTags) {
            if (result.indexOf(tag) === -1 && tag !== "@") {
                result.push(tag);
            }
        }
    }

    return result;
}