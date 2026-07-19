from pathlib import Path

path = Path('components/wonderlab/lab-interact.vue')
source = path.read_text(encoding='utf-8')


def replace_once(old: str, new: str, label: str) -> None:
    global source
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'Expected one {label}, found {count}.')
    source = source.replace(old, new, 1)


replace_once(
    '''            </div>

            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-base-content/55">
                {{ sortedComponents.length }} of {{ componentCount }} exhibits
              </p>''',
    '''            </div>

            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="reviewFilter"
                class="select select-bordered select-sm bg-base-200"
                aria-label="Filter WonderLab components by review coverage"
              >
                <option value="all">All review coverage</option>
                <option value="reviewed">Reviewed</option>
                <option value="unreviewed">No reviews yet</option>
              </select>

              <select
                v-model="discoveryFilter"
                class="select select-bordered select-sm bg-base-200"
                aria-label="Filter WonderLab components by discovery state"
              >
                <option value="all">All discovery states</option>
                <option value="discovered">In current source</option>
                <option value="missing">Missing from source</option>
              </select>
            </div>

            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-base-content/55">
                {{ sortedComponents.length }} of {{ componentCount }} exhibits
              </p>''',
    'coverage filter controls',
)

replace_once(
    '''  type WonderLabCollectionView,
  type WonderLabMuseumQueryState,
  type WonderLabQuery,
  type WonderLabStatusFilter,''',
    '''  type WonderLabCollectionView,
  type WonderLabDiscoveryFilter,
  type WonderLabMuseumQueryState,
  type WonderLabQuery,
  type WonderLabReviewFilter,
  type WonderLabStatusFilter,''',
    'coverage filter type imports',
)

replace_once(
    '''const statusFilter = computed<WonderLabStatusFilter>({
  get: () => museumQueryState.value.status,
  set: (status) => setMuseumQuery({ status }, 'push'),
})''',
    '''const statusFilter = computed<WonderLabStatusFilter>({
  get: () => museumQueryState.value.status,
  set: (status) => setMuseumQuery({ status }, 'push'),
})

const reviewFilter = computed<WonderLabReviewFilter>({
  get: () => museumQueryState.value.reviews,
  set: (reviews) => setMuseumQuery({ reviews }, 'push'),
})

const discoveryFilter = computed<WonderLabDiscoveryFilter>({
  get: () => museumQueryState.value.discovery,
  set: (discovery) => setMuseumQuery({ discovery }, 'push'),
})''',
    'coverage filter state',
)

replace_once(
    '''    Boolean(museumQueryState.value.folder) ||
    museumQueryState.value.status !== 'all',''',
    '''    Boolean(museumQueryState.value.folder) ||
    museumQueryState.value.status !== 'all' ||
    museumQueryState.value.reviews !== 'all' ||
    museumQueryState.value.discovery !== 'all',''',
    'active filter detection',
)

replace_once(
    '''  if (statusFilter.value !== 'all') {
    result = result.filter(
      (component) => componentStatus(component) === statusFilter.value,
    )
  }

  if (searchQuery.value.trim()) {''',
    '''  if (statusFilter.value !== 'all') {
    result = result.filter(
      (component) => componentStatus(component) === statusFilter.value,
    )
  }

  if (reviewFilter.value !== 'all') {
    result = result.filter((component) => {
      const hasReviews = (component.reviewCount ?? 0) > 0
      return reviewFilter.value === 'reviewed' ? hasReviews : !hasReviews
    })
  }

  if (discoveryFilter.value !== 'all') {
    result = result.filter((component) =>
      discoveryFilter.value === 'discovered'
        ? component.isDiscovered === true
        : component.isDiscovered !== true,
    )
  }

  if (searchQuery.value.trim()) {''',
    'coverage filtering',
)

replace_once(
    '''      search: '',
      folder: '',
      status: 'all',''',
    '''      search: '',
      folder: '',
      status: 'all',
      reviews: 'all',
      discovery: 'all',''',
    'coverage filter clearing',
)

path.write_text(source, encoding='utf-8')
