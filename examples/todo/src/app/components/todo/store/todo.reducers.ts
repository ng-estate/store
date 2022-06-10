import {TodoActions} from "./todo.actions";
import {ReducerResult, Reducers} from "@ng-estate/store/internal";
import {MappedTodo, TodoState} from "./index";

export const TodoReducers: Reducers<TodoState> = {
  [TodoActions.fetchTodo]: (state): ReducerResult<TodoState> => ({...state, isLoading: true}),
  [TodoActions.todoFetched]: (state, todo: MappedTodo): ReducerResult<TodoState> => ({...state, todo: {...todo}, isLoading: false})
}
