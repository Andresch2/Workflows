import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NodeHandler, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * DatabaseHandler: Ejecuta operaciones CR(U)(D) en tablas de base de datos habilitadas.
 * Incluye validación de tabla y columnas contra whitelists.
 */
@Injectable()
export class DatabaseHandler implements NodeHandler {
  private readonly logger = new Logger(DatabaseHandler.name);

  // Whitelist de tablas seguras para operar
  private readonly ALLOWED_TABLES = ['project', 'task', 'workflow'];

  // Whitelist de columnas válidas por tabla
  private readonly ALLOWED_COLUMNS: Record<string, string[]> = {
    project: ['name', 'description', 'startDate', 'endDate'],
    task: ['title', 'description', 'status', 'projectId'],
    workflow: ['title', 'description', 'triggerType'],
  };

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly templateUtil: TemplateUtil,
  ) { }

  async execute(
    node: any,
    context: WorkflowContext,
    _step: any,
  ): Promise<any> {
    // Procesar la configuración con el motor de plantillas
    const config = this.templateUtil.process(node.config || {}, context);
    const nombre = config.nombre || 'Sin nombre';
    const json = config.json || {};
    const tableName: string = json.table || '';
    const operation: string = json.operation || 'READ';
    const fields: string[] = json.fields || [];
    const data: Record<string, any> = config.data || {};

    this.logger.log(
      `DatabaseHandler: ejecutando operación "${operation}" en tabla "${tableName}" en nodo ${node.id}`,
    );

    if (!tableName) {
      return {
        status: 'error',
        nombre,
        message: 'Sin tabla configurada. Selecciona una tabla.',
      };
    }

    if (!this.ALLOWED_TABLES.includes(tableName)) {
      return {
        status: 'error',
        nombre,
        message: `Acceso denegado. La tabla "${tableName}" no está permitida.`,
      };
    }

    try {
      if (operation === 'CREATE') {
        // Filtrar datos vacíos y validar nombres de columna
        const dataToInsert = Object.entries(data).reduce(
          (acc, [key, val]) => {
            if (val !== '' && val !== null && val !== undefined) {
              if (this.isValidColumnName(key, tableName)) {
                acc[key] = val;
              } else {
                this.logger.warn(
                  `DatabaseHandler: columna "${key}" no permitida en tabla "${tableName}", omitiendo`,
                );
              }
            }
            return acc;
          },
          {} as Record<string, any>,
        );

        if (Object.keys(dataToInsert).length > 0) {
          const keys = Object.keys(dataToInsert);
          const values = Object.values(dataToInsert);

          const columns = keys.map((k) => `"${k}"`).join(', ');
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

          const insertQuery = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`;
          const result = await this.dataSource.query(insertQuery, values);

          const insertedRow =
            Array.isArray(result) && result.length > 0 ? result[0] : result;
          return {
            status: 'success',
            nombre,
            operation,
            table: tableName,
            data: insertedRow,
            recordData: data,
          };
        } else {
          return {
            status: 'error',
            nombre,
            operation,
            message: 'No data properties provided for INSERT',
          };
        }
      } else if (operation === 'READ') {
        const safeFields =
          fields.length > 0
            ? fields
              .filter((f) => this.isValidColumnName(f, tableName) || f === 'id' || f === 'createdAt')
              .map((f) => `"${f}"`)
              .join(', ')
            : '*';

        const selectFields = safeFields || '*';
        const query = `SELECT ${selectFields} FROM "${tableName}" LIMIT 100`;
        const rows = await this.dataSource.query(query);

        return {
          status: 'success',
          nombre,
          operation,
          table: tableName,
          data: rows,
          recordData: data,
        };
      } else {
        return {
          status: 'error',
          nombre,
          message: `Operacion desconocida: ${operation}`,
        };
      }
    } catch (error: any) {
      this.logger.error(
        `Error en DatabaseHandler record "${nombre}" (tabla: ${tableName}): ${error.message}`,
      );
      return {
        status: 'error',
        nombre,
        operation,
        table: tableName,
        message: error.message,
      };
    }
  }

  /**
   * Valida que el nombre de columna esté en el whitelist de la tabla.
   */
  private isValidColumnName(column: string, table: string): boolean {
    const allowed = this.ALLOWED_COLUMNS[table];
    if (!allowed) return false;
    return allowed.includes(column);
  }
}
