import {AppActions} from "./app.actions";
import {ReducerResult, Reducers} from "@ng-estate/store/internal";
import {AppState} from "./index";
import {Todo} from "../components/todo/store";

export const AppReducers: Reducers<AppState> = {
  [AppActions.fetchAllTodos]: (state): ReducerResult<AppState> => ({...state, isLoading: true}),
  [AppActions.todosFetched]: (state, todoList: Array<Partial<Todo>>): ReducerResult<AppState> => ({...state, todoList, isLoading: false})
}
