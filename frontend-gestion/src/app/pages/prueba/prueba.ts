import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-prueba',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prueba.html',
  styleUrl: './prueba.scss',
})
export class Prueba {
  estaActivado = false;

  toggle() {
    this.estaActivado = !this.estaActivado;
  }
}


