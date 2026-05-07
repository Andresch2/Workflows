import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService } from './project.service';
import { environment } from '@/environments/environment';
import { CreateProjectDto, Project } from '../models/project.model';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe obtener la lista de proyectos (getProjects)', () => {
    const mockResponse = {
      data: [{ id: '1', name: 'Project 1' } as Project],
      total: 1,
      hasNextPage: false
    };

    service.getProjects(1, 10).subscribe(res => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].name).toBe('Project 1');
    });

    const req = httpMock.expectOne(`${apiUrl}/projects?page=1&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('debe obtener un proyecto por ID (getProjectById)', () => {
    const mockProject = { id: '123', name: 'Test Project' } as Project;

    service.getProjectById('123').subscribe(project => {
      expect(project.id).toBe('123');
    });

    const req = httpMock.expectOne(`${apiUrl}/projects/123`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProject);
  });

  it('debe crear un proyecto (createProject)', () => {
    const dto: CreateProjectDto = { name: 'New Project' };
    const mockResponse = { id: 'new-id', ...dto } as Project;

    service.createProject(dto).subscribe(res => {
      expect(res.id).toBe('new-id');
    });

    const req = httpMock.expectOne(`${apiUrl}/projects`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('debe eliminar un proyecto (deleteProject)', () => {
    service.deleteProject('123').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/projects/123`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
