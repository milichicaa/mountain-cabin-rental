import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale,
  Legend, Tooltip, PieController, ArcElement
} from 'chart.js';
import { StatsService } from '../services/stats.service';

Chart.register(
  BarController, BarElement, CategoryScale, LinearScale,
  Legend, Tooltip, PieController, ArcElement
);

// rezultat /stats/owner/monthly
type MonthlyResp = {
  months: number[]; // [1..12]
  cabins: { id: string; name: string; data: number[] }[];
};

// rezultat /stats/owner/weekend
type WeekendRow = { cabinId: string; name: string; weekend: number; weekday: number };

@Component({
  standalone: true,
  selector: 'app-stats',
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics-owner.component.html',
  styleUrls: ['./statistics-owner.component.css'] // <-- DODATO
})
export class StatisticsOwnerComponent implements OnInit, OnDestroy {
  private stats = inject(StatsService);

  barChart?: Chart;
  pieChart?: Chart;

  year = new Date().getFullYear();

  // dropdown + pie data
  cabins: { id: string; name: string }[] = [];
  selectedCabinId: string | null = null;
  weekendData: Record<string, { weekend: number; weekday: number; name: string }> = {};

  ngOnInit() {
    this.loadMonthly();
    this.loadWeekend();
  }

  ngOnDestroy() {
    this.barChart?.destroy();
    this.pieChart?.destroy();
  }

  // ---- BAR (mesečno) ----
  loadMonthly() {
    this.stats.ownerMonthly(this.year).subscribe(res => {
      this.cabins = res.cabins.map(c => ({ id: c.id, name: c.name }));
      if (!this.selectedCabinId && this.cabins.length) this.selectedCabinId = this.cabins[0].id;
      this.renderBar(res);
      this.renderPie(); // ako su weekend podaci već tu
    });
  }

  renderBar(res: MonthlyResp) {
    const ctx = (document.getElementById('barMonthly') as HTMLCanvasElement).getContext('2d')!;
    this.barChart?.destroy();

    const palette = [
      'rgba(59,130,246,0.7)',  // plava
      'rgba(16,185,129,0.7)',  // zelena
      'rgba(234,179,8,0.7)',   // žuta
      'rgba(244,63,94,0.7)',   // crvena
      'rgba(139,92,246,0.7)'   // ljubičasta
    ];

    const datasets = res.cabins.map((c, i) => ({
      label: c.name,
      data: c.data,
      backgroundColor: palette[i % palette.length],
      borderWidth: 0
    }));

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: res.months.map(m => ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec'][m-1]),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: { legend: { position: 'top' } }
      }
    });
  }

  loadWeekend() {
    this.stats.ownerWeekend(this.year).subscribe(rows => {
      this.weekendData = {};
      rows.forEach(r => this.weekendData[r.cabinId] = {
        weekend: r.weekend, weekday: r.weekday, name: r.name
      });
      if (!this.selectedCabinId && rows.length) this.selectedCabinId = rows[0].cabinId;
      this.renderPie();
    });
  }

  renderPie() {
    if (!this.selectedCabinId) return;
    const d = this.weekendData[this.selectedCabinId];
    if (!d) return;

    const ctx = (document.getElementById('pieWeekend') as HTMLCanvasElement).getContext('2d')!;
    this.pieChart?.destroy();

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Vikend', 'Radna nedelja'],
        datasets: [{
          data: [d.weekend, d.weekday],
          backgroundColor: ['#22c55e', '#60a5fa'], // zelena / plava
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } }
      }
    });
  }
}
