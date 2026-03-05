import { AnyNode } from './types';

export function validateTree(node: AnyNode | AnyNode[], parentType?: string) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((child) => validateTree(child, parentType));
    return;
  }

  const { type, props } = node;
  const children = props && 'children' in props ? props.children : undefined;

  switch (type) {
    case 'Workbook':
      if (parentType) throw new Error('<Workbook> must be the root element.');
      if (children) validateTree(children, 'Workbook');
      break;
    case 'Worksheet':
      if (parentType !== 'Workbook')
        throw new Error('<Worksheet> can only be a child of <Workbook>.');
      if (children) validateTree(children, 'Worksheet');
      break;
    case 'Group':
      if (parentType !== 'Worksheet' && parentType !== 'Group' && parentType !== 'Row') {
        throw new Error('<Group> can only be a child of <Worksheet>, <Row>, or another <Group>.');
      }
      if (children) validateTree(children, 'Group');
      break;
    case 'Column':
      if (parentType !== 'Worksheet')
        throw new Error('<Column> must be a direct child of <Worksheet>.');
      if (children) throw new Error('<Column> cannot have children.');
      break;
    case 'Row':
      if (parentType !== 'Worksheet' && parentType !== 'Group') {
        throw new Error('<Row> can only be a child of <Worksheet> or <Group>.');
      }
      if (children) validateTree(children, 'Row');
      break;
    case 'Cell':
      if (parentType !== 'Row' && parentType !== 'Group') {
        throw new Error('<Cell> can only be a child of <Row> or <Group>.');
      }
      if (children) validateTree(children, 'Cell');
      break;
    case 'Image':
      if (parentType !== 'Worksheet' && parentType !== 'Cell') {
        throw new Error('<Image> can only be a child of <Worksheet> or <Cell>.');
      }
      if (children) throw new Error('<Image> cannot have children.');
      break;
    case 'Template':
      if (parentType !== 'Worksheet' && parentType !== 'Group') {
        throw new Error('<Template> can only be a child of <Worksheet> or <Group>.');
      }
      if (children) throw new Error('<Template> cannot have children.');
      break;
  }
}
