import { List } from './../../models/list.model';
import { TaskService } from './../../task.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Task } from 'src/app/models/task.model';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {

  // Will be changed later with models
  lists: List[];
  tasks: Task[];

  selectedListId: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      if (params.listId) {
        this.selectedListId = params.listId;
        this.taskService.getTasks(params.listId).subscribe((tasks: Task[]) => {
          this.tasks = tasks;
        });
      } else {
        this.tasks = undefined;
      }
    }
    );

    this.taskService.getLists().subscribe((lists: List[]) => {
      this.lists = lists;
    });
  }

  onTaskClick(task: Task) {
    // Set task to competed (line-through)
    this.taskService.complete(task).subscribe(() => {
      // !task.completed allows to 'uncomplete' tasks
      task.completed = !task.completed;
    });
  }

  onDeleteListClick() {
    this.taskService.deleteList(this.selectedListId).subscribe(() => {
      this.router.navigate(['/lists']);
    });
  }

  onDeleteTaskClick(id: string) {
    this.taskService.deleteTask(this.selectedListId, id).subscribe(() => {
      // this.router.navigate(['/lists']);
      this.tasks = this.tasks.filter(val => val._id !== id);
    });
  }

}
