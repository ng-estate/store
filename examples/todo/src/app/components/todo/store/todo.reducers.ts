import {TodoActions} from "./todo.actions";
import {ReducerResult, Reducers} from "@ng-estate/store";
import {TodoState} from "./index";

export const TodoReducers: Reducers<TodoState> = {
  [TodoActions.fetchTodo]: (state): ReducerResult<TodoState> => ({...state, isLoading: true}),
  [TodoActions.todoFetched]: (state, todo): ReducerResult<TodoState> => ({...state, todo: {...todo}, isLoading: false})
}
