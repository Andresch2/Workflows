import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NodeHandler, NodeResult, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * DatabaseHandler: Ejecuta operaciones CRUD en tablas habilitadas.
 * Incluye validación de tabla y columnas contra whitelists.
 */
import { WorkflowsService } from '../../workflows.service';

@Injectable()
export class DatabaseHandler implements NodeHandler {
  private readonly logger = new Logger(DatabaseHandler.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly templateUtil: TemplateUtil,
    private readonly workflowsService: WorkflowsService,
  ) { }

  async execute(
    node: any,
    context: WorkflowContext,
    _step: any,
  ): Promise<NodeResult> {
    const configs = await this.workflowsService.getDatabaseConfigs();
    const config = this.templateUtil.process(node.config || {}, context);
    const nombre = config.nombre || node.name || 'Database';
    const json = config.json || {};
    const tableName: string = json.table || '';
    const operation: string = json.operation || 'READ';
    const fields: string[] = json.fields || [];
    const data: Record<string, any> = config.data || {};

    this.logger.log(
      `DatabaseHandler: "${operation}" en tabla "${tableName}" — nodo ${node.id}`,
    );

    if (!tableName) {
      return {
        status: 'failed',
        nodeId: node.id,
        nodeName: nombre,
        type: node.type,
        data: null,
        error: 'Sin tabla configurada. Selecciona una tabla.',
      };
    }

    const tableConfig = configs.find((c) => c.tableName === tableName);

    if (!tableConfig) {
      return {
        status: 'failed',
        nodeId: node.id,
        nodeName: nombre,
        type: node.type,
        data: null,
        error: `Acceso denegado. La tabla "${tableName}" no está permitida o no existe.`,
      };
    }

    try {
      if (operation === 'CREATE') {
        const dataToInsert = Object.entries(data).reduce(
          (acc, [key, val]) => {
            if (val !== '' && val !== null && val !== undefined) {
              if (this.isValidColumnName(key, tableConfig)) {
                acc[key] = val;
              } else {
                this.logger.warn(
                  `DatabaseHandler: columna "${key}" no permitida en tabla "${tableName}"`,
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
          const insertedRow = Array.isArray(result) && result.length > 0 ? result[0] : result;

          return {
            status: 'success',
            nodeId: node.id,
            nodeName: nombre,
            type: node.type,
            data: insertedRow,
            meta: { operation, table: tableName },
          };
        } else {
          return {
            status: 'failed',
            nodeId: node.id,
            nodeName: nombre,
            type: node.type,
            data: null,
            error: 'No data properties provided for INSERT',
          };
        }
      } else if (operation === 'READ') {
        const safeFields =
          fields.length > 0
            ? fields
              .filter((f) => this.isValidColumnName(f, tableConfig) || f === 'id' || f === 'createdAt')
              .map((f) => `"${f}"`)
              .join(', ')
            : '*';

        const selectFields = safeFields || '*';
        const query = `SELECT ${selectFields} FROM "${tableName}" LIMIT 100`;
        const rows = await this.dataSource.query(query);

        return {
          status: 'success',
          nodeId: node.id,
          nodeName: nombre,
          type: node.type,
          data: rows,
          meta: { operation, table: tableName, rowCount: rows.length },
        };
      } else if (operation === 'UPDATE') {
        const id = data.id;
        if (!id) {
          return {
            status: 'failed',
            nodeId: node.id,
            nodeName: nombre,
            type: node.type,
            data: null,
            error: 'Se requiere un ID ("id") en los datos para la operación UPDATE.',
          };
        }

        const dataToUpdate = Object.entries(data).reduce(
          (acc, [key, val]) => {
            if (key !== 'id' && val !== '' && val !== null && val !== undefined) {
              if (this.isValidColumnName(key, tableConfig)) {
                acc[key] = val;
              } else {
                this.logger.warn(
                  `DatabaseHandler: columna "${key}" no permitida en tabla "${tableName}" durante UPDATE`,
                );
              }
            }
            return acc;
          },
          {} as Record<string, any>,
        );

        if (Object.keys(dataToUpdate).length > 0) {
          const keys = Object.keys(dataToUpdate);
          const values = Object.values(dataToUpdate);
          values.push(id); // push id para el WHERE
          
          const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
          const updateQuery = `UPDATE "${tableName}" SET ${sets} WHERE id = $${values.length} RETURNING *`;
          const result = await this.dataSource.query(updateQuery, values);
          
          const updatedRow = Array.isArray(result) && result.length > 0 ? result[0] : (result || { id, updated: true });

          return {
            status: 'success',
            nodeId: node.id,
            nodeName: nombre,
            type: node.type,
            data: updatedRow,
            meta: { operation, table: tableName },
          };
        } else {
          return {
            status: 'failed',
            nodeId: node.id,
            nodeName: nombre,
            type: node.type,
            data: null,
            error: 'No valid data properties provided for UPDATE',
          };
        }
      } else if (operation === 'DELETE') {
        const id = data.id;
        if (!id) {
          return {
            status: 'failed',
            nodeId: node.id,
            nodeName: nombre,
            type: node.type,
            data: null,
            error: 'Se requiere un ID ("id") en los datos para la operación DELETE.',
          };
        }

        const deleteQuery = `DELETE FROM "${tableName}" WHERE id = $1 RETURNING *`;
        const result = await this.dataSource.query(deleteQuery, [id]);
        
        const deletedRow = Array.isArray(result) && result.length > 0 ? result[0] : { id, deleted: true };

        return {
          status: 'success',
          nodeId: node.id,
          nodeName: nombre,
          type: node.type,
          data: deletedRow,
          meta: { operation, table: tableName },
        };
      } else {
        return {
          status: 'failed',
          nodeId: node.id,
          nodeName: nombre,
          type: node.type,
          data: null,
          error: `Operación desconocida: ${operation}`,
        };
      }
    } catch (error: any) {
      this.logger.error(`Error en DatabaseHandler "${nombre}": ${error.message}`);
      return {
        status: 'failed',
        nodeId: node.id,
        nodeName: nombre,
        type: node.type,
        data: null,
        error: error.message,
      };
    }
  }

  private isValidColumnName(column: string, tableConfig: any): boolean {
    if (!tableConfig || !tableConfig.editableFields) return false;
    // Permitir columnas explícitas en editableFields Y las configuradas en jsonConfig.fields
    const hasInEditable = tableConfig.editableFields.some((f: any) => f.key === column);
    const hasInJsonConfig = Array.isArray(tableConfig.jsonConfig?.fields) && tableConfig.jsonConfig.fields.includes(column);
    return hasInEditable || hasInJsonConfig;
  }
}
