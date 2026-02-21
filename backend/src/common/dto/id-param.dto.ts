import { Matches } from 'class-validator';
import { CUID_REGEX } from '../constants/validation.constants';

export class IdParamDto {
  @Matches(CUID_REGEX, { message: 'Invalid resource id format' })
  id!: string;
}
