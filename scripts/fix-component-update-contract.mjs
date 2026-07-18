import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')

  if (!source.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(path, source.replace(target, replacement), 'utf8')
}

replaceExact(
  'server/api/components/[id].patch.ts',
  `function optionalBoolean(value: unknown, field: string): boolean | undefined {`,
  `function componentNameValue(value: unknown): string {
  const name = requiredText(value, 'componentName', 255)

  if (!/^[a-zA-Z0-9\\s-]+$/.test(name)) {
    throw createError({
      statusCode: 400,
      message:
        '"componentName" may contain only alphanumeric characters, spaces, or hyphens.',
    })
  }

  return name
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {`,
  'Component name validator insertion',
)

replaceExact(
  'server/api/components/[id].patch.ts',
  `requiredText(body.componentName, 'componentName', 255)`,
  `componentNameValue(body.componentName)`,
  'Component name validator call',
)

replaceExact(
  'stores/helpers/componentHelper.ts',
  `      body: JSON.stringify({
        ...component,
        notes: component.notes || '',
        artImageId: component.artImageId || null,
      }),`,
  `      body: JSON.stringify({
        componentName: component.componentName,
        folderName: component.folderName,
        isWorking: component.isWorking,
        underConstruction: component.underConstruction,
        isBroken: component.isBroken,
        title: component.title,
        notes: component.notes || null,
        artImageId: component.artImageId || null,
      }),`,
  'Component helper PATCH payload',
)

replaceExact(
  'stores/helpers/componentHelper.ts',
  `
export async function createOrUpdateComponent(
  component: Component,
  action: 'create' | 'update',
): Promise<Component> {
  const method = action === 'create' ? 'POST' : 'PATCH'
  const response = await performFetch<Component>('/api/components', {
    method,
    body: JSON.stringify(component),
  })

  if (!response.success || !response.data) {
    throw new Error(\`Failed to \${action} component: \${component.componentName}\`)
  }
  return response.data
}
`,
  ``,
  'obsolete Component create-or-update helper',
)

replaceExact(
  'stores/componentStore.ts',
  `  findComponentByName as helperFind,
  createOrUpdateComponent as helperCreateOrUpdate,
`,
  `  findComponentByName as helperFind,
`,
  'Component store helper import',
)

replaceExact(
  'stores/componentStore.ts',
  `
  async function createOrUpdateComponent(
    component: Component,
    action: 'create' | 'update',
  ) {
    const result = await helperCreateOrUpdate(component, action)

    if (action === 'create') {
      components.value.push(result)
    } else {
      const index = components.value.findIndex((entry) => entry.id === result.id)
      if (index !== -1) components.value[index] = result
    }

    return result
  }
`,
  ``,
  'obsolete Component store action',
)

replaceExact(
  'stores/componentStore.ts',
  `    findComponentByName,
    createOrUpdateComponent,
`,
  `    findComponentByName,
`,
  'obsolete Component store return entry',
)

replaceExact(
  'components/wonderlab/lab-interact.vue',
  `    const updated = await componentStore.createOrUpdateComponent(
      selectedComponent.value,
      'update',
    )`,
  `    const updated = await componentStore.updateComponent(
      selectedComponent.value,
    )`,
  'WonderLab Component save call',
)

replaceExact(
  'cypress/e2e/api/components.cy.ts',
  `  it('Update Component with Authentication', () => {`,
  `  it('Rejects server-owned Component update fields', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'PATCH',
      url: \`\${apiBase}/\${componentId}\`,
      headers: adminHeaders(adminToken),
      body: {
        id: 999999,
        createdAt: new Date(0).toISOString(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'Unsupported Component update fields',
      )
    })
  })

  it('Update Component with Authentication', () => {`,
  'Component protected-field Cypress test insertion',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| Prompt    | Create returned User, Bot, and ArtImage; GET fetched related art IDs; PATCH passed raw \`Partial<Prompt>\` through to Prisma, including owner and queue fields                                     | Added \`promptResourceSelect\`; Prompt POST/PATCH/GET return Prompt only. PATCH whitelists user-editable content, flags, and validated Bot/ArtImage links while the store sends only those fields. Related art remains on the existing art-by-prompt endpoint                |`,
  `| Prompt    | Create returned User, Bot, and ArtImage; GET fetched related art IDs; PATCH passed raw \`Partial<Prompt>\` through to Prisma, including owner and queue fields                                     | Added \`promptResourceSelect\`; Prompt POST/PATCH/GET return Prompt only. PATCH whitelists user-editable content, flags, and validated Bot/ArtImage links while the store sends only those fields. Related art remains on the existing art-by-prompt endpoint                |
| Component | WonderLab Save called nonexistent collection PATCH; a duplicate name route allowed timestamps; the ID route accepted model-shaped bodies and returned ArtImage detail | WonderLab now uses the validated ID PATCH. The helper sends only editable fields, the duplicate name route and create-or-update abstraction are removed, server-owned fields are rejected, and mutations return Component scalars |`,
  'Component audit row insertion',
)
