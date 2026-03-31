export function injectToHead(html: string, content: string) {
  const headCloseLine = html.match(/^( *)<\/head>/m)
  const indent = headCloseLine ? headCloseLine[1] : ''
  const indentedContent = content
    .replace(/\n$/m, '')
    .replaceAll('\n', `\n${indent}`)
    .replace(/^\n/m, '')
  return html.replace(
    new RegExp(`^${indent}</head>`, 'm'),
    `${indentedContent}\n${indent}</head>`,
  )
}
