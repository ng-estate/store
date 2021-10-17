import {Injectable} from '@angular/core';
import {Observable, of} from "rxjs";
import {delay} from "rxjs/operators";
import {Todo} from "../components/todo/store";

// Mock constants
const TODO_LIST_PREVIEW: Array<Partial<Todo>> = [{id: 1, title: 'Hello'}, {id: 2, title: 'World'}];
const TODO_LIST: Array<Todo> = [{id: 1, title: 'Hello', description: 'High priority', timestamp: 1632595567158}, {
  id: 2,
  title: 'World',
  description: 'Not urgent',
  timestamp: 1632509179114
}];

@Injectable({providedIn: 'root'})
export class TodoService {
  public getTodoList(): Observable<Array<Partial<Todo>>> {
    return of(TODO_LIST_PREVIEW).pipe(delay(1300));
  }

  public getById(id: number): Observable<Todo> {
    const todo = TODO_LIST.find(todo => todo.id === id) as Todo;

    return of(todo).pipe(delay(1300));
  }
}
