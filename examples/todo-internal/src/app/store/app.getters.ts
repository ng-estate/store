import {AppSelectors} from "./app.selectors";
import {Getters} from "@ng-estate/store/internal";
import {AppState} from "./index";

export const AppGetters: Getters<AppState> = {
  [AppSelectors.getState]: (state) => state,
  [AppSelectors.getTodoList]: (state) => state.todoList,
  [AppSelectors.getIsLoading]: (state) => state.isLoading
}
