import {TodoSelectors} from "./todo.selectors";
import {Getters} from "@ng-estate/store/internal";
import {TodoState} from "./index";

export const TodoGetters: Getters<TodoState> = {
  [TodoSelectors.getState]: (state) => state,
  [TodoSelectors.getIsLoading]: (state) => state.isLoading
}
