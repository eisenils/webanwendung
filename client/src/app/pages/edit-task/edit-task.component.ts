import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent implements OnInit {

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  listId: string;
  taskId: string;

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
        this.listId = params.listId;
        this.taskId = params.taskId;
      }
    );
  }

  updateTask(title: string) {
    this.taskService.updateTask(this.listId, this.taskId, title).subscribe(() => {
      this.router.navigate(['/lists', this.listId]);
    });
  }

}
