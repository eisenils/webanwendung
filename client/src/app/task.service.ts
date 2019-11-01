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
}
