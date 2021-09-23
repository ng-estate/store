import {AppActions} from "./app.actions";
import {Effects} from "@ng-estate/store";
import {AppState} from "./index";
import {TodoService} from "../services/todo.service";
import {tap} from "rxjs/operators";

export const AppEffects: Effects<AppState> = {
  [AppActions.fetchAllTodos]: ({dispatch, injector}) => {
    const todoService = injector.get(TodoService);
    const todoList$ = todoService.getTodoList().pipe(tap((todos) => dispatch(AppActions.todosFetched, todos)));

    return todoList$;
  }
}
