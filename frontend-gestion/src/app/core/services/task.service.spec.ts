import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { environment } from '../../../environments/environment';
import { CreateTaskDto, Task, TaskStatus } from '../models/task.model';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe obtener la lista de tareas (getTasks)', () => {
    const mockResponse = {
      data: [{ id: '1', title: 'Tarea 1', status: TaskStatus.PENDIENTE } as Task],
      total: 1,
      hasNextPage: false
    };

    service.getTasks(1, 10).subscribe(res => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].title).toBe('Tarea 1');
    });

    const req = httpMock.expectOne(`${apiUrl}/tasks?page=1&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('debe filtrar tareas por projectId', () => {
    service.getTasks(1, 10, 'proj_123').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/tasks?page=1&limit=10&projectId=proj_123`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('debe crear una tarea (createTask)', () => {
    const dto: CreateTaskDto = { title: 'Nueva Tarea', projectId: 'p1', status: TaskStatus.PENDIENTE };
    const mockResponse = { id: 't1', ...dto } as Task;

    service.createTask(dto).subscribe(res => {
      expect(res.id).toBe('t1');
    });

    const req = httpMock.expectOne(`${apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockResponse);
  });

  it('debe actualizar una tarea (updateTask)', () => {
    const updateDto = { status: TaskStatus.COMPLETADA };
    
    service.updateTask('t1', updateDto).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/tasks/t1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updateDto);
    req.flush({});
  });

  it('debe eliminar una tarea (deleteTask)', () => {
    service.deleteTask('t1').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/tasks/t1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
