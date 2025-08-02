import { Component, ViewChild } from '@angular/core';

import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ChartComponent,
  ApexStroke
} from "ng-apexcharts";
import { NgApexchartsModule } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
}

@Component({
  selector: 'app-risk',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './risk.html',
  styleUrl: './risk.css'
})


export class Risk {
  @ViewChild("chart") chart: any;
  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [79],
      chart: {
        height: 350,
        type: "radialBar",
        offsetY: -10
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          dataLabels: {
            name: {
              fontSize: "16px",
              color: undefined,
              offsetY: 120
            },
            value: {
              offsetY: 76,
              fontSize: "22px",
              color: undefined,
              formatter: function(val) {
                return val + "";
              }
            }
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'horizontal',
          gradientToColors: ['#ef4444'], // red-600
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: '#22c55e', // green-500
              opacity: 1
            },
            {
              offset: 20,
              color: '#FFDE21', // green-500
              opacity: 1
            },
            {
              offset: 100,
              color: '#ef4444', // red-600
              opacity: 1
            }
          ]
        },
      },
      stroke: {
        dashArray: 4
      },
      labels: ["Risk Score"]
    };
  }
}
