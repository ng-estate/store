import {MappedTodo, Todo} from "../store";

export class TodoMapper {
  public mapToView({id, title, description, timestamp}: Todo): MappedTodo {
    return {
      id,
      title,
      description,
      date: new Date(timestamp)
    }
  }
}
