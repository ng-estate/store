import { Component } from '@angular/core';
import {StatusState} from "./store";
import {Store} from "@ng-estate/store/internal";
import {StatusSelectors} from "./store/status.selectors";
import {Observable} from "rxjs";

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent {
  public status$: Observable<boolean>;

  constructor(private readonly store: Store<StatusState>) {
    this.status$ = this.store.select$(StatusSelectors.getStatus);
  }
}
