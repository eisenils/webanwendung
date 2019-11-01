import { TaskService } from './../../task.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {

  constructor(private taskService: TaskService) { }

  ngOnInit() {
  }

  createNewList(){
    this.taskService.createList('010').subscribe((response: any) => {
      console.log(response);
    })
  }
}
