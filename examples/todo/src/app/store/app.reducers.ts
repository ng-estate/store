import {AppActions} from "./app.actions";
import {Immutable, Reducers} from "@ng-estate/store";
import {AppState} from "./index";

export const AppReducers: Reducers<AppState> = {
  [AppActions.fetchAllTodos]: (state): Immutable<AppState> => ({...state, isLoading: true}),
  [AppActions.todosFetched]: (state, todoList): Immutable<AppState> => ({...state, todoList, isLoading: false})
}
