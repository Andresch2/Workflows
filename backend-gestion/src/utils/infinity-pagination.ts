import { InfinityPaginationResponseDto } from './dto/infinity-pagination-response.dto';
import { IPaginationOptions } from './types/pagination-options';

export const infinityPagination = <T>(
  data: T[],
  options: IPaginationOptions,
  total?: number,
): InfinityPaginationResponseDto<T> => {
  return {
    data,
    hasNextPage: total
      ? options.page * options.limit < total
      : data.length === options.limit,
    total,
  };
};
