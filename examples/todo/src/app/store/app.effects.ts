import {AppActions} from "./app.actions";
import {EffectOptions, EffectResult, Effects} from "@ng-estate/store/internal";
import {AppState} from "./index";
import {TodoService} from "../services/todo.service";
import {tap} from "rxjs/operators";
import {Todo} from "../components/todo/store";

export const AppEffects: Effects<AppState> = {
  [AppActions.fetchAllTodos]: ({dispatch, injector}: EffectOptions<AppState>): EffectResult<Array<Partial<Todo>>> => {
    const todoService = injector.get(TodoService);
    const todoList$ = todoService.getTodoList().pipe(tap((todos) => dispatch(AppActions.todosFetched, todos)));

    return todoList$;
  }
}
