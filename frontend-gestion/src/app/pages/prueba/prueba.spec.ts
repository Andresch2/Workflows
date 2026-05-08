import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Prueba } from './prueba';

describe('Prueba', () => {
  let component: Prueba;
  let fixture: ComponentFixture<Prueba>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prueba]
    }).compileComponents();

    fixture = TestBed.createComponent(Prueba);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cambiar la clase CSS al hacer clic en el botón', () => {
    const caja = fixture.nativeElement.querySelector('#caja');
    const boton = fixture.nativeElement.querySelector('#btn-toggle');

    // 1. Estado inicial: NO debe tener la clase 'activada'
    expect(caja.classList.contains('activada')).toBeFalse();
    expect(caja.textContent).toContain('APAGADO');

    // 2. Simulamos el clic
    boton.click();
    fixture.detectChanges(); //Sincronizar HTML

    // 3. Estado final: SÍ debe tener la clase 'activada'
    expect(caja.classList.contains('activada')).toBeTrue();
    expect(caja.textContent).toContain('ENCENDIDO');
  });
});