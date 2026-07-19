from __future__ import annotations

from pathlib import Path

PATH = Path("components/wonderlab/lab-interact.vue")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} block, found {count}.")
    return source.replace(old, new, 1)


def main() -> None:
    source = PATH.read_text(encoding="utf-8")

    source = replace_once(
        source,
        """                <option value=\"UNREVIEWED\">Unreviewed</option>
                <option value=\"WORKING\">Working</option>
                <option value=\"UNDER_CONSTRUCTION\">Building</option>
                <option value=\"BROKEN\">Broken</option>""",
        """                <option value=\"UNREVIEWED\">Unreviewed</option>
                <option value=\"WORKING\">Working</option>
                <option value=\"NEEDS_CONTEXT\">Needs context</option>
                <option value=\"UNDER_CONSTRUCTION\">Building</option>
                <option value=\"BROKEN\">Broken</option>
                <option value=\"RETIRED\">Retired</option>
                <option value=\"PREVIEW_UNSUPPORTED\">Preview unsupported</option>""",
        "status filter options",
    )

    source = replace_once(
        source,
        """import {
  getLegacyComponentStatus,
  legacyFieldsForComponentStatus,
  type LegacyComponentStatus,
} from '@/utils/wonderlab/componentStatus'""",
        """import {
  getComponentStatus,
  legacyFieldsForComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'""",
        "status import",
    )

    source = replace_once(
        source,
        """const statusOptions: Array<{
  value: LegacyComponentStatus
  label: string
}> = [
  { value: 'UNREVIEWED', label: 'Unreviewed' },
  { value: 'WORKING', label: 'Working' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under construction' },
  { value: 'BROKEN', label: 'Broken' },
]""",
        """const statusOptions: Array<{
  value: ComponentStatus
  label: string
}> = [
  { value: 'UNREVIEWED', label: 'Unreviewed' },
  { value: 'WORKING', label: 'Working' },
  { value: 'NEEDS_CONTEXT', label: 'Needs context' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under construction' },
  { value: 'BROKEN', label: 'Broken' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'PREVIEW_UNSUPPORTED', label: 'Preview unsupported' },
]""",
        "status options",
    )

    source = replace_once(
        source,
        """const selectedStatus = computed<LegacyComponentStatus>({
  get: () =>
    selectedComponent.value
      ? getLegacyComponentStatus(selectedComponent.value)
      : 'UNREVIEWED',
  set: (status) => {
    if (!selectedComponent.value) return
    Object.assign(
      selectedComponent.value,
      legacyFieldsForComponentStatus(status),
    )
  },
})""",
        """const selectedStatus = computed<ComponentStatus>({
  get: () =>
    selectedComponent.value
      ? getComponentStatus(selectedComponent.value)
      : 'UNREVIEWED',
  set: (status) => {
    if (!selectedComponent.value) return
    selectedComponent.value.status = status
    Object.assign(
      selectedComponent.value,
      legacyFieldsForComponentStatus(status),
    )
  },
})""",
        "selected status",
    )

    source = replace_once(
        source,
        """      const haystack = [
        component.componentName,
        component.folderName,
        component.title,
        component.notes,
      ]""",
        """      const haystack = [
        component.componentName,
        component.folderName,
        component.title,
        component.description,
        component.notes,
        component.category,
        component.statusReason,
        component.sourcePath,
      ]""",
        "search fields",
    )

    source = replace_once(
        source,
        """function componentStatus(component: PrismaComponent): LegacyComponentStatus {
  return getLegacyComponentStatus(component)
}

function statusLabel(status: LegacyComponentStatus): string {
  return statusOptions.find((option) => option.value === status)?.label || status
}

function statusShortLabel(status: LegacyComponentStatus): string {
  switch (status) {
    case 'WORKING':
      return 'ok'
    case 'UNDER_CONSTRUCTION':
      return 'wip'
    case 'BROKEN':
      return 'bug'
    default:
      return 'new'
  }
}

function statusBadgeClass(status: LegacyComponentStatus): string {
  switch (status) {
    case 'WORKING':
      return 'badge-success'
    case 'UNDER_CONSTRUCTION':
      return 'badge-warning'
    case 'BROKEN':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}""",
        """function componentStatus(component: PrismaComponent): ComponentStatus {
  return getComponentStatus(component)
}

function statusLabel(status: ComponentStatus): string {
  return statusOptions.find((option) => option.value === status)?.label || status
}

function statusShortLabel(status: ComponentStatus): string {
  switch (status) {
    case 'WORKING':
      return 'ok'
    case 'NEEDS_CONTEXT':
      return 'ctx'
    case 'UNDER_CONSTRUCTION':
      return 'wip'
    case 'BROKEN':
      return 'bug'
    case 'RETIRED':
      return 'old'
    case 'PREVIEW_UNSUPPORTED':
      return 'n/a'
    default:
      return 'new'
  }
}

function statusBadgeClass(status: ComponentStatus): string {
  switch (status) {
    case 'WORKING':
      return 'badge-success'
    case 'NEEDS_CONTEXT':
      return 'badge-info'
    case 'UNDER_CONSTRUCTION':
      return 'badge-warning'
    case 'BROKEN':
      return 'badge-error'
    case 'PREVIEW_UNSUPPORTED':
      return 'badge-secondary'
    default:
      return 'badge-ghost'
  }
}""",
        "status presentation helpers",
    )

    PATH.write_text(source, encoding="utf-8")


if __name__ == "__main__":
    main()
