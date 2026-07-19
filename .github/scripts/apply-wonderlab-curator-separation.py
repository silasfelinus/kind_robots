from pathlib import Path

path = Path('components/wonderlab/lab-interact.vue')
source = path.read_text(encoding='utf-8')

old = '''          <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <div
              class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 class="text-lg font-black">Curator Notes and Status</h3>

                <p class="text-sm text-base-content/60">
                  Public notes remain readable; editing is restricted to admins.
                </p>
              </div>

              <button
                v-if="isAdmin"
                class="btn btn-sm btn-primary rounded-xl text-white"
                type="button"
                :disabled="isSavingComponent"
                @click="saveSelectedComponent"
              >
                <span
                  v-if="isSavingComponent"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:check" class="h-4 w-4" />
                Save
              </button>
            </div>

            <div v-if="isAdmin" class="grid gap-4 lg:grid-cols-[1fr_16rem]">
              <textarea
                v-model="selectedComponent.notes"
                class="textarea textarea-bordered min-h-32 w-full bg-base-100"
                placeholder="Notes, TODOs, dramatic warnings..."
              />

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Canonical status</span>
                </span>
                <select
                  v-model="selectedStatus"
                  class="select select-bordered bg-base-100"
                >
                  <option
                    v-for="option in statusOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <span class="mt-2 text-xs leading-relaxed text-base-content/50">
                  One status replaces all three legacy flags.
                </span>
              </label>
            </div>

            <div
              v-else
              class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm whitespace-pre-wrap text-base-content/75"
            >
              {{ selectedComponent.notes || 'No curator notes available.' }}
            </div>
          </section>'''

new = '''          <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-xs font-black uppercase tracking-widest text-primary">
              About this exhibit
            </p>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75">
              {{
                selectedComponent.description ||
                selectedComponent.statusReason ||
                'A public exhibit description has not been written yet.'
              }}
            </p>

            <dl class="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                <dt class="font-black uppercase text-base-content/45">Category</dt>
                <dd class="mt-1 text-base-content/75">
                  {{ selectedComponent.category || selectedComponent.folderName }}
                </dd>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                <dt class="font-black uppercase text-base-content/45">Discovery</dt>
                <dd class="mt-1 text-base-content/75">
                  {{
                    selectedComponent.isDiscovered === true
                      ? 'Present in current source'
                      : 'Missing from current source'
                  }}
                </dd>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                <dt class="font-black uppercase text-base-content/45">Preview</dt>
                <dd class="mt-1 text-base-content/75">
                  {{ selectedComponent.previewMode || 'Fixture catalog' }}
                </dd>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                <dt class="font-black uppercase text-base-content/45">Source</dt>
                <dd class="mt-1 break-all font-mono text-base-content/75">
                  {{
                    selectedComponent.sourcePath ||
                    `${selectedComponent.folderName}/${selectedComponent.componentName}.vue`
                  }}
                </dd>
              </div>
            </dl>
          </section>

          <details
            v-if="isAdmin"
            class="rounded-2xl border border-primary/25 bg-primary/5 p-4"
          >
            <summary class="cursor-pointer font-black text-primary">
              Curator controls
            </summary>

            <div class="mt-4 flex flex-col gap-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <p class="max-w-2xl text-sm leading-relaxed text-base-content/60">
                  Edit public exhibit copy and status separately from internal curator notes.
                  Canonical source identity remains controlled by reconciliation.
                </p>

                <button
                  class="btn btn-sm btn-primary rounded-xl text-white"
                  type="button"
                  :disabled="isSavingComponent"
                  @click="saveSelectedComponent"
                >
                  <span
                    v-if="isSavingComponent"
                    class="loading loading-spinner loading-xs"
                  />
                  <Icon v-else name="kind-icon:check" class="h-4 w-4" />
                  Save curator changes
                </button>
              </div>

              <div class="grid gap-4 lg:grid-cols-2">
                <label class="form-control">
                  <span class="label-text mb-2 font-bold">Public title</span>
                  <input
                    v-model="selectedComponent.title"
                    class="input input-bordered bg-base-100"
                    type="text"
                    maxlength="100"
                  />
                </label>

                <label class="form-control">
                  <span class="label-text mb-2 font-bold">Category</span>
                  <input
                    v-model="selectedComponent.category"
                    class="input input-bordered bg-base-100"
                    type="text"
                    maxlength="255"
                    placeholder="navigation, gallery, builder..."
                  />
                </label>

                <label class="form-control lg:col-span-2">
                  <span class="label-text mb-2 font-bold">Public description</span>
                  <textarea
                    v-model="selectedComponent.description"
                    class="textarea textarea-bordered min-h-28 bg-base-100"
                    placeholder="What this component does and where visitors encounter it..."
                  />
                </label>

                <label class="form-control">
                  <span class="label-text mb-2 font-bold">Canonical status</span>
                  <select
                    v-model="selectedStatus"
                    class="select select-bordered bg-base-100"
                  >
                    <option
                      v-for="option in statusOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="form-control">
                  <span class="label-text mb-2 font-bold">Preview mode</span>
                  <input
                    v-model="selectedComponent.previewMode"
                    class="input input-bordered bg-base-100"
                    type="text"
                    maxlength="64"
                    placeholder="fixture, live, context, unsupported..."
                  />
                </label>

                <label class="form-control lg:col-span-2">
                  <span class="label-text mb-2 font-bold">Public status reason</span>
                  <textarea
                    v-model="selectedComponent.statusReason"
                    class="textarea textarea-bordered min-h-24 bg-base-100"
                    placeholder="Explain why this exhibit needs context, is retired, or cannot preview..."
                  />
                </label>

                <label class="form-control lg:col-span-2">
                  <span class="label-text mb-2 font-bold">Internal curator notes</span>
                  <textarea
                    v-model="selectedComponent.notes"
                    class="textarea textarea-bordered min-h-32 bg-base-100"
                    placeholder="Private TODOs, implementation notes, and follow-up work..."
                  />
                </label>
              </div>
            </div>
          </details>'''

count = source.count(old)
if count != 1:
    raise RuntimeError(f'Expected one curator section, found {count}.')

path.write_text(source.replace(old, new, 1), encoding='utf-8')
