// One bounded data contract for model output, human review, and publication.
const text = { type: 'string' };
const list = (items) => ({ type: 'array', items });
const object = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const blockSchema = object({
  type: { type: 'string', enum: ['heading', 'paragraph', 'list', 'table'] },
  text, items: list(text), headers: list(text), rows: list(list(text)), sourceIds: list(text),
});
export const draftSchema = object({
  title: text, description: text, summaryJa: text, uniqueValueJa: text,
  blocks: list(blockSchema), questionsJa: list(text),
  claims: list(object({ claim: text, sourceIds: list(text), evidence: text })),
});
export const reviewSchema = object({
  verdict: { type: 'string', enum: ['pass', 'revise'] },
  summaryJa: text, blockersJa: list(text), warningsJa: list(text),
});

export function assertSchema(value, schema, path = '$') {
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: object required`);
    for (const key of schema.required) if (!(key in value)) throw new Error(`${path}.${key}: required`);
    for (const key of Object.keys(value)) {
      if (!schema.properties[key]) throw new Error(`${path}.${key}: unexpected field`);
      assertSchema(value[key], schema.properties[key], `${path}.${key}`);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) throw new Error(`${path}: array required`);
    value.forEach((v, i) => assertSchema(v, schema.items, `${path}[${i}]`));
  } else if (typeof value !== schema.type) throw new Error(`${path}: ${schema.type} required`);
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`${path}: invalid value`);
}
