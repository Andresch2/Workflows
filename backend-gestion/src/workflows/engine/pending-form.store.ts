import { Injectable, Logger } from '@nestjs/common';

/**
 * PendingFormStore: Almacén en memoria de formularios pendientes de respuesta.
 */
@Injectable()
export class PendingFormStore {
  private readonly logger = new Logger(PendingFormStore.name);
  private readonly store = new Map<string, { executionId: string; workflowId: string }>();

  /**
   * Registra un formulario pendiente antes de pausar la ejecución.
   */
  register(nodeId: string, executionId: string, workflowId: string): void {
    this.store.set(nodeId, { executionId, workflowId });
    this.logger.log(
      `Formulario pendiente registrado: nodeId=${nodeId}, executionId=${executionId}`,
    );
  }

  /**
   * Busca el executionId pendiente para un nodo dado.
   * Retorna null si no hay ejecución pendiente.
   */
  resolve(nodeId: string): { executionId: string; workflowId: string } | null {
    return this.store.get(nodeId) || null;
  }

  /**
   * Elimina el registro una vez que el formulario ha sido respondido.
   */
  remove(nodeId: string): void {
    this.store.delete(nodeId);
    this.logger.log(`Formulario pendiente eliminado: nodeId=${nodeId}`);
  }
}
