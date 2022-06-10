import {Getters} from "@ng-estate/store/internal";
import {StatusState} from "./index";
import {StatusSelectors} from "./status.selectors";

export const StatusGetters: Getters<StatusState> = {
  [StatusSelectors.getStatus]: (state) => state.isDone
};
