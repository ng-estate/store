import {AppActions} from "./app.actions";
import {ReducerResult, Reducers} from "@ng-estate/store";
import {AppState} from "./index";

export const AppReducers: Reducers<AppState> = {
  [AppActions.fetchAllTodos]: (state): ReducerResult<AppState> => ({...state, isLoading: true}),
  [AppActions.todosFetched]: (state, todoList): ReducerResult<AppState> => ({...state, todoList, isLoading: false})
}
