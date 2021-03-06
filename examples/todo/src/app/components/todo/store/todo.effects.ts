import {TodoActions} from "./todo.actions";
import {EffectOptions, EffectResult, Effects} from "@ng-estate/store/internal";
import {MappedTodo, TodoState} from "./index";
import {map, tap} from "rxjs/operators";
import {TodoMapper} from "../mapper/todo.mapper";
import {TodoService} from "../../../services/todo.service";

export const TodoEffects: Effects<TodoState> = {
  [TodoActions.fetchTodo]: ({dispatch, payload, injector}: EffectOptions<TodoState, number>): EffectResult<MappedTodo> => {
    const todoMapper = injector.get(TodoMapper);
    const todoService = injector.get(TodoService);
    const mappedTodo$ = todoService.getById(payload).pipe(map((todo) => todoMapper.mapToView(todo)), tap((mappedTodo) => {
      dispatch(TodoActions.todoFetched, mappedTodo);
    }));

    return mappedTodo$;
  }
}
