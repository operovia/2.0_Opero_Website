/** Merge tags available in invitation and reminder emails. */
export const mergeTagHelp = "You can use {name} for the recipient's name and {survey} for the survey title.";

/** Fills {name} and {survey} in an email subject or message. Unknown tags are left as typed. */
export function fillMergeTags(template: string, values: { name: string; survey: string }): string {
  return template.replace(/\{(name|survey)\}/g, (_, tag: 'name' | 'survey') => (tag === 'name' ? values.name.trim() || 'there' : values.survey));
}
