import { WebRequestService } from './web-request.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private webRequestService: WebRequestService) { }

  createList(title: string) {
    // Send a web request to send a list
    return this.webRequestService.post('lists', {title});
  }

  getLists() {
    return this.webRequestService.get('lists');
  }

  getTasks(listId: string) {
    return this.webRequestService.get(`lists/${listId}/tasks`);
  }

  createTask(title: string, listId: string) {
    // Send a web request to send a task
    return this.webRequestService.post(`lists/${listId}/tasks`, {title});
  }
}
