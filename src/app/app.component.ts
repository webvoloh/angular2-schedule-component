import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  /* Intervals object example */
  public blocks = [
    {
      desc : 'Monday',
      intervals : [
        {
          begin: 32400,
          end : 46800,
          type: 1
        },
        {
          begin: 49500,
          end: 63900,
          type: 2
        }
      ]
    },
    {
      desc : 'Tuesday',
      intervals : [
        {
          begin: 32400,
          end : 46800,
          type: 1
        },
        {
          begin: 49500,
          end: 63900,
          type: 2
        }
      ]
    },
    {
      desc : 'Wednesday',
      intervals : [
        {
          begin: 32400,
          end : 46800,
          type: 1
        },
        {
          begin: 49500,
          end: 63900,
          type: 2
        }
      ]
    },
    {
      desc : 'Thursday',
      intervals : [
        {
          begin: 32400,
          end : 46800,
          type: 1
        },
        {
          begin: 49500,
          end: 63900,
          type: 2
        }
      ]
    },
    {
      desc : 'Friday',
      intervals : [
        {
          begin: 32400,
          end : 46800,
          type: 1
        },
        {
          begin: 49500,
          end: 63900,
          type: 2
        }
      ]
    },
  ];
}
