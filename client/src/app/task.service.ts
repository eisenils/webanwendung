import { WebRequestService } from './web-request.service';
import { Injectable } from '@angular/core';
import { Task } from './models/task.model';

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

  updateList(id: string, title: string) {
    // Send a web request to update a list
    return this.webRequestService.patch(`lists/${id}`, {title});
  }

  deleteList(id: string) {
    return this.webRequestService.delete(`lists/${id}`);
  }

  getTasks(listId: string) {
    return this.webRequestService.get(`lists/${listId}/tasks`);
  }

  createTask(title: string, listId: string) {
    // Send a web request to send a task
    return this.webRequestService.post(`lists/${listId}/tasks`, {title});
  }

  complete(task: Task) {
    return this.webRequestService.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    });
  }
  updateTask(listId: string, taskId: string, title: string) {
    // Send a web request to update a task
    return this.webRequestService.patch(`lists/${listId}/tasks/${taskId}`, {title});
  }

  deleteTask(listId: string, taskId: string) {
    return this.webRequestService.delete(`lists/${listId}/tasks/${taskId}`);
  }
}
