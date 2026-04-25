import { logger } from '../utils/logger';

export async function attemptJsonRepair(
  invalidOutput: string, 
  schema: any, 
  callGemini: (prompt: string) => Promise<any>
): Promise<any> {
  logger.info('Attempting JSON repair...');
  
  const repairPrompt = `
The following output was expected to be valid JSON matching a specific schema, but it failed to parse or validate.
Please reformat the content into valid JSON strictly following the schema.

### INVALID OUTPUT:
${invalidOutput}

### REQUIRED SCHEMA:
${JSON.stringify(schema, null, 2)}

Strictly return ONLY the repaired JSON.
`;

  return await callGemini(repairPrompt);
}
