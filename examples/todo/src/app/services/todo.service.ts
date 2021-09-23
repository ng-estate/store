import {Injectable} from '@angular/core';
import {Observable, of} from "rxjs";
import {delay} from "rxjs/operators";

@Injectable()
export class TodoService {
  public getTodoList(): Observable<Array<{ id: number, title: string }>> {
    return of([{id: 1, title: 'Hello'}, {id: 2, title: 'World'}]).pipe(delay(1300));
  }
}
